import { Add } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  LinearProgress,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material'
import React, { useMemo, useState } from 'react'

import { ROLES } from 'src/constants/roles'

import RoleHelpDialog from './RoleHelpDialog'
import { ButtonSkeleton, FormFieldSkeleton } from './Skeletons'
import { Role, UserData, UserFormValues } from './types'
import {
  cancelButtonSx,
  FormErrorsAlert,
  RolesField,
  srOnlySx,
  submitButtonSx,
  UserTextField
} from './UserFormFields'
import { useUserForm } from './useUserForm'

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  open: boolean
  rolesList?: Role[]
  loadingRoles: boolean
  isCreating?: boolean
}

const TEXT_FIELDS = ['nombre', 'email', 'phone'] as const

const FIELD_LABELS: Record<(typeof TEXT_FIELDS)[number], string> = {
  nombre: 'Nombre *',
  email: 'Email *',
  phone: 'Teléfono'
}

const CreateNewAccountModal: React.FC<CreateModalProps> = ({
  open,
  onClose,
  onSubmit,
  rolesList,
  loadingRoles,
  isCreating = false
}) => {
  // Initialize form values - memoized to prevent unnecessary resets
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

  const handleSubmit = async () => {
    if (!isFormValid) {
      form.touchAll()
      return
    }

    try {
      await onSubmit({
        ...values,
        roles: [
          ...values.roles,
          rolesList?.find((r) => r.name === ROLES.EMPLOYEE)
        ]
      } as UserData)
      // Reset form on success
      form.setValues(initialValues)
      form.resetState()
    } catch (error) {
      console.error('Error in modal submit:', error)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !isCreating) {
      if (
        window.confirm(
          '¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.'
        )
      ) {
        onClose()
        form.setHasUnsavedChanges(false)
      }
    } else {
      onClose()
    }
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Dialog
      open={open}
      maxWidth={isMobile ? 'xs' : isTablet ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      aria-labelledby='create-user-dialog-title'
      aria-describedby='create-user-dialog-description'
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          margin: isMobile ? 0 : undefined,
          maxHeight: isMobile ? '100vh' : '90vh'
        },
        role: 'dialog',
        'aria-modal': 'true'
      }}
    >
      {/* Loading bar */}
      {isCreating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1
          }}
        />
      )}

      <DialogTitle
        id='create-user-dialog-title'
        sx={{
          textAlign: 'center',
          pb: 2,
          pt: 3,
          mb: 4,
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          position: 'relative'
        }}
      >
        ✨ Crear Nuevo Usuario
        {hasUnsavedChanges && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 16,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 2 }}>
        {/* Hidden description for screen readers */}
        <Box id='create-user-dialog-description' sx={srOnlySx}>
          Formulario para crear un nuevo usuario del sistema. Complete todos los
          campos requeridos y seleccione al menos un rol.
        </Box>

        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              gap: '2rem'
            }}
          >
            {loadingRoles ? (
              <>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </>
            ) : (
              <>
                {TEXT_FIELDS.map((fieldName) => (
                  <Fade in timeout={300} key={fieldName}>
                    <Box>
                      <UserTextField
                        label={FIELD_LABELS[fieldName]}
                        name={fieldName}
                        value={values[fieldName] || ''}
                        onChange={(e) =>
                          form.handleFieldChange(fieldName, e.target.value)
                        }
                        onBlur={() => form.markTouched(fieldName)}
                        error={touched[fieldName] && !!errors[fieldName]}
                        helperText={touched[fieldName] && errors[fieldName]}
                      />
                    </Box>
                  </Fade>
                ))}
                <Fade in timeout={300}>
                  <Box>
                    <RolesField
                      rolesList={rolesList}
                      loadingRoles={loadingRoles}
                      value={values.roles || []}
                      error={touched.roles && !!errors.roles}
                      helperText={touched.roles && errors.roles}
                      onChange={(roles) =>
                        form.handleFieldChange('roles', roles)
                      }
                      onShowHelp={() => setRoleHelpOpen(true)}
                    />
                  </Box>
                </Fade>
              </>
            )}

            {/* Form validation summary */}
            {form.hasErrors && <FormErrorsAlert />}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          gap: 2,
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafbfc'
        }}
      >
        {loadingRoles ? (
          <>
            <ButtonSkeleton width={120} />
            <ButtonSkeleton width={160} />
          </>
        ) : (
          <>
            <Button
              variant='outlined'
              onClick={handleClose}
              disabled={isCreating}
              sx={cancelButtonSx}
            >
              {hasUnsavedChanges ? 'Descartar cambios' : 'Cancelar'}
            </Button>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isCreating || !isFormValid}
              startIcon={
                isCreating ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Add />
                )
              }
              sx={submitButtonSx}
            >
              {isCreating ? 'Creando Usuario...' : 'Crear Usuario'}
            </Button>
          </>
        )}
      </DialogActions>
      <RoleHelpDialog
        open={roleHelpOpen}
        rolesList={rolesList}
        onClose={() => setRoleHelpOpen(false)}
      />
    </Dialog>
  )
}

export default CreateNewAccountModal
