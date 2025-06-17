// hooks/usePurchaseRequestForm.ts
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequest as IPurchaseRequest } from 'src/pages/Purchases/Types'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import {
  RequesterUser,
  CurrentPurchaseRequestItem
} from '../types/PurchaseRequestTypes'
import { isAxiosError } from 'axios'
import Swal from 'sweetalert2'

export const usePurchaseRequestForm = (
  open: boolean,
  existingRequest?: IPurchaseRequest | null,
  onSuccess?: (request: IPurchaseRequest) => void
) => {
  const axiosPrivate = useAxiosPrivate()

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

  // Query for requester options
  const { data: requesterOptions = [], isLoading: loadingRequesters } =
    useQuery<RequesterUser[], Error>(
      'requesterUsersList',
      async () => {
        try {
          const response = await axiosPrivate.get<RequesterUser[]>('/personnel')
          return response.data || []
        } catch (err) {
          console.error('Error cargando solicitantes:', err)
          throw err
        }
      },
      {
        enabled: open,
        staleTime: 1000 * 60 * 15,
        onSuccess: (data) => {
          if (open && existingRequest && data) {
            const preSelected = data.find(
              (r) =>
                (existingRequest.applicantName &&
                  r.name === existingRequest.applicantName) ||
                r.name === existingRequest.applicantName
            )
            if (preSelected) {
              setSelectedRequester(preSelected)
              setFormData((prev) => ({
                ...prev,
                applicantName: preSelected.name,
                applicantPosition: preSelected.position,
                applicantId: preSelected.id
              }))
            }
          }
        }
      }
    )

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
      let response
      if (existingRequest?.id) {
        response = await axiosPrivate.put<IPurchaseRequest>(
          `/purchaseRequests/${existingRequest.id}`,
          payload
        )
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La Solicitud de Compra ha sido actualizada correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        response = await axiosPrivate.post<IPurchaseRequest>(
          '/purchaseRequests',
          payload
        )
        Swal.fire({
          icon: 'success',
          title: '¡Creado!',
          text: 'La Solicitud de Compra ha sido creada correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      }
      onSuccess?.(response.data)
      return true
    } catch (err) {
      setError('Error al crear/actualizar la solicitud')
      console.error('Error creating/updating purchase request:', err)

      let message = `Error al ${existingRequest ? 'actualizar' : 'crear'} la solicitud.`
      if (isAxiosError(err) && err.response?.data?.message) {
        message =
          typeof err.response.data.message === 'string'
            ? err.response.data.message
            : JSON.stringify(err.response.data.message)
      } else if (err instanceof Error) {
        message = err.message
      }
      Swal.fire('Error', message, 'error')
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
