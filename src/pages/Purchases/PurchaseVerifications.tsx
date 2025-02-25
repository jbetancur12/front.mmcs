import React from 'react'
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import {
  Grid,
  IconButton,
  InputAdornment,
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
import { Edit, Info, Visibility } from '@mui/icons-material'
import { PurchaseVerification, PurchaseVerificationItem } from './Types'

/* Interfaces de Tipos */

/* Función para obtener las verificaciones */
const fetchPurchaseVerifications = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<PurchaseVerification[]>(
    '/purchaseVerifications'
  )
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
      accessorKey: 'techicalVerification',
      header: 'Verificación Técnica',
      Edit: ({ cell, row, column, table }) => {
        // Obtenemos el valor actual del campo (asegurando que sea un string)
        const currentValue = cell.getValue<string>() ?? ''

        // Función para manejar el cambio en el TextField
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          // Actualizamos el valor en el caché de edición de la fila para esta columna
          row._valuesCache[column.id] = e.target.value
          // Notificamos a la tabla que la fila se ha actualizado
          table.setEditingRow({ ...row })
        }

        // Obtenemos los requerimientos de la orden (puede ser un array de strings)
        const requirements = row.original?.purchaseOrder?.requirements || []

        const requirementsList = (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        )

        return (
          <TextField
            label='Verificación Tecnica'
            value={currentValue}
            onChange={handleChange}
            fullWidth
            margin='dense'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Tooltip title={requirementsList}>
                    <Info color='action' />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        )
      }
    },
    // Columna para editar los items con calificaciones
    // En el Edit y en el Cell, para el campo 'items'
    {
      accessorKey: 'items',
      header: 'Items y Calificaciones',
      enableEditing: true,
      /* Componente de edición personalizado para un arreglo */
      Edit: ({ cell, row, column, table }) => {
        const rawItems = cell.getValue()

        const items: PurchaseVerificationItem[] = Array.isArray(rawItems)
          ? rawItems
          : []

        // Función de ejemplo para manejar el cambio (puedes adaptarla para cada campo si es necesario)
        const handleItemChange = (
          event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          itemIndex: number,
          field: keyof PurchaseVerificationItem
        ) => {
          // Clonamos el arreglo de ítems y actualizamos el campo correspondiente
          const updatedItems = items.map((item, idx) =>
            idx === itemIndex ? { ...item, [field]: event.target.value } : item
          )
          // Actualizamos el caché de edición de la fila para la columna 'items'
          row._valuesCache[column.id] = updatedItems
          // Actualizamos el estado de edición en la tabla
          table.setEditingRow({ ...row })
        }

        return (
          <div>
            {items.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  marginBottom: 16,
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              >
                <Typography variant='subtitle2'>
                  - {item.orderItem.purchaseRequestItem.description}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Sensorial Inspection'
                      value={item.sensorialInspection}
                      onChange={(e) =>
                        handleItemChange(e, index, 'sensorialInspection')
                      }
                      fullWidth
                      margin='dense'
                    />
                    <TextField
                      label='Technical Verification'
                      value={item.technicalVerification}
                      onChange={(e) =>
                        handleItemChange(e, index, 'technicalVerification')
                      }
                      fullWidth
                      margin='dense'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label='Delivery Time'
                      value={item.devliveryTime}
                      onChange={(e) =>
                        handleItemChange(e, index, 'devliveryTime')
                      }
                      fullWidth
                      margin='dense'
                    />
                    <TextField
                      label='Quality'
                      value={item.quality}
                      onChange={(e) => handleItemChange(e, index, 'quality')}
                      fullWidth
                      margin='dense'
                    />
                  </Grid>
                </Grid>
              </div>
            ))}
          </div>
        )
      },
      /* Visualización resumida cuando no se edita */
      Cell: ({ cell }) => {
        const rawItems = cell.getValue()
        const items: PurchaseVerificationItem[] = Array.isArray(rawItems)
          ? rawItems
          : []
        return (
          <div>
            {items.map((item, index) => (
              <div key={item.id || index}>
                <Typography variant='caption'>
                  Item {index + 1}: {item.sensorialInspection},{' '}
                  {item.technicalVerification}, {item.devliveryTime},{' '}
                  {item.quality}
                </Typography>
              </div>
            ))}
          </div>
        )
      }
    }
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
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
        renderRowActions={({ row, table }) => {
          return (
            <Stack direction='row' spacing={1}>
              <Tooltip title='Ver'>
                <Link to={`${row?.original?.id ?? ''}`}>
                  <IconButton>
                    <Visibility />
                  </IconButton>
                </Link>
              </Tooltip>
              <Tooltip title='Editar'>
                <IconButton onClick={() => table.setEditingRow(row)}>
                  <Edit />
                </IconButton>
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
