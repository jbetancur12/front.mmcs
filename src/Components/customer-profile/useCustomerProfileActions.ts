import { AxiosError } from 'axios'
import React, { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import useAxiosPrivate from '@utils/use-axios-private'
import { MySwal } from '@utils/sweetAlert'

import { notify } from 'src/utils/notify'

import { customerProfileKeys, DEFAULT_AVATAR } from './constants'

// Sin reintentos: el `retry: 1` global de mutaciones reenviaría POST/PUT/DELETE.
const NO_RETRY = { retry: 0 }

/**
 * Mutaciones de la ficha del cliente (certificados, avatar, sedes, estado y
 * cursos LMS) con los mismos mensajes que antes de react-query.
 */
export const useCustomerProfileActions = (
  id: string | undefined,
  setImage: (image: string) => void
) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const invalidateCustomer = () =>
    queryClient.invalidateQueries(customerProfileKeys.customer(id))
  const invalidateLmsCourses = () =>
    queryClient.invalidateQueries(customerProfileKeys.lmsCourses(id))

  const deleteCertificate = useMutation(
    (certificateId: number) => axiosPrivate.delete(`/files/${certificateId}`),
    NO_RETRY
  )
  const uploadAvatar = useMutation(
    (formData: FormData) =>
      axiosPrivate.post(`/customers/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    NO_RETRY
  )
  const addSede = useMutation(
    (nuevaSede: string) =>
      axiosPrivate.post(`/customers/${id}/sedes`, { nuevaSede }),
    NO_RETRY
  )
  const editSede = useMutation(
    ({ oldSede, newSede }: { oldSede: string; newSede: string }) =>
      axiosPrivate.put(`/customers/${id}/sedes`, { oldSede, newSede }),
    NO_RETRY
  )
  const deleteSede = useMutation(
    (sede: string) => axiosPrivate.delete(`/customers/${id}/sedes/${sede}`),
    NO_RETRY
  )
  const updateStatus = useMutation(
    (isActive: boolean) => axiosPrivate.put(`/customers/${id}`, { isActive }),
    { ...NO_RETRY, onSettled: invalidateCustomer }
  )
  const assignLmsCourse = useMutation(
    (courseId: string) =>
      axiosPrivate.post(`/customers/${id}/lms-courses/${courseId}`),
    { ...NO_RETRY, onSuccess: invalidateLmsCourses }
  )
  const removeLmsCourse = useMutation(
    (courseId: number) =>
      axiosPrivate.delete(`/customers/${id}/lms-courses/${courseId}`),
    { ...NO_RETRY, onSuccess: invalidateLmsCourses }
  )

  const handleDelete = useCallback(
    async (certificateId: number) => {
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas eliminar este certificado? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      })

      if (!result.isConfirmed) return

      try {
        const response = await deleteCertificate.mutateAsync(certificateId)
        if (response.status >= 200 && response.status < 300) {
          notify.success('Certificado eliminado con éxito')
          await queryClient.invalidateQueries(
            customerProfileKeys.certificatesAll(id)
          )
        }
      } catch (error) {
        console.error('Error al eliminar el certificado:', error)
        notify.error('Error al eliminar el certificado')
        throw error
      }
    },
    [deleteCertificate, queryClient, id]
  )

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newImage = event.target.files?.[0]

      if (newImage && id) {
        setImage(URL.createObjectURL(newImage))
        const formData = new FormData()
        formData.append('file', newImage as Blob)
        formData.append('customerId', id)

        try {
          await uploadAvatar.mutateAsync(formData)
        } catch (error) {
          console.error('Error al enviar la imagen al backend:', error)
          setImage(DEFAULT_AVATAR)
        }
      } else {
        setImage(DEFAULT_AVATAR)
      }
    },
    [uploadAvatar, id, setImage]
  )

  const handleAddSede = useCallback(
    async (newSede: string) => {
      if (!id) return

      try {
        const response = await addSede.mutateAsync(newSede)

        if (response.status === 200) {
          notify.success('Sede agregada con éxito')
          invalidateCustomer()
        }
      } catch (error) {
        console.error('Error al agregar sede:', error)
        notify.error('Error al agregar sede')
      }
    },
    [addSede, id, invalidateCustomer]
  )

  const handleEditSede = useCallback(
    async (oldSede: string, newSede: string) => {
      if (!id) return

      try {
        const response = await editSede.mutateAsync({ oldSede, newSede })

        if (response.status === 200) {
          notify.success('Sede actualizada con éxito')
          invalidateCustomer()
        }
      } catch (error) {
        console.error('Error al actualizar sede:', error)
        notify.error('Error al actualizar sede')
      }
    },
    [editSede, id, invalidateCustomer]
  )

  const handleDeleteSede = useCallback(
    async (sede: string) => {
      if (!id) return

      const result = await MySwal.fire({
        title: '¿Eliminar sede?',
        text: `¿Estás seguro de que deseas eliminar la sede "${sede}"? Esta acción solo se permitirá si no hay certificados asociados.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      })

      if (!result.isConfirmed) return

      try {
        const response = await deleteSede.mutateAsync(sede)

        if (response.status === 200) {
          notify.success('Sede eliminada con éxito')
          invalidateCustomer()
        }
      } catch (error) {
        console.error('Error al eliminar sede:', error)
        if ((error as AxiosError)?.response?.status === 409) {
          MySwal.fire({
            title: 'No se puede eliminar',
            text: 'No se puede eliminar la sede porque tiene certificados asociados. Por favor, remueve o transfiere los certificados primero.',
            icon: 'error',
            confirmButtonColor: '#3085d6'
          })
        } else {
          notify.error('Error al eliminar sede')
        }
      }
    },
    [deleteSede, id, invalidateCustomer]
  )

  const changeStatus = async (newStatus: boolean) => {
    try {
      await updateStatus.mutateAsync(newStatus)
      notify.success(
        `Cliente ${newStatus ? 'activado' : 'desactivado'} con éxito`
      )
    } catch (error) {
      console.error('Error updating customer status:', error)
      notify.error('Error al actualizar el estado del cliente')
    }
  }

  /** Devuelve true si se asignó, para que la vista limpie la selección. */
  const assignCourse = async (courseId: string): Promise<boolean> => {
    try {
      await assignLmsCourse.mutateAsync(courseId)
      notify.success('Curso LMS asignado con éxito')
      return true
    } catch (error) {
      console.error('Error al asignar curso LMS:', error)
      notify.error('Error al asignar el curso LMS')
      return false
    }
  }

  const handleRemoveLmsCourse = useCallback(
    async (courseId: number) => {
      if (!id) return

      try {
        await removeLmsCourse.mutateAsync(courseId)
        notify.success('Curso LMS removido con éxito')
      } catch (error) {
        console.error('Error al quitar curso LMS:', error)
        notify.error('Error al quitar el curso LMS')
      }
    },
    [removeLmsCourse, id]
  )

  return {
    handleDelete,
    handleImageChange,
    handleAddSede,
    handleEditSede,
    handleDeleteSede,
    changeStatus,
    assignCourse,
    handleRemoveLmsCourse
  }
}
