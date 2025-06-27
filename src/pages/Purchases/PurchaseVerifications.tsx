import React from 'react'
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import {
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { format } from 'date-fns'
import { useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Link } from 'react-router-dom'
import { Edit, Visibility } from '@mui/icons-material'
import { PurchaseVerification } from './Types'

/* Interfaces de Tipos */

/* Función para obtener las verificaciones */
const fetchPurchaseVerifications = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<PurchaseVerification[]>(
    '/purchaseVerifications'
  )
  console.log('PurchaseVerificationsTable loaded', data)
  return data
}

const PurchaseVerificationsTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery('purchaseVerifications', () =>
    fetchPurchaseVerifications(axiosPrivate)
  )

  const columns: MRT_ColumnDef<PurchaseVerification>[] = [
    { accessorKey: 'id', header: 'Id', enableEditing: false, Edit: () => null },
    {
      accessorKey: 'receivedDate',
      header: 'Fecha de Recibido',
      enableEditing: true,
      Cell: ({ cell }) => {
        const dateStr = cell.getValue<string>()
        return dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : 'N/A'
      },
      Edit: ({ cell, row, column, table }) => {
        // Convertir el valor almacenado a formato YYYY-MM-DD para el input de tipo date
        const dateValue = cell.getValue<string>()
          ? new Date(cell.getValue<string>()).toISOString().split('T')[0]
          : ''

        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          // Actualizamos el caché de edición de la fila para esta columna
          row._valuesCache[column.id] = e.target.value
          // Forzamos la actualización del estado de edición en la tabla
          table.setEditingRow({ ...row })
        }

        return (
          <TextField
            type='date'
            value={dateValue}
            onChange={handleDateChange}
          />
        )
      }
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Número de Factura',
      enableEditing: true
    },
    // Otras columnas de visualización, por ejemplo:
    {
      accessorFn: (row) => row.purchaseOrder.code,
      header: 'Orden No',
      enableEditing: false,
      Edit: () => null
    },
    {
      accessorFn: (row) => row.purchaseOrder.purchaseRequest.purchaseCode,
      header: 'Solicitud No',
      enableEditing: false,
      Edit: () => null
    },
    {
      accessorFn: (row) => row.observations || 'N/A',
      header: 'Obervaciones',
      enableEditing: true,
      enableHiding: true
    },
    {
      accessorFn: (row) => row.verifiedBy || 'N/A',
      header: 'Veirificado por',
      enableEditing: true
    },
    {
      accessorKey: 'dateVerified',
      header: 'Fecha de Verificación',
      enableEditing: true,
      Cell: ({ cell }) => {
        const dateStr = cell.getValue<string>()
        return dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : 'N/A'
      },
      Edit: ({ cell, row, column, table }) => {
        // Convertir el valor almacenado a formato YYYY-MM-DD para el input de tipo date
        const dateValue = cell.getValue<string>()
          ? new Date(cell.getValue<string>()).toISOString().split('T')[0]
          : ''

        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          // Actualizamos el caché de edición de la fila para esta columna
          row._valuesCache[column.id] = e.target.value
          // Forzamos la actualización del estado de edición en la tabla
          table.setEditingRow({ ...row })
        }

        return (
          <TextField
            type='date'
            value={dateValue}
            onChange={handleDateChange}
          />
        )
      }
    }

    // Columna para editar los items con calificaciones
    // En el Edit y en el Cell, para el campo 'items'
  ]

  const handleSave = async ({
    exitEditingMode,
    row,
    values
  }: {
    exitEditingMode: () => void
    row: MRT_Row<PurchaseVerification>
    table: any // puedes ajustar el tipo según tus necesidades
    values: Record<string, any>
  }) => {
    try {
      const updatedData = { ...row.original, ...values }
      await axiosPrivate.put(
        `/purchaseVerifications/${updatedData.id}`,
        updatedData
      )
      exitEditingMode() // Salir del modo edición una vez guardado
      // // Aquí puedes invalidar la query para refrescar los datos
      queryClient.invalidateQueries('purchaseVerifications')
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  if (isLoading) return <Typography variant='h6'>Cargando...</Typography>

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Verificaciones
      </Typography>
      <MaterialReactTable
        enableEditing
        localization={MRT_Localization_ES}
        columns={columns}
        data={data ?? []}
        state={{ isLoading }}
        enablePagination
        enableSorting
        enableRowActions
        initialState={{
          columnVisibility: {
            id: false,
            items: false
          }
        }}
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
        renderRowActions={({ row, table }) => {
          return (
            <Stack direction='row' spacing={0}>
              <Tooltip title='Editar'>
                <IconButton
                  size='small'
                  onClick={() => table.setEditingRow(row)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title='Ver'>
                <Link to={`${row?.original?.id ?? ''}`}>
                  <IconButton security='small'>
                    <Visibility />
                  </IconButton>
                </Link>
              </Tooltip>
            </Stack>
          )
        }}
        onEditingRowSave={handleSave}
      />
    </>
  )
}

export default PurchaseVerificationsTable
