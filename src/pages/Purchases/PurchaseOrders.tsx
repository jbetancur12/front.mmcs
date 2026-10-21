import React, { useState, useMemo } from 'react'
import { MRT_ColumnDef } from 'material-react-table'
import {
  Button,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import {
  FactCheck,
  ListAlt,
  ReceiptLong,
  ScheduleSend,
  SendOutlined,
  Visibility
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseOrderData as IPurchaseOrder } from './Types'
import { differenceInDays, format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import Swal from 'sweetalert2'
import { Link } from 'react-router-dom'
import CreatePurchaseVerificationModal from 'src/Components/Purchases/PurchaseVerificationModal'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'

type QuickFilter = 'all' | 'unsent' | 'overdue' | 'unverified'

// Función para obtener las órdenes de compra
const fetchPurchaseOrders = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<IPurchaseOrder[]>('/purchaseOrders')
  return data
}

const PurchaseOrders: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient() //
  const { data, isLoading } = useQuery('purchaseOrders', () =>
    fetchPurchaseOrders(axiosPrivate)
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<IPurchaseOrder | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  const purchaseOrders = data ?? []

  const unsentCount = purchaseOrders.filter((o) => !o.sentAt).length
  const overdueCount = purchaseOrders.filter((o) => o.sendOverdue).length
  const unverifiedCount = purchaseOrders.filter((o) => !o.verified).length
  const toggleQuick = (value: QuickFilter) =>
    setQuickFilter((current) => (current === value ? 'all' : value))

  const markSent = useMutation(
    ({ id, sent }: { id: number; sent: boolean }) =>
      axiosPrivate.patch(`/purchaseOrders/${id}/sent`, { sent }),
    {
      onSuccess: () => queryClient.invalidateQueries('purchaseOrders'),
      onError: () => {
        Swal.fire('Error', 'No se pudo actualizar el envío de la orden', 'error')
      }
    }
  )

  const filteredOrders = useMemo(() => {
    switch (quickFilter) {
      case 'unsent':
        return purchaseOrders.filter((o) => !o.sentAt)
      case 'overdue':
        return purchaseOrders.filter((o) => o.sendOverdue)
      case 'unverified':
        return purchaseOrders.filter((o) => !o.verified)
      default:
        return purchaseOrders
    }
  }, [purchaseOrders, quickFilter])

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<IPurchaseOrder>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
      size: 160,
      Cell: ({ cell }) => (
        <Typography variant='body2' fontWeight={600} noWrap>
          {cell.getValue<string>()}
        </Typography>
      )
    },
    {
      accessorKey: 'requestDate',
      header: 'Fecha',
      size: 110,
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    {
      accessorKey: 'supplier.name',
      header: 'Proveedor',
      size: 220,
      Cell: ({ cell, row }) => (
        <Stack>
          <Typography variant='body2'>{cell.getValue<string>()}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {row.original.supplier?.phone}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'sent',
      header: 'Enviada',
      size: 170,
      enableSorting: false,
      Cell: ({ row }) => {
        const order = row.original
        return (
          <Stack direction='row' alignItems='center' spacing={0.5}>
            <Tooltip
              title={
                order.sentAt
                  ? `Enviada el ${format(new Date(order.sentAt), 'dd/MM/yyyy')}. Clic para desmarcar`
                  : 'Marcar como enviada al proveedor'
              }
            >
              <Checkbox
                size='small'
                checked={!!order.sentAt}
                disabled={markSent.isLoading}
                onChange={(e) =>
                  markSent.mutate({ id: order.id, sent: e.target.checked })
                }
              />
            </Tooltip>
            {order.sendOverdue && (
              <Chip
                size='small'
                color='error'
                variant='outlined'
                label={`Sin enviar · venció ${format(new Date(order.sendDeadline as string), 'dd/MM')}`}
              />
            )}
          </Stack>
        )
      }
    },
    {
      accessorKey: 'purchaseRequest.purchaseType',
      header: 'Tipo',
      size: 80,
      filterVariant: 'select',
      filterSelectOptions: ['I', 'II'],
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<string>()}
          size='small'
          variant='outlined'
          sx={{ minWidth: 36, fontWeight: 600 }}
        />
      )
    },
    {
      id: 'verification',
      header: 'Verificación',
      size: 150,
      accessorFn: (row) => (row.verified ? 'Verificada' : 'Por verificar'),
      Cell: ({ row }) => (
        <Chip
          size='small'
          variant='outlined'
          color={row.original.verified ? 'success' : 'warning'}
          label={row.original.verified ? 'Verificada' : 'Por verificar'}
        />
      )
    },
    {
      accessorKey: 'total',
      header: 'Total',
      size: 130,
      Cell: ({ cell }) => {
        const total = cell.getValue() as number
        return total
          ? new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(total)
          : 'N/A'
      }
    }
  ]

  // Función para abrir el modal con la orden seleccionada
  const openVerificationModal = (purchaseOrder: IPurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder)
    setModalOpen(true)
  }

  // Manejo del éxito en la creación de la verificación
  const handleVerificationSuccess = () => {
    // Aquí podrías refrescar los datos o mostrar una notificación
    queryClient.invalidateQueries('purchaseOrders')
    setModalOpen(false)
    setSelectedPurchaseOrder(null)
  }

  return (
    <>
      <PurchasesPage
        title='Órdenes de compra'
        subtitle='Controla que cada orden salga al proveedor y se verifique al recibirla'
        icon={<ReceiptLong />}
        stats={
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Todas'
                value={purchaseOrders.length}
                icon={<ListAlt />}
                tone='teal'
                active={quickFilter === 'all'}
                onClick={() => setQuickFilter('all')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Sin enviar'
                value={unsentCount}
                icon={<SendOutlined />}
                tone='blue'
                active={quickFilter === 'unsent'}
                onClick={() => toggleQuick('unsent')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Envío vencido (3 días hábiles)'
                value={overdueCount}
                icon={<ScheduleSend />}
                tone='red'
                active={quickFilter === 'overdue'}
                onClick={() => toggleQuick('overdue')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Sin verificar'
                value={unverifiedCount}
                icon={<FactCheck />}
                tone='orange'
                active={quickFilter === 'unverified'}
                onClick={() => toggleQuick('unverified')}
              />
            </Grid>
          </Grid>
        }
      >
        <DataTable
          columns={columns}
          data={filteredOrders}
          itemLabel={['orden', 'órdenes']}
          searchPlaceholder='Buscar órdenes'
          state={{ isLoading }}
          enableRowActions
          initialState={{ density: 'compact' }}
          // PurchasesPage ya pone el marco de la tabla
          muiTablePaperProps={{ elevation: 0 }}
          renderRowActions={({ row }) => (
            <RenderRowActions
              row={row}
              openVerificationModal={openVerificationModal}
            />
          )}
          muiTableBodyRowProps={({ row }) => {
            const { verified, requestDate, sendOverdue } = row.original

            if (sendOverdue) {
              return {
                sx: {
                  backgroundColor: 'rgba(244, 67, 54, 0.10)',
                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.18)' }
                }
              }
            }

            if (verified) return {}

            const daysPast = differenceInDays(new Date(), new Date(requestDate))
            if (daysPast > 20) {
              return {
                sx: {
                  backgroundColor: 'rgba(255, 165, 0, 0.15)',
                  '&:hover': { backgroundColor: 'rgba(255, 165, 0, 0.25)' }
                }
              }
            }
            return {}
          }}
        />
      </PurchasesPage>

      {selectedPurchaseOrder && (
        <CreatePurchaseVerificationModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedPurchaseOrder(null)
          }}
          onSuccess={handleVerificationSuccess}
          purchaseOrder={selectedPurchaseOrder}
        />
      )}
    </>
  )
}

export default PurchaseOrders

interface RenderRowActionsProps {
  row: any
  openVerificationModal: (purchaseOrder: IPurchaseOrder) => void
}

const RenderRowActions: React.FC<RenderRowActionsProps> = ({
  row,
  openVerificationModal
}) => {
  const isVerified = row.original.verified
  return (
    <Stack direction='row' spacing={0.5} alignItems='center'>
      <Tooltip title='Ver'>
        <IconButton
          component={Link}
          to={`${row.original.id}`}
          size='small'
          aria-label={`Ver ${row.original.code}`}
          sx={{ color: '#00695C' }}
        >
          <Visibility />
        </IconButton>
      </Tooltip>
      {!isVerified && (
        <Button
          size='small'
          variant='contained'
          startIcon={<FactCheck />}
          onClick={() => openVerificationModal(row.original)}
          sx={{
            bgcolor: '#00BFA5',
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#00ACC1' }
          }}
        >
          Verificar
        </Button>
      )}
    </Stack>
  )
}
