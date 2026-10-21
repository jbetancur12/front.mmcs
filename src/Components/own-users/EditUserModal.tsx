import { Stack } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'

import FormDialog, { FormDialogSection } from '../Common/FormDialog'

import RoleHelpDialog from './RoleHelpDialog'
import { FormFieldSkeleton } from './Skeletons'
import { Role, UserData } from './types'
import { FormErrorsAlert, RolesField, UserTextField } from './UserFormFields'
import { useUserForm } from './useUserForm'

interface EditModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  userData: UserData | null
  rolesList?: Role[]
  loadingRoles: boolean
  isUpdating?: boolean
}

const formatCreatedAt = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
}

const EditUserModal: React.FC<EditModalProps> = ({
  open,
  onClose,
  onSubmit,
  userData,
  rolesList,
  loadingRoles,
  isUpdating = false
}) => {
  const initialValues = useMemo<UserData>(
    () => ({
      id: userData?.id || 0,
      nombre: userData?.nombre || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      roles: userData?.roles || [],
      createdAt: userData?.createdAt || ''
    }),
    [userData]
  )

  const form = useUserForm(initialValues)
  const { values, errors, touched, hasUnsavedChanges, isFormValid } = form
  const [roleHelpOpen, setRoleHelpOpen] = useState(false)

  // Al cambiar de usuario, el formulario parte de sus datos
  useEffect(() => {
    if (userData) {
      form.setValues(initialValues)
      form.resetState()
    }
  }, [userData, initialValues])

  const handleSubmit = async () => {
    if (!isFormValid) {
      form.touchAll()
      return
    }

    try {
      await onSubmit(values)
      form.resetState()
    } catch (error) {
      console.error('Error in edit modal submit:', error)
    }
  }

  const handleClose = () => {
    if (isUpdating) return
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'Los cambios que hiciste se perderán. ¿Cerrar de todos modos?'
      )
    ) {
      return
    }
    onClose()
    form.setHasUnsavedChanges(false)
  }

  if (!userData) return null

  const createdAt = formatCreatedAt(userData.createdAt)

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Editar usuario'
      subtitle={
        createdAt
          ? `${userData.nombre}, usuario desde el ${createdAt}`
          : userData.nombre
      }
      submitLabel='Guardar cambios'
      onSubmit={() => void handleSubmit()}
      loading={isUpdating}
      submitDisabled={loadingRoles}
      maxWidth='md'
    >
      {loadingRoles ? (
        <Stack spacing={2}>
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </Stack>
      ) : (
        <>
          <FormDialogSection title='Datos de la persona'>
            <UserTextField
              label='Nombre'
              required
              autoComplete='name'
              value={values.nombre || ''}
              onChange={(e) => form.handleFieldChange('nombre', e.target.value)}
              onBlur={() => form.markTouched('nombre')}
              error={touched.nombre && !!errors.nombre}
              helperText={touched.nombre && errors.nombre}
            />
            <UserTextField
              label='Correo'
              required
              type='email'
              autoComplete='email'
              value={values.email || ''}
              onChange={(e) => form.handleFieldChange('email', e.target.value)}
              onBlur={() => form.markTouched('email')}
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
            />
            <UserTextField
              label='Teléfono'
              type='tel'
              autoComplete='tel'
              value={values.phone || ''}
              onChange={(e) => form.handleFieldChange('phone', e.target.value)}
              onBlur={() => form.markTouched('phone')}
              error={touched.phone && !!errors.phone}
              helperText={touched.phone && errors.phone}
            />
          </FormDialogSection>

          <FormDialogSection
            title='Acceso'
            description='Los roles definen qué pantallas y acciones puede usar.'
          >
            <Stack sx={{ gridColumn: '1 / -1' }}>
              <RolesField
                rolesList={rolesList}
                loadingRoles={loadingRoles}
                value={values.roles || []}
                error={touched.roles && !!errors.roles}
                helperText={touched.roles && errors.roles}
                onChange={(roles) => form.handleFieldChange('roles', roles)}
                onShowHelp={() => setRoleHelpOpen(true)}
              />
            </Stack>
          </FormDialogSection>

          {form.hasErrors && (
            <Stack sx={{ mt: 2 }}>
              <FormErrorsAlert />
            </Stack>
          )}
        </>
      )}
      <RoleHelpDialog
        open={roleHelpOpen}
        rolesList={rolesList}
        onClose={() => setRoleHelpOpen(false)}
      />
    </FormDialog>
  )
}

export default EditUserModal
