import {
  type MRT_Cell,
  type MaterialReactTableProps
} from 'material-react-table'
import { useCallback } from 'react'

import { useUserMutations } from '../../hooks/useUsers'
import { generateStrongPassword } from '../../utils/passwordPolicy'
import {
  closeLoadingAlert,
  handleErrorWithAlert,
  showActivationLinkDialog,
  showDeleteConfirmation,
  showErrorAlert,
  showLoadingAlert,
  showSuccessAlert
} from '../../utils/sweetAlert'
import {
  fetchActivationLink,
  resendActivationEmail
} from '../../utils/userActivation'

import { UserData } from './types'

type SaveRowArgs = Parameters<
  NonNullable<MaterialReactTableProps<UserData>['onEditingRowSave']>
>[0]

/**
 * Acciones de la pantalla de usuarios (crear, editar, eliminar, activación)
 * sobre las mutaciones de `useUserMutations`, con los mismos SweetAlert.
 */
export const useOwnUsersActions = (validationErrors: {
  [cellId: string]: string
}) => {
  const { createUser, updateUser, deleteUser } = useUserMutations()

  const handleSaveRowEdits: MaterialReactTableProps<UserData>['onEditingRowSave'] =
    useCallback(
      async ({ exitEditingMode, row, values }: SaveRowArgs) => {
        if (!Object.keys(validationErrors).length) {
          const updatedValues = {
            id: values.id,
            nombre: values.nombre,
            email: values.email,
            phone: values.phone,
            roles: row.original.roles
          }

          // Show loading indicator
          showLoadingAlert('Actualizando usuario...')

          try {
            await updateUser.mutateAsync(updatedValues)
            closeLoadingAlert()

            await showSuccessAlert('Usuario modificado exitosamente')
            exitEditingMode() // Required to exit editing mode and close modal
          } catch (error) {
            closeLoadingAlert()
            await handleErrorWithAlert(error)
            console.error('Error updating user:', error)
          }
        }
      },
      [validationErrors, updateUser]
    )

  const handleActivationLink = useCallback(
    async (target: UserData, resend: boolean) => {
      try {
        const info = resend
          ? await resendActivationEmail(target.id)
          : await fetchActivationLink(target.id)
        await showActivationLinkDialog(info)
      } catch (error) {
        console.error('Error con la activación del usuario:', error)
        await showErrorAlert('No se pudo generar el enlace de activación')
      }
    },
    []
  )

  const onCreateUser = useCallback(
    async (userData: UserData) => {
      // Show loading indicator
      showLoadingAlert('Creando usuario...')

      try {
        const createData = {
          nombre: userData.nombre,
          email: userData.email,
          phone: userData.phone || null,
          roles: userData.roles,
          // Temporal: la persona define la suya con el enlace de activación
          contraseña: generateStrongPassword()
        }

        const created = await createUser.mutateAsync(createData)
        closeLoadingAlert()

        if (created?.activationUrl) {
          await showActivationLinkDialog({
            nombre: createData.nombre,
            email: createData.email,
            phone: createData.phone,
            activationUrl: created.activationUrl,
            emailSent: created.emailSent,
            emailError: created.emailError
          })
        } else {
          await showSuccessAlert('Usuario creado exitosamente')
        }
      } catch (error) {
        closeLoadingAlert()
        await handleErrorWithAlert(error)
        console.error('Error creating user:', error)
        // Re-throw error to prevent modal from closing
        throw error
      }
    },
    [createUser]
  )

  const handleEditUser = useCallback(
    async (userData: UserData) => {
      // Show loading indicator
      showLoadingAlert('Actualizando usuario...')

      try {
        const updatedValues = {
          id: userData.id,
          nombre: userData.nombre,
          email: userData.email,
          phone: userData.phone || null,
          roles: userData.roles
        }

        await updateUser.mutateAsync(updatedValues)
        closeLoadingAlert()

        await showSuccessAlert('Usuario modificado exitosamente')
      } catch (error) {
        closeLoadingAlert()
        await handleErrorWithAlert(error)
        console.error('Error updating user:', error)
        // Re-throw error to prevent modal from closing
        throw error
      }
    },
    [updateUser]
  )

  const handleDeleteRow = useCallback(
    async (row: MRT_Cell<UserData>['row']) => {
      const userName = row.getValue('nombre') as string

      // Show SweetAlert2 confirmation dialog
      const result = await showDeleteConfirmation(userName)

      if (!result.isConfirmed) {
        return
      }

      // Show loading indicator
      showLoadingAlert('Eliminando usuario...')

      try {
        const userId = row.getValue('id') as number
        await deleteUser.mutateAsync(userId)
        closeLoadingAlert()

        await showSuccessAlert('Usuario eliminado exitosamente')
      } catch (error) {
        closeLoadingAlert()
        await handleErrorWithAlert(error)
        console.error('Error deleting user:', error)
      }
    },
    [deleteUser]
  )

  return {
    createUser,
    updateUser,
    deleteUser,
    handleSaveRowEdits,
    handleActivationLink,
    onCreateUser,
    handleEditUser,
    handleDeleteRow
  }
}
