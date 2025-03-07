import { Autorenew, Edit, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  styled,
  Table as MuiTable,
  Tooltip,
  Divider,
  IconButton
} from '@mui/material'

import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { differenceInDays, format } from 'date-fns'

import { Link } from 'react-router-dom'
import Loader from './Loader2'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import StatusUpdateModal from './Quotations/StatusUpdateModal'

// Define interfaces
export interface QuoteData {
  id: number
  products: any // Se puede reemplazar por un tipo específico si conoces la estructura de los productos
  subtotal: number
  discountRatio: number
  total: number
  taxRatio: number
  taxTotal: number
  discountTotal: number
  observations: string
  comments: any
  otherFields: any
  customer: {
    nombre: string
    email: string
    telefono: string
    direccion: string
    ciudad: string
    identificacion: string
  }
  createdAt: string
  status: Record<string, any>
}

// API URL

export const statusOptions: Record<string, string> = {
  created: 'Creada',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  delivered: 'Entregada',
  canceled: 'Cancelada',
  invoiced: 'Facturada',
  paid: 'Pagada',
  pending: 'Pendiente',
  onCalibration: 'En calibración',
  onMaintenance: 'En mantenimiento',
  completed: 'Realizado'
}

export const statusTransitions: Record<string, string[]> = {
  created: ['sent'],
  sent: ['accepted', 'rejected', 'pending'],
  accepted: ['onCalibration', 'onMaintenance'],
  rejected: [],
  delivered: [],
  canceled: [],
  invoiced: ['paid'],
  paid: [],
  pending: [],
  onCalibration: ['completed'],
  onMaintenance: ['completed'],
  completed: ['invoiced', 'paid', 'delivered']
}

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 'bold',
  // backgroundColor: theme.palette.common.black,
  // color: theme.palette.common.white,
  border: 'none', // Eliminar bordes
  fontFamily: 'Roboto',
  lineHeight: 0.1,
  marginBottom: 20
}))

const StyledTableBodycell = styled(TableCell)(() => ({
  border: 'none', // Eliminar bordes
  fontFamily: 'Roboto',
  paddingTop: 0,
  paddingBottom: 0
}))

