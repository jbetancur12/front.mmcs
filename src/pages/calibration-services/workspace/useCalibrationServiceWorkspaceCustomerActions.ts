import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { axiosPrivate } from '@utils/api'
import { CALIBRATION_SERVICE_CUSTOMERS_QUERY_KEY } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceCustomer } from '../../../types/calibrationService'
import { CalibrationServiceCustomerDialogValues } from '../CalibrationServiceCustomerDialog'
import { CustomerDialogMode } from './calibrationServiceWorkspaceTypes'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'

/** Creación de cliente o sede desde el formulario; el resultado queda seleccionado. */
const useCalibrationServiceWorkspaceCustomerActions = (form: CalibrationServiceWorkspaceForm) => {
  const queryClient = useQueryClient()
  const { selectedCustomer, handleCustomerChange, handleCustomerSiteChange } = form
  const [customerDialogMode, setCustomerDialogMode] = useState<CustomerDialogMode | null>(null)

  const createCustomerMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      const response = await axiosPrivate.post<{ customer: CalibrationServiceCustomer }>(
        '/customers',
        {
          ...values.customer,
          direccion: values.customer.direccion || values.site.address || '',
          ciudad: values.customer.ciudad || values.site.city || '',
          departamento: values.customer.departamento || values.site.department || '',
          email: values.customer.email || values.site.contactEmail || '',
          telefono: values.customer.telefono || values.site.contactPhone || '',
          pais: values.customer.pais || values.site.country || 'Colombia',
          sites: [values.site]
        }
      )
      return response.data.customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<CalibrationServiceCustomer[]>(
        CALIBRATION_SERVICE_CUSTOMERS_QUERY_KEY,
        (previous = []) => {
          const withoutDuplicate = previous.filter((item) => item.id !== customer.id)
          return [...withoutDuplicate, customer].sort((left, right) =>
            left.nombre.localeCompare(right.nombre)
          )
        }
      )
      handleCustomerChange(customer)
      if (customer.sites?.[0]) {
        handleCustomerSiteChange(customer.sites[0])
      }
      setCustomerDialogMode(null)
      toast.success('Cliente creado y seleccionado.')
    }
  })

  const createCustomerSiteMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      if (!selectedCustomer?.id) {
        throw new Error('Selecciona un cliente antes de crear la sede.')
      }

      const response = await axiosPrivate.post<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}/sedes`,
        values.site
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<CalibrationServiceCustomer[]>(
        CALIBRATION_SERVICE_CUSTOMERS_QUERY_KEY,
        (previous = []) =>
          previous.map((item) => (item.id === customer.id ? customer : item))
      )
      const createdSite = customer.sites?.[customer.sites.length - 1]
      handleCustomerChange(customer)
      if (createdSite) {
        handleCustomerSiteChange(createdSite)
      }
      setCustomerDialogMode(null)
      toast.success('Sede creada y seleccionada.')
    }
  })

  const handleCustomerDialogSubmit = (values: CalibrationServiceCustomerDialogValues) => {
    if (customerDialogMode === 'site') {
      if (!values.site.name.trim()) {
        toast.error('Indica el nombre de la sede.')
        return
      }
      createCustomerSiteMutation.mutate(values)
      return
    }

    if (!values.customer.nombre.trim()) {
      toast.error('Indica el nombre del cliente.')
      return
    }

    if (!values.site.name.trim()) {
      toast.error('Indica al menos una sede inicial.')
      return
    }

    createCustomerMutation.mutate(values)
  }

  return {
    customerDialogMode,
    setCustomerDialogMode,
    isSubmitting: createCustomerMutation.isLoading || createCustomerSiteMutation.isLoading,
    handleCustomerDialogSubmit
  }
}

export default useCalibrationServiceWorkspaceCustomerActions
