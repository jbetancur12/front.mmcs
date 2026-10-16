import React, { useState, useMemo } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography
} from '@mui/material'
import {
  AssignmentTurnedIn,
  FactCheck,
  HourglassEmpty,
  Visibility
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseOrderData as IPurchaseOrder } from './Types'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { differenceInDays, format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import Swal from 'sweetalert2'
import { Link } from 'react-router-dom'
import CreatePurchaseVerificationModal from 'src/Components/Purchases/PurchaseVerificationModal'

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
  const [showOnlyUnverified, setShowOnlyUnverified] = useState(false)
  const [showOnlyUnsent, setShowOnlyUnsent] = useState(false)

  const purchaseOrders = data ?? []

  const overdueCount = purchaseOrders.filter((o) => o.sendOverdue).length

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
    return purchaseOrders.filter(
      (order) =>
        (!showOnlyUnverified || !order.verified) &&
        (!showOnlyUnsent || !order.sentAt)
    )
  }, [purchaseOrders, showOnlyUnverified, showOnlyUnsent])

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<IPurchaseOrder>[] = [
    { accessorKey: 'code', header: 'Código' },
    {
      accessorKey: 'requestDate',
      header: 'Fecha de Orden',
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    { accessorKey: 'supplier.name', header: 'Proveedor' },
    { accessorKey: 'supplier.phone', header: 'Teléfono' },
    {
      id: 'sent',
      header: 'Enviada',
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
      filterVariant: 'select',
      filterSelectOptions: ['I', 'II']
    },
    {
      accessorKey: 'total',
      header: 'Total',
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h5'>Órdenes de Compra</Typography>
        <Stack direction='row' spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyUnsent}
              onChange={(e) => setShowOnlyUnsent(e.target.checked)}
              color='primary'
            />
          }
          label='Mostrar solo sin enviar'
        />
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyUnverified}
              onChange={(e) => setShowOnlyUnverified(e.target.checked)}
              color='primary'
            />
          }
          label='Mostrar solo sin verificar'
        />
        </Stack>
      </Box>

      {overdueCount > 0 && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {overdueCount === 1
            ? '1 orden de compra no se ha enviado al proveedor y ya pasó el plazo de 3 días hábiles desde la cotización.'
            : `${overdueCount} órdenes de compra no se han enviado al proveedor y ya pasó el plazo de 3 días hábiles desde la cotización.`}
        </Alert>
      )}

      <MaterialReactTable
        columns={columns}
        data={filteredOrders}
        state={{ isLoading }}
        localization={MRT_Localization_ES}
        enableRowActions={true}
        renderRowActions={({ row }) => (
          <RenderRowActions
            row={row}
            openVerificationModal={openVerificationModal}
          />
        )}
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
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

          // Si ya está verificado, no hacemos nada.
          if (verified) {
            return {}
          }

          // Calculamos los días que han pasado.
          const daysPast = differenceInDays(new Date(), new Date(requestDate))

          // Si han pasado más de 20 días, aplicamos el estilo.
          if (daysPast > 20) {
            return {
              sx: {
                // Usamos un color de advertencia con transparencia para que no sea muy agresivo
                // y funcione bien tanto en tema claro como oscuro.
                backgroundColor: 'rgba(255, 165, 0, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 165, 0, 0.25)' // Opcional: intensificar en hover
                }
              }
            }
          }

          // Si no cumple la condición, no se aplica ningún estilo especial.
          return {}
        }}
      />

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
    <Stack direction='row' spacing={0} alignItems='center'>
      {isVerified ? (
        <AssignmentTurnedIn color='success' />
      ) : (
        <HourglassEmpty color='disabled' />
      )}
      <Divider orientation='vertical' flexItem />
      <Tooltip title='Ver'>
        <Link to={`${row.original.id}`}>
          <IconButton size='small'>
            <Visibility />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip
        title={isVerified ? 'Verificación creada' : 'Crear Verificación'}
      >
        {/* El span es necesario para que el tooltip funcione en un botón deshabilitado */}
        <span>
          <IconButton
            size='small'
            onClick={() => openVerificationModal(row.original)}
            disabled={isVerified}
          >
            <FactCheck color={isVerified ? 'disabled' : 'secondary'} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
