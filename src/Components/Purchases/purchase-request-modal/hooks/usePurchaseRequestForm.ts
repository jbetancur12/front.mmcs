// hooks/usePurchaseRequestForm.ts
import { getApiErrorReason } from 'src/utils/apiError'
import { useState, useEffect } from 'react'
import {
  usePurchaseRequesters,
  useSavePurchaseRequest
} from 'src/hooks/purchases/usePurchaseRequests'
import { PurchaseRequest as IPurchaseRequest } from 'src/pages/Purchases/Types'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import {
  RequesterUser,
  CurrentPurchaseRequestItem
} from '../types/PurchaseRequestTypes'
import { isAxiosError } from 'axios'
import { notify } from 'src/utils/notify'

export const usePurchaseRequestForm = (
  open: boolean,
  existingRequest?: IPurchaseRequest | null,
  onSuccess?: (request: IPurchaseRequest) => void
) => {
  const [formData, setFormData] = useState<Partial<IPurchaseRequest>>({})
  const [currentItem, setCurrentItem] = useState<CurrentPurchaseRequestItem>({
    quantity: 1,
    description: '',
    supplierIds: [],
    supplierInput: []
  })
  const [selectedRequester, setSelectedRequester] =
    useState<RequesterUser | null>(null)
  const [newRequirement, setNewRequirement] = useState('')
  const [error, setError] = useState('')
  const [requirementType, setRequirementType] = useState('')
  const [editingRequirementIndex, setEditingRequirementIndex] = useState<
    number | null
  >(null)
  const [editingRequirementValue, setEditingRequirementValue] =
    useState<string>('')

  const { data: requesterOptions = [], isLoading: loadingRequesters } =
    usePurchaseRequesters(open)
  const savePurchaseRequest = useSavePurchaseRequest()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (existingRequest) {
        // Edit mode
        setFormData({
          ...existingRequest,
          elaborationDate: existingRequest.elaborationDate
            ? new Date(existingRequest.elaborationDate)
            : new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
          items: existingRequest.items || [],
          requirements: existingRequest.requirements || []
        })
        setCurrentItem({
          quantity: 1,
          description: '',
          supplierIds: [],
          supplierInput: []
        })
      } else {
        // Create mode
        setFormData({
          status: PurchaseRequestStatus.Pending,
          requirements: [],
          items: [],
          elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
          purchaseType: 'I'
        })
        setCurrentItem({
          quantity: 1,
          description: '',
          supplierIds: [],
          supplierInput: []
        })
        setSelectedRequester(null)
      }
      setRequirementType('')
      setNewRequirement('')
      setError('')
    }
  }, [open, existingRequest])

  // Set selected requester when options are loaded
  useEffect(() => {
    if (open && existingRequest && requesterOptions.length > 0) {
      const preSelected = requesterOptions.find(
        (r) =>
          (existingRequest.applicantName &&
            r.name === existingRequest.applicantName) ||
          (r.name === existingRequest.applicantName &&
            r.position === existingRequest.applicantPosition)
      )

      if (preSelected) {
        setSelectedRequester(preSelected)
        setFormData((prev) => ({
          ...prev,
          applicantName: preSelected.name,
          applicantPosition: preSelected.position,
          applicantId: preSelected.id
        }))
      } else {
        setSelectedRequester(null)
      }
    }
  }, [open, existingRequest, requesterOptions])

  const handleSubmit = async () => {
    if (
      !formData.elaborationDate ||
      !formData.applicantName ||
      !formData.applicantPosition ||
      formData.items?.length === 0
    ) {
      setError(
        'Complete todos los campos obligatorios y agregue al menos un ítem'
      )
      return
    }

    const payload = {
      ...formData,
      items: formData.items?.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        supplierIds: item.supplierIds || []
      }))
    }

    try {
      const savedRequest = await savePurchaseRequest.mutateAsync({
        id: existingRequest?.id,
        payload
      })
      if (existingRequest?.id) {
        notify.success(
          '¡Actualizado!',
          'La Solicitud de Compra ha sido actualizada correctamente.'
        )
      } else {
        notify.success(
          '¡Creado!',
          'La Solicitud de Compra ha sido creada correctamente.'
        )
      }
      onSuccess?.(savedRequest)
      return true
    } catch (err) {
      setError('Error al crear/actualizar la solicitud')
      console.error('Error creating/updating purchase request:', err)

      let message = `Error al ${existingRequest ? 'actualizar' : 'crear'} la solicitud.`
      if (isAxiosError(err) && getApiErrorReason(err)) {
        message = getApiErrorReason(err) ?? message
      } else if (err instanceof Error) {
        message = err.message
      }
      notify.error('Error', message)
      return false
    }
  }

  const resetForm = () => {
    setFormData({
      status: PurchaseRequestStatus.Pending,
      requirements: [],
      items: [],
      elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
    })
    setCurrentItem({
      quantity: 1,
      description: '',
      supplierIds: []
    })
    setNewRequirement('')
    setError('')
    setRequirementType('')
    setSelectedRequester(null)
  }

  return {
    formData,
    setFormData,
    currentItem,
    setCurrentItem,
    selectedRequester,
    setSelectedRequester,
    requesterOptions,
    loadingRequesters,
    newRequirement,
    setNewRequirement,
    error,
    setError,
    requirementType,
    setRequirementType,
    editingRequirementIndex,
    setEditingRequirementIndex,
    editingRequirementValue,
    setEditingRequirementValue,
    handleSubmit,
    resetForm
  }
}
