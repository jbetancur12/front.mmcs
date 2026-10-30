import SignalLoader from 'src/Components/Common/SignalLoader'
import { Stack, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'

import { ROLES } from 'src/constants/roles'
import FormDialog, { FormDialogSection } from '../Common/FormDialog'

import RoleChangePreview from './RoleChangePreview'
import RoleHelpDialog from './RoleHelpDialog'
import { AssignableRole, Role, UserData, UserFormValues } from './types'
import { FormErrorsAlert, RolesField, UserTextField } from './UserFormFields'
import { useUserForm } from './useUserForm'

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  open: boolean
  rolesList?: AssignableRole[]
  loadingRoles: boolean
  isCreating?: boolean
}

const TEXT_FIELDS = ['nombre', 'email', 'phone'] as const

const FIELDS: Record<
  (typeof TEXT_FIELDS)[number],
  { label: string; required: boolean; type?: string; autoComplete: string }
> = {
  nombre: { label: 'Nombre', required: true, autoComplete: 'name' },
  email: {
    label: 'Correo',
    required: true,
    type: 'email',
    autoComplete: 'email'
  },
  phone: {
    label: 'Teléfono',
    required: false,
    type: 'tel',
    autoComplete: 'tel'
  }
}

const CreateNewAccountModal: React.FC<CreateModalProps> = ({
  open,
  onClose,
  onSubmit,
  rolesList,
  loadingRoles,
  isCreating = false
}) => {
  // Valores iniciales memorizados para no reiniciar el formulario en cada render
  const initialValues = useMemo<UserFormValues>(
    () => ({
      nombre: '',
      email: '',
      phone: '',
      roles: []
    }),
    []
  )

  const form = useUserForm(initialValues)
  const { values, errors, touched, hasUnsavedChanges, isFormValid } = form
  const [roleHelpOpen, setRoleHelpOpen] = useState(false)

  // Toda cuenta interna recibe además el rol Empleado (acceso a la Academia y a los módulos de la empresa): se
  // agrega al guardar si existe y no se eligió ya, y se cuenta en la vista previa para que lo que se muestra
  // sea lo que queda
  const employeeRole = rolesList?.find((role) => role.name === ROLES.EMPLOYEE)
  const rolesWithEmployee: Role[] =
    employeeRole && !values.roles.some((role) => role.id === employeeRole.id)
      ? [...values.roles, employeeRole]
      : values.roles

  const handleSubmit = async () => {
    if (!isFormValid) {
      form.touchAll()
      return
    }

    try {
      await onSubmit({
        ...values,
        // Solo id, nombre y descripción: es lo que el API usa, y la lista trae además las capacidades de cada rol
        roles: rolesWithEmployee.map(({ id, name, description }) => ({
          id,
          name,
          description
        }))
      } as UserData)
      form.setValues(initialValues)
      form.resetState()
    } catch (error) {
      console.error('Error in modal submit:', error)
    }
  }

  const handleClose = () => {
    if (isCreating) return
    if (
      hasUnsavedChanges &&
      !window.confirm(
        'Los datos que escribiste se perderán. ¿Cerrar de todos modos?'
      )
    ) {
      return
    }
    onClose()
    form.setHasUnsavedChanges(false)
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear usuario'
      subtitle='Recibirá un correo para activar su cuenta.'
      submitLabel='Crear usuario'
      onSubmit={() => void handleSubmit()}
      loading={isCreating}
      submitDisabled={loadingRoles}
      maxWidth='md'
    >
      {loadingRoles ? (
        <SignalLoader size='small' />
      ) : (
        <>
          <FormDialogSection title='Datos de la persona'>
            {TEXT_FIELDS.map((fieldName) => (
              <UserTextField
                key={fieldName}
                label={FIELDS[fieldName].label}
                required={FIELDS[fieldName].required}
                type={FIELDS[fieldName].type}
                autoComplete={FIELDS[fieldName].autoComplete}
                autoFocus={fieldName === 'nombre'}
                name={fieldName}
                value={values[fieldName] || ''}
                onChange={(e) =>
                  form.handleFieldChange(fieldName, e.target.value)
                }
                onBlur={() => form.markTouched(fieldName)}
                error={touched[fieldName] && !!errors[fieldName]}
                helperText={touched[fieldName] && errors[fieldName]}
              />
            ))}
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
              {employeeRole && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mt: 0.5 }}
                >
                  La cuenta recibe también el rol Empleado.
                </Typography>
              )}
              <RoleChangePreview
                before={[]}
                after={rolesWithEmployee}
                rolesList={rolesList}
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

export default CreateNewAccountModal
