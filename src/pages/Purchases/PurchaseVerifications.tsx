import React from 'react'
import { MRT_ColumnDef, MRT_Row } from 'material-react-table'
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { format, isSameMonth } from 'date-fns'
import { useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { Link } from 'react-router-dom'
import {
  CalendarMonth,
  Edit,
  FactCheck,
  ListAlt,
  SpeakerNotes,
  Visibility
} from '@mui/icons-material'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import DataTable from 'src/Components/Common/DataTable'
import { PURCHASE_TEAL } from 'src/Components/Purchases/purchaseTableStyle'
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
    {
      accessorKey: 'id',
      header: 'Id',
      size: 60,
      enableEditing: false,
      Edit: () => null
    },
    {
      accessorKey: 'receivedDate',
      header: 'Recibido el',
      size: 120,
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
      header: 'Factura',
      size: 130,
      enableEditing: true
    },
    // Otras columnas de visualización, por ejemplo:
    {
      accessorFn: (row) => row.purchaseOrder.code,
      header: 'Orden',
      size: 160,
      enableEditing: false,
      Cell: ({ cell }) => (
        <Typography variant='body2' fontWeight={600} noWrap>
          {cell.getValue<string>()}
        </Typography>
      ),
      Edit: () => null
    },
    {
      accessorFn: (row) => row.purchaseOrder.purchaseRequest.purchaseCode,
      header: 'Solicitud',
      size: 160,
      enableEditing: false,
      Edit: () => null
    },
    {
      accessorFn: (row) => row.observations || 'N/A',
      header: 'Observaciones',
      size: 300,
      enableEditing: true,
      enableHiding: true,
      Cell: ({ cell }) => {
        const text = cell.getValue<string>()
        return (
          <Tooltip title={text} arrow placement='top-start'>
            <Typography
              variant='body2'
              color={text === 'N/A' ? 'text.secondary' : 'text.primary'}
              sx={{
                maxWidth: 300,
                whiteSpace: 'normal',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {text}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      accessorFn: (row) => row.verifiedBy || 'N/A',
      header: 'Verificó',
      size: 200,
      enableEditing: true,
      Cell: ({ cell }) => {
        const name = cell.getValue<string>()
        if (name === 'N/A') return name
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
          .toUpperCase()
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: PURCHASE_TEAL,
                width: 28,
                height: 28,
                fontSize: 12
              }}
            >
              {initials}
            </Avatar>
            <Typography variant='body2' noWrap>
              {name}
            </Typography>
          </Box>
        )
      }
    },
    {
      accessorKey: 'dateVerified',
      header: 'Verificada el',
      size: 120,
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

  const verifications = data ?? []
  const now = new Date()
  const thisMonth = verifications.filter(
    (v) => v.receivedDate && isSameMonth(new Date(v.receivedDate), now)
  ).length
  const withNotes = verifications.filter(
    (v) => v.observations && v.observations.trim() !== ''
  ).length

  return (
    <PurchasesPage
      title='Verificaciones'
      subtitle='Revisa lo recibido contra cada orden de compra'
      icon={<FactCheck />}
      stats={
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <LmsStatCard variant='quiet'
              label='Verificaciones'
              value={verifications.length}
              icon={<ListAlt />}
              tone='teal'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard variant='quiet'
              label='Recibidas este mes'
              value={thisMonth}
              icon={<CalendarMonth />}
              tone='blue'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard variant='quiet'
              label='Con observaciones'
              value={withNotes}
              icon={<SpeakerNotes />}
              tone='orange'
            />
          </Grid>
        </Grid>
      }
    >
      <DataTable
        enableEditing
        columns={columns}
        data={data ?? []}
        itemLabel={['verificación', 'verificaciones']}
        searchPlaceholder='Buscar verificaciones'
        state={{ isLoading }}
        enablePagination
        enableSorting
        enableRowActions
        initialState={{
          density: 'compact',
          columnVisibility: {
            id: false,
            items: false
          }
        }}
        // PurchasesPage ya pone el marco de la tabla
        muiTablePaperProps={{ elevation: 0 }}
        renderRowActions={({ row, table }) => {
          return (
            <Stack direction='row' spacing={0}>
              <Tooltip title='Ver'>
                <IconButton
                  component={Link}
                  to={`${row?.original?.id ?? ''}`}
                  size='small'
                  aria-label={`Ver verificación de ${row.original.purchaseOrder.code}`}
                  sx={{ color: '#00695C' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title='Editar'>
                <IconButton
                  size='small'
                  aria-label={`Editar verificación de ${row.original.purchaseOrder.code}`}
                  sx={{ color: '#2563eb' }}
                  onClick={() => table.setEditingRow(row)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        }}
        onEditingRowSave={handleSave}
      />
    </PurchasesPage>
  )
}

export default PurchaseVerificationsTable
