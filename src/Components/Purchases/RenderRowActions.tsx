import {
  AddShoppingCart,
  Edit,
  MoreVert,
  NextPlanOutlined,
  RequestQuote,
  ThumbUpOutlined,
  Visibility
} from '@mui/icons-material'
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Stack
} from '@mui/material'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private'
import { QueryClient, useMutation } from 'react-query'
import { Link } from 'react-router-dom'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import { userStore } from 'src/store/userStore'
import Swal from 'sweetalert2'
import GenerateOrderModal from './GenerateOrderModal'

import { PurchaseRequest, PurchaseRequestItem } from 'src/pages/Purchases/Types'
import { useCan } from '@utils/functions'
import UploadQuotationModal from './UploadQuotationModal'
import { useState } from 'react'

import { PERMISSIONS } from 'src/constants/permissions'
type RenderRowActionsProps = {
  row: { original: PurchaseRequest }
  queryClient: QueryClient
  onEdit: () => void
}

const RenderRowActions = ({
  row,
  queryClient,
  onEdit
}: RenderRowActionsProps) => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)

  const status = row.original.status as PurchaseRequestStatus
  const allowActions = {
    creationOrder: useCan(PERMISSIONS.PURCHASES_ORDER_CREATE),
    // pre-aprobar, aprobar y rechazar
    approval: useCan(PERMISSIONS.PURCHASES_REQUEST_DECIDE)
  }

  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleOpenOrderModal = () => {
    setOrderModalOpen(true)
  }

  const handleManageQuotations = () => {
    setUploadModalOpen(true)
  }

  const mutation = useMutation(
    async ({
      id,
      action,
      payload
    }: {
      id: number
      action: string
      payload: any
    }) => {
      return await axiosPrivate.patch(
        `/purchaseRequests/${id}/${action}`,
        payload
      )
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('purchaseRequests')
      }
    }
  )

  const handleAction = async (
    id: number,
    action: 'pre-approve' | 'approve' | 'reject'
  ) => {
    let message = ''
    let payload: any = { userId: $userStore.email }

    // Si la acción es "reject", solicitamos el motivo
    if (action === 'reject') {
      const { value: reason } = await Swal.fire({
        title: 'Motivo de rechazo',
        input: 'text',
        inputLabel: 'Ingrese el motivo de rechazo',
        inputPlaceholder: 'Motivo de rechazo...',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      })

      if (!reason) return
      payload = { ...payload, rejectionReason: reason }
      message = '¿Está seguro de que desea rechazar esta solicitud?'
    } else if (action === 'pre-approve') {
      message = '¿Está seguro de que desea preaprobar esta solicitud?'
    } else if (action === 'approve') {
      message = '¿Está seguro de que desea aprobar esta solicitud?'
    }

    const result = await Swal.fire({
      title: 'Confirmación',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        await mutation.mutateAsync({ id, action, payload })
        Swal.fire('Éxito', 'La acción se realizó correctamente.', 'success')
      } catch (error) {
        Swal.fire('Error', 'No se pudo completar la acción.', 'error')
      }
    }
  }

  const isAllowed =
    row.original.approved &&
    row.original.preApproved &&
    row.original.quotations.some((quotation) => quotation.accepted)

  const items: PurchaseRequestItem[] = row.original.items || []

  const allProcessed = items.length > 0 && items.every((item) => item.procesed)
  const allUnprocessed =
    items.length > 0 && items.every((item) => !item.procesed)
  const mixedState = items.length > 0 && !allProcessed && !allUnprocessed

  const canApprove =
    allowActions.approval && status !== PurchaseRequestStatus.Rejected
  const canGenerate = allowActions.creationOrder

  // Por qué no se puede generar la orden (se muestra en el menú)
  const orderBlockedReason = !isAllowed
    ? 'Falta la cotización aceptada y la aprobación'
    : allProcessed
      ? 'Ya se generó la orden de todos los ítems'
      : ''

  // Acción principal: lo siguiente que toca hacer con esta solicitud
  let primary: {
    label: string
    icon: JSX.Element
    onClick: () => void
  } | null = null
  if (canApprove && status === PurchaseRequestStatus.Pending) {
    primary = {
      label: 'Preaprobar',
      icon: <NextPlanOutlined />,
      onClick: () => handleAction(row.original.id, 'pre-approve')
    }
  } else if (canApprove && status === PurchaseRequestStatus.PreApproved) {
    primary = {
      label: 'Aprobar',
      icon: <ThumbUpOutlined />,
      onClick: () => handleAction(row.original.id, 'approve')
    }
  } else if (canGenerate && !orderBlockedReason) {
    primary = {
      label: mixedState ? 'Completar orden' : 'Generar orden',
      icon: <AddShoppingCart />,
      onClick: handleOpenOrderModal
    }
  }

  const closeMenu = () => setMenuAnchor(null)

  return (
    <Stack direction='row' spacing={0.5} alignItems='center'>
      <Tooltip title='Ver'>
        <Link to={`${row.original.id}`}>
          <IconButton size='small' sx={{ color: '#00BFA5' }}>
            <Visibility />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip
        title={
          row.original.status === 'aprobado' && row.original.hasOrder
            ? 'Ya tiene orden, no se puede editar'
            : 'Editar solicitud'
        }
      >
        <span>
          <IconButton
            size='small'
            color='primary'
            onClick={onEdit}
            disabled={
              row.original.status === 'aprobado' && row.original.hasOrder
            }
          >
            <Edit />
          </IconButton>
        </span>
      </Tooltip>
      {primary && (
        <Button
          size='small'
          variant='contained'
          startIcon={primary.icon}
          onClick={primary.onClick}
          sx={{
            bgcolor: '#00BFA5',
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#00ACC1' }
          }}
        >
          {primary.label}
        </Button>
      )}
      <Tooltip title='Más acciones'>
        <IconButton
          size='small'
          aria-label='Más acciones'
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu()
            handleManageQuotations()
          }}
        >
          <ListItemIcon>
            <RequestQuote
              fontSize='small'
              color={row.original.quotations.length > 0 ? 'primary' : 'inherit'}
            />
          </ListItemIcon>
          <ListItemText
            primary='Gestionar cotizaciones'
            secondary={
              row.original.quotations.length > 0
                ? `${row.original.quotations.length} cargada(s)`
                : 'Sin cotizaciones'
            }
          />
        </MenuItem>
        {canGenerate && (
          <MenuItem
            disabled={!!orderBlockedReason}
            onClick={() => {
              closeMenu()
              handleOpenOrderModal()
            }}
          >
            <ListItemIcon>
              <AddShoppingCart fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Generar orden'
              secondary={orderBlockedReason || undefined}
            />
          </MenuItem>
        )}
      </Menu>

      <UploadQuotationModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        purchaseRequest={row.original}
        onSuccess={() => queryClient.invalidateQueries('purchaseRequests')}
      />
      <GenerateOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        purchaseRequest={row.original}
        onSuccess={() => queryClient.invalidateQueries('purchaseRequests')}
      />
    </Stack>
  )
}

export default RenderRowActions