// Main component
const Table: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const [tableData, setTableData] = useState<QuoteData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [openModal, setOpenModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null)

  // Fetch devices data
  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const response = await axiosPrivate.get(`/quotes`, {})

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching device data:', error)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  // Función para actualizar el estado
  const updateStatus = async (
    id: number,
    newStatus: string,
    comments: string
  ) => {
    try {
      const response = await axiosPrivate.put(`/quotes/${id}/status`, {
        status: {
          status: newStatus,
          user: $userStore.nombre,
          date: new Date(),
          comments: comments
        }
      })

      if (response.status >= 200 && response.status < 300) {
        toast.success('Estado actualizado exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
        fetchQuotes() // Refrescar la tabla después de actualizar el estado
      } else {
        throw new Error('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error de red:', error)
      toast.error(
        'Error al actualizar el estado. Por favor, inténtalo de nuevo.'
      )
    }
  }

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<QuoteData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '# Cotización',
        size: 80,
        Cell: ({ row }) => <Box>VT-{row.original.id}</Box>
      },
      {
        accessorKey: 'customer.nombre',
        header: 'Cliente',
        size: 100
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 50,
        Cell: ({ row }) => {
          const status = row.original.status[row.original.status.length - 1]
          const dateDifference = differenceInDays(
            new Date(),
            new Date(status.date)
          )

          // Verificar si el estado es "onCalibration" o "onMaintenance" y han pasado más de 10 días
          const isOverdue =
            (status.status === 'onCalibration' ||
              status.status === 'onMaintenance') &&
            dateDifference > 10

          return (
            <Box
              sx={{
                fontWeight: 'bold',
                color: isOverdue
                  ? '#f44336'
                  : status.status === 'delivered'
                    ? '#4CAF50'
                    : 'inherit'
              }}
            >
              {statusOptions[status.status]}
            </Box>
          )
        }
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 50,
        Cell: ({ row }) =>
          new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(row.original.total)
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        size: 50,
        Cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'yyyy-MM-dd')
      }
    ],
    [] // No hay dependencias específicas aquí
  )

  const handleUpdateStatus = (newStatus: string, comments: string) => {
    if (selectedQuote) {
      updateStatus(selectedQuote.id, newStatus, comments)
    }
  }

  return (
    <>
      <Toaster />
      <Loader loading={loading} />
      <Link to='new-quote'>
        <Button
          variant='contained'
          sx={{
            fontWeight: 'bold',
            color: '#DCFCE7',
            marginBottom: '1rem'
          }}
        >
          Crear Cotización
        </Button>
      </Link>
      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        enableRowActions={true}
        // enableColumnResizing={true}
        positionActionsColumn='last'
        localization={MRT_Localization_ES}
        // displayColumnDefOptions={{
        //   "mrt-row-actions": {
        //     muiTableHeadCellProps: {
        //       align: "center",
        //     },
        //     // size: 120,
        //   },
        // }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              textAlign: 'center'
            },
            '& .Mui-TableHeadCell-Content': {
              justifyContent: 'center'
            },
            '& .Mui-TableBodyCell-DetailPanel': {
              background: '#d6f7cf'
            }
          }
        }}
        columns={columns}
        data={tableData}
        initialState={{
          sorting: [
            {
              id: 'id',
              desc: true
            }
          ]
        }}
        // editingMode="modal" //default

        // enableEditing
        // onEditingRowSave={handleSaveRowEdits}
        // onEditingRowCancel={handleCancelRowEdits}
        // initialState={{
        //   columnVisibility: { id: false },
        // }}
        renderDetailPanel={({ row }) => {
          return (
            <MuiTable
              sx={{
                width: '550px',
                border: 'none',

                borderRadius: '5px',
                padding: '10px',
                fontFamily: 'Roboto'
              }}
              size='small'
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell>Fecha</StyledTableCell>
                  <StyledTableCell>Estado</StyledTableCell>
                  <StyledTableCell>Usuario</StyledTableCell>
                  <StyledTableCell>Observaciones</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {row.original.status.map((status: any, index: number) => {
                  const dateDifference = differenceInDays(
                    new Date(),
                    new Date(status.date)
                  )

                  // Verificar si el estado es "onCalibration" o "onMaintenance" y han pasado más de 10 días
                  const isOverdue =
                    (status.status === 'onCalibration' ||
                      status.status === 'onMaintenance') &&
                    dateDifference > 1
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        background: isOverdue
                          ? '#f44336'
                          : status.status === 'delivered'
                            ? '#4CAF50'
                            : 'inherit'
                      }}
                    >
                      <StyledTableBodycell component='th' scope='row'>
                        {format(new Date(status.date), 'yyyy-MM-dd HH:mm')}
                      </StyledTableBodycell>
                      <StyledTableBodycell>
                        {statusOptions[status.status]}
                      </StyledTableBodycell>
                      <StyledTableBodycell>{status.user}</StyledTableBodycell>
                      <StyledTableBodycell>
                        {status.comments}
                      </StyledTableBodycell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </MuiTable>
          )
        }}
        renderRowActions={({ row }) => {
          return (
            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                // width: 20,
                justifyContent: 'center'
              }}
            >
              <Tooltip arrow placement='right' title='Ver'>
                <Link to={`${row.original.id}`}>
                  <Visibility />
                </Link>
              </Tooltip>

              <Tooltip arrow placement='right' title='Editar'>
                <Link to={`edit-quote/${row.original.id}`}>
                  <Edit />
                </Link>
              </Tooltip>
              <Divider orientation='vertical' flexItem />
              <IconButton
                onClick={() => {
                  setSelectedQuote(row.original)
                  setOpenModal(true)
                }}
              >
                <Autorenew />
              </IconButton>
            </Box>
          )
        }}
      />
      <StatusUpdateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        quote={selectedQuote}
        onUpdate={handleUpdateStatus}
      />
    </>
  )
}

//example of creating a mui dialog modal for creating new rows

export default Table
