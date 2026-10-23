// src/components/Purchases/SupplierPurchaseHistoryTable.tsx
import React, { useMemo } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Link
} from '@mui/material'
import {
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row
} from 'material-react-table'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import DataTable from 'src/Components/Common/DataTable'
import { useNavigate } from 'react-router-dom'
import { CheckCircleOutline, HighlightOff } from '@mui/icons-material' // Icono para ver detalle de orden

// Importar el tipo desde tu archivo central de tipos
import { PurchaseHistoryEntry } from 'src/pages/Purchases/Types' // Ajusta la ruta
import { isAxiosError } from 'axios'
import { notify } from 'src/utils/notify'
import { busyDialog } from 'src/utils/confirm'

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
      busyDialog.show(
        'Generando Reporte...',
        `Por favor espera mientras se genera el PDF para la orden ${orderCode}.`
      )

      // El endpoint que mencionaste, ajusta la ruta base si es necesario (ej. si api() da /api)
      const reportUrl = `/reports/fog-mmcs-13/${purchaseOrderId}`

      const response = await axiosPrivate.get(reportUrl, {
        responseType: 'blob' // Importante para manejar la respuesta como archivo
      })

      busyDialog.hide()

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
        notify.warning(
          'Error de Navegador',
          'Tu navegador bloqueó la apertura de una nueva pestaña. Por favor, permite pop-ups para este sitio.'
        )
      }
    } catch (err) {
      busyDialog.hide()
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
      notify.error('Error', errorMessage)
    }
  }

  const columns = useMemo<MRT_ColumnDef<PurchaseHistoryEntry>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Orden',
        size: 160,
        Cell: ({
          cell,
          row
        }: {
          cell: MRT_Cell<PurchaseHistoryEntry>
          row: MRT_Row<PurchaseHistoryEntry>
        }) => (
          <Link
            component='button'
            type='button'
            variant='body2'
            underline='hover'
            aria-label={`Abrir el PDF de la orden ${row.original.code}`}
            onClick={() =>
              handleViewOrderReportPDF(row.original.id, row.original.code)
            }
            sx={{ color: '#00695C', fontWeight: 600, textAlign: 'left' }}
          >
            {cell.getValue<string>()}
          </Link>
        )
      },
      {
        accessorKey: 'requestDate', // Asegúrate que este sea el nombre del campo
        header: 'Fecha de la orden',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<PurchaseHistoryEntry> }) => {
          const dateValue = cell.getValue<string>()
          if (!dateValue) return <span />
          return (
            <span style={{ whiteSpace: 'nowrap' }}>
              {new Date(dateValue).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                // Interpreta la fecha como UTC para mostrar el día correcto
                timeZone: 'UTC'
              })}
            </span>
          )
        }
      },
      {
        accessorKey: 'total', // O el nombre de campo de total que uses
        header: 'Total',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<PurchaseHistoryEntry> }) => (
          <span>
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(cell.getValue<number>())}
          </span>
        ),
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' }
      },
      {
        // --- COLUMNA MODIFICADA ---
        accessorKey: 'verified', // Cambiado de 'status'
        header: 'Verificado', // Nuevo encabezado
        size: 100,
        Cell: ({ cell }: { cell: MRT_Cell<PurchaseHistoryEntry> }) => {
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
    <Box sx={{ mt: 3 }}>
      <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
        Historial de compras
      </Typography>
      {!isLoading && purchaseHistory.length === 0 && !isError && (
        <Typography sx={{ color: 'text.secondary' }}>
          No se encontraron compras para este proveedor.
        </Typography>
      )}
      {purchaseHistory.length > 0 && (
        <DataTable
          columns={columns}
          data={purchaseHistory}
          itemLabel={['compra', 'compras']}
          searchPlaceholder='Buscar compras'
          enableColumnFilters
          enablePagination
          enableSorting
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
        />
      )}
    </Box>
  )
}

export default SupplierPurchaseHistoryTable
