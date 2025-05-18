// src/components/Purchases/SupplierPurchaseHistoryTable.tsx
import React, { useMemo } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { useNavigate } from 'react-router-dom'
import { CheckCircleOutline, HighlightOff } from '@mui/icons-material' // Icono para ver detalle de orden

// Importar el tipo desde tu archivo central de tipos
import { PurchaseHistoryEntry } from 'src/pages/Purchases/Types' // Ajusta la ruta
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'

interface SupplierPurchaseHistoryTableProps {
  supplierId: string | number
}

const SupplierPurchaseHistoryTable: React.FC<
  SupplierPurchaseHistoryTableProps
> = ({ supplierId }) => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  const {
    data: purchaseHistory = [], // Valor por defecto es un array vacío
    isLoading,
    isError,
    error,
    isFetching // Para la barra de progreso en refetches
  } = useQuery<PurchaseHistoryEntry[], Error>(
    ['supplierPurchaseHistory', supplierId], // Query key incluye supplierId
    async () => {
      const response = await axiosPrivate.get<PurchaseHistoryEntry[]>(
        `/purchaseOrders/${supplierId}/purchase-history`
      )
      return response.data
    },
    {
      enabled: !!supplierId // Solo ejecutar si supplierId está presente
    }
  )

  const handleViewOrderReportPDF = async (
    purchaseOrderId: number | string,
    orderCode: string
  ) => {
    try {
      Swal.fire({
        title: 'Generando Reporte...',
        text: `Por favor espera mientras se genera el PDF para la orden ${orderCode}.`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // El endpoint que mencionaste, ajusta la ruta base si es necesario (ej. si api() da /api)
      const reportUrl = `/reports/fog-mmcs-13/${purchaseOrderId}`

      const response = await axiosPrivate.get(reportUrl, {
        responseType: 'blob' // Importante para manejar la respuesta como archivo
      })

      Swal.close() // Cerrar el loader de Swal

      const effectiveMimeType =
        response.headers['content-type'] || 'application/pdf'
      const blob = new Blob([response.data], { type: effectiveMimeType })
      const fileURL = URL.createObjectURL(blob)

      const newWindow = window.open(fileURL, '_blank')
      if (newWindow) {
        newWindow.focus()
        setTimeout(() => {
          // Dar tiempo a que la pestaña cargue antes de intentar cambiar el título
          try {
            newWindow.document.title = `Orden ${orderCode} - FOGC-MMCS-13`
          } catch (e) {
            console.warn('No se pudo cambiar el título de la pestaña.')
          }
        }, 500)
      } else {
        Swal.fire(
          'Error de Navegador',
          'Tu navegador bloqueó la apertura de una nueva pestaña. Por favor, permite pop-ups para este sitio.',
          'warning'
        )
      }
    } catch (err) {
      Swal.close() // Asegurarse de cerrar el loader de Swal en caso de error
      console.error(
        `Error obteniendo el reporte PDF para la orden ID ${purchaseOrderId}:`,
        err
      )
      let errorMessage =
        'No se pudo generar o mostrar el reporte PDF de la orden de compra.'
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage =
            'Reporte o datos para la orden de compra no encontrados.'
        } else if (err.response?.data?.message) {
          errorMessage =
            typeof err.response.data.message === 'string'
              ? err.response.data.message
              : JSON.stringify(err.response.data.message)
        } else if (err.message) {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      Swal.fire('Error', errorMessage, 'error')
    }
  }

  const columns = useMemo<MRT_ColumnDef<PurchaseHistoryEntry>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Núm. Orden',
        size: 150,
        Cell: (
          { cell, row } // Celda personalizada para enlazar al detalle de la orden
        ) => (
          <Typography
            component='a'
            onClick={() =>
              handleViewOrderReportPDF(row.original.id, row.original.code)
            } // Llamar al nuevo handler
            sx={{
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': { color: 'secondary.main' }
            }}
          >
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        accessorKey: 'requestDate', // Asegúrate que este sea el nombre del campo
        header: 'Fecha Orden', // O "Fecha Solicitud" si es más apropiado
        size: 120,
        Cell: ({ cell }) => {
          const dateValue = cell.getValue<string>()
          if (!dateValue) return '' // Manejar si la fecha es nula o indefinida
          const date = new Date(dateValue) // Parsea la cadena ISO 8601 completa
          return date.toLocaleDateString('es-CO', {
            // es-CO para formato colombiano
            year: 'numeric',
            month: 'short', // 'long' para "mayo", 'short' para "may.", 'numeric' para "5"
            day: 'numeric',
            timeZone: 'UTC' // Interpreta la fecha como si fuera UTC para mostrar el día correcto
          })
        }
      },
      {
        accessorKey: 'total', // O el nombre de campo de total que uses
        header: 'Monto Total',
        size: 150,
        Cell: ({ cell }) =>
          new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(cell.getValue<number>()),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: {
          style: { justifyContent: 'flex-end', textAlign: 'right' }
        } // Para alinear el header
      },
      {
        // --- COLUMNA MODIFICADA ---
        accessorKey: 'verified', // Cambiado de 'status'
        header: 'Verificado', // Nuevo encabezado
        size: 100,
        muiTableBodyCellProps: { align: 'center' },
        muiTableHeadCellProps: { sx: { textAlign: 'center' } }, // Centrar también el header
        Cell: ({ cell }) => {
          const isVerified = cell.getValue<boolean>()
          return isVerified ? (
            <Chip
              icon={<CheckCircleOutline />}
              label='Sí'
              color='success'
              size='small'
              variant='outlined'
            />
          ) : (
            <Chip
              icon={<HighlightOff />}
              label='No'
              color='default'
              size='small'
              variant='outlined'
            />
          )
          // Alternativa simple con texto:
          // return isVerified ? <Typography color="success.main">Sí</Typography> : <Typography color="text.secondary">No</Typography>;
        }
      }
    ],
    [navigate]
  )

  if (isLoading && !purchaseHistory.length) {
    // Mostrar solo si es la carga inicial y no hay datos cacheados
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          my: 3,
          p: 2
        }}
      >
        <CircularProgress size={24} sx={{ mr: 1 }} />{' '}
        <Typography>Cargando historial de compras...</Typography>
      </Box>
    )
  }

  // No mostrar error si hay datos cacheados y solo está refetching en background
  if (isError && !purchaseHistory.length) {
    return (
      <Alert severity='error' sx={{ my: 2 }}>
        Error al cargar el historial de compras: {error?.message}
      </Alert>
    )
  }

  return (
    <Paper elevation={2} sx={{ mt: 3 }}>
      {' '}
      {/* Quitado p:0 para que MRT maneje sus paddings internos */}
      <Typography variant='h5' sx={{ p: 2, pb: 1 }} gutterBottom>
        Historial de Compras
      </Typography>
      {!isLoading && purchaseHistory.length === 0 && !isError && (
        <Typography sx={{ p: 2, pt: 0, color: 'text.secondary' }}>
          No se encontraron compras para este proveedor.
        </Typography>
      )}
      {purchaseHistory.length > 0 && (
        <MaterialReactTable
          columns={columns}
          data={purchaseHistory}
          enableRowActions={false} // Puedes habilitar acciones por fila si necesitas (ej. ver detalle de PO)
          // renderRowActions={({ row }) => (
          //   <Tooltip title="Ver Detalle de Orden">
          //     <IconButton onClick={() => navigate(`/purchases/orders/details/${row.original.id}`)} size="small">
          //       <ViewOrderIcon />
          //     </IconButton>
          //   </Tooltip>
          // )}
          enableColumnFilters
          enablePagination
          enableSorting
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableHiding={false}
          muiTableContainerProps={{ sx: { maxHeight: '400px' } }} // Ajusta la altura máxima
          muiToolbarAlertBannerProps={
            isError && isFetching
              ? {
                  // Mostrar solo si hay error Y está intentando recargar
                  color: 'error',
                  children: `Error actualizando historial: ${error?.message}`
                }
              : undefined
          }
          initialState={{
            density: 'compact',
            pagination: { pageSize: 5, pageIndex: 0 },
            sorting: [{ id: 'requestDate', desc: true }] // Ordenar por fecha más reciente
            // showGlobalFilter: true, // Habilitar si quieres búsqueda global
          }}
          state={{
            showProgressBars: isFetching // Barra de progreso para recargas
          }}
          localization={MRT_Localization_ES}
        />
      )}
    </Paper>
  )
}

export default SupplierPurchaseHistoryTable
