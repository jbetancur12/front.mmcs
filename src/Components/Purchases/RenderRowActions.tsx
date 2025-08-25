import {
  AddShoppingCart,
  Edit,
  NextPlanOutlined,
  RequestQuote,
  ThumbUpOutlined,
  Visibility
} from '@mui/icons-material'
import { IconButton, Tooltip, Stack, Divider } from '@mui/material'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private'
import { QueryClient, useMutation } from 'react-query'
import { Link } from 'react-router-dom'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import { userStore } from 'src/store/userStore'
import Swal from 'sweetalert2'
import GenerateOrderModal from './GenerateOrderModal'

import { PurchaseRequest, PurchaseRequestItem } from 'src/pages/Purchases/Types'
import { useHasRole } from '@utils/functions'
import UploadQuotationModal from './UploadQuotationModal'
import { useState } from 'react'

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
    creationOrder: useHasRole(['admin', 'comp_requester', 'comp_admin']),
    approval: useHasRole(['admin', 'comp_approver', 'comp_admin'])
  }

  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

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

  return (
    <Stack direction='row' spacing={0}>
      <Tooltip title='Editar Solicitud'>
        <IconButton
          size='small'
          onClick={onEdit}
          disabled={row.original.status === 'aprobado' && row.original.hasOrder}
          sx={{
            color: 'rgba(0, 0, 0, 0.54)', // Gris oscuro cuando está habilitado
            '&.Mui-disabled': {
              color: 'rgba(0, 0, 0, 0.26)' // Gris claro cuando está deshabilitado
            }
          }}
        >
          <Edit />
        </IconButton>
      </Tooltip>
      <Tooltip title='Ver'>
        <Link to={`${row.original.id}`}>
          <IconButton size='small'>
            <Visibility />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip title='Gestionar Cotizaciones'>
        <IconButton
          size='small'
          onClick={handleManageQuotations}
          color={row.original.quotations.length > 0 ? 'primary' : 'default'}
        >
          <RequestQuote />
        </IconButton>
      </Tooltip>
      <Divider orientation='vertical' flexItem />

      <UploadQuotationModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        purchaseRequest={row.original}
        onSuccess={() => queryClient.invalidateQueries('purchaseRequests')}
      />

      {allowActions.creationOrder && (
        <IconButton
          size='small'
          onClick={handleOpenOrderModal}
          title='Generar Orden'
          color={!isAllowed ? 'primary' : mixedState ? 'warning' : 'primary'}
          disabled={!isAllowed || allProcessed}
        >
          <AddShoppingCart />
        </IconButton>
      )}
      <GenerateOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        purchaseRequest={row.original} // se pasa la solicitud de compra seleccionada
        onSuccess={() => queryClient.invalidateQueries('purchaseRequests')}
      />

      {/* Si la solicitud no está rechazada, se muestran las demás acciones */}
      {allowActions.approval && status !== PurchaseRequestStatus.Rejected && (
        <>
          <Divider orientation='vertical' flexItem />
          {status === PurchaseRequestStatus.Pending && (
            <>
              <Tooltip title='Preaprobar'>
                <IconButton
                  size='small'
                  color='success'
                  onClick={() => handleAction(row.original.id, 'pre-approve')}
                >
                  <NextPlanOutlined />
                </IconButton>
              </Tooltip>
              {/* <Tooltip title='Rechazar'>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => handleAction(row.original.id, 'reject')}
                >
                  <Cancel />
                </IconButton>
              </Tooltip> */}
            </>
          )}

          {status === PurchaseRequestStatus.PreApproved && (
            <>
              <Tooltip title='Aprobar'>
                <IconButton
                  size='small'
                  color='success'
                  onClick={() => handleAction(row.original.id, 'approve')}
                >
                  <ThumbUpOutlined />
                </IconButton>
              </Tooltip>
              {/* <Tooltip title='Rechazar'>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => handleAction(row.original.id, 'reject')}
                >
                  <Cancel />
                </IconButton>
              </Tooltip> */}
            </>
          )}

          {/* {status === PurchaseRequestStatus.Accepted && (
            <Tooltip title='Rechazar'>
              <IconButton
                size='small'
                color='error'
                onClick={() => handleAction(row.original.id, 'reject')}
              >
                <Cancel />
              </IconButton>
            </Tooltip>
          )} */}
        </>
      )}
    </Stack>
  )
}

export default RenderRowActions
