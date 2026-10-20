import { Edit } from '@mui/icons-material'
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
import React, { useEffect, useMemo, useState } from 'react'

import RoleHelpDialog from './RoleHelpDialog'
import { ButtonSkeleton, FormFieldSkeleton } from './Skeletons'
import { Role, UserData } from './types'
import {
  cancelButtonSx,
  FormErrorsAlert,
  RolesField,
  srOnlySx,
  submitButtonSx,
  UserTextField
} from './UserFormFields'
import { useUserForm } from './useUserForm'

// Modern Edit User Modal Component
interface EditModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  userData: UserData | null
  rolesList?: Role[]
  loadingRoles: boolean
  isUpdating?: boolean
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
  // Initialize form values with user data
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

  // Update form values when userData changes
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
      // Reset form state on success
      form.resetState()
    } catch (error) {
      console.error('Error in edit modal submit:', error)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !isUpdating) {
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

  if (!userData) return null

  return (
    <Dialog
      open={open}
      maxWidth={isMobile ? 'xs' : isTablet ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      aria-labelledby='edit-user-dialog-title'
      aria-describedby='edit-user-dialog-description'
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          margin: isMobile ? 0 : undefined,
          maxHeight: isMobile ? '100vh' : '90vh',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          position: 'relative'
        },
        role: 'dialog',
        'aria-modal': 'true'
      }}
    >
      {/* Loading bar */}
      {isUpdating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #34d399, #10b981)'
            }
          }}
        />
      )}

      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 0
        }}
      />

      <DialogTitle
        id='edit-user-dialog-title'
        sx={{
          textAlign: 'center',
          pb: 2,
          pt: 4,
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'white',
          position: 'relative',
          zIndex: 1,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Edit sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Editar Usuario
            </Box>
            <Box sx={{ fontSize: '0.875rem', opacity: 0.9, fontWeight: 400 }}>
              {userData.nombre}
            </Box>
          </Box>
        </Box>
        {hasUnsavedChanges && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
            }}
          />
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2,
          pb: 2,
          backgroundColor: 'white',
          position: 'relative',
          zIndex: 1,
          borderRadius: '20px 20px 0 0',
          mt: 2
        }}
      >
        {/* Hidden description for screen readers */}
        <Box id='edit-user-dialog-description' sx={srOnlySx}>
          Formulario para editar la información del usuario. Modifique los
          campos necesarios y guarde los cambios.
        </Box>

        {/* User info header */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '2px solid #e5e7eb'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 600 }}>
                {userData.nombre.charAt(0).toUpperCase()}
              </span>
            </Box>
            <Box>
              <Box
                sx={{ fontWeight: 600, color: '#1a202c', fontSize: '1.1rem' }}
              >
                ID: {userData.id}
              </Box>
              <Box sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Creado: {new Date(userData.createdAt).toLocaleDateString()}
              </Box>
            </Box>
          </Box>
        </Box>

        <form onSubmit={(e) => e.preventDefault()}>
          <Stack sx={{ width: '100%', gap: '2rem' }}>
            {loadingRoles ? (
              <>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </>
            ) : (
              <>
                {/* Name Field */}
                <Fade in timeout={300}>
                  <UserTextField
                    label='Nombre *'
                    value={values.nombre || ''}
                    onChange={(e) =>
                      form.handleFieldChange('nombre', e.target.value)
                    }
                    onBlur={() => form.markTouched('nombre')}
                    error={touched.nombre && !!errors.nombre}
                    helperText={touched.nombre && errors.nombre}
                  />
                </Fade>

                {/* Email Field */}
                <Fade in timeout={400}>
                  <UserTextField
                    label='Email *'
                    type='email'
                    value={values.email || ''}
                    onChange={(e) =>
                      form.handleFieldChange('email', e.target.value)
                    }
                    onBlur={() => form.markTouched('email')}
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                  />
                </Fade>

                {/* Phone Field */}
                <Fade in timeout={450}>
                  <UserTextField
                    label='Teléfono'
                    value={values.phone || ''}
                    onChange={(e) =>
                      form.handleFieldChange('phone', e.target.value)
                    }
                    onBlur={() => form.markTouched('phone')}
                    error={touched.phone && !!errors.phone}
                    helperText={touched.phone && errors.phone}
                  />
                </Fade>

                {/* Roles Field */}
                <Fade in timeout={500}>
                  <RolesField
                    rolesList={rolesList}
                    loadingRoles={loadingRoles}
                    value={values.roles || []}
                    error={touched.roles && !!errors.roles}
                    helperText={touched.roles && errors.roles}
                    onChange={(roles) => form.handleFieldChange('roles', roles)}
                    onShowHelp={() => setRoleHelpOpen(true)}
                  />
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
          backgroundColor: 'white',
          position: 'relative',
          zIndex: 1
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
              disabled={isUpdating}
              sx={cancelButtonSx}
            >
              {hasUnsavedChanges ? 'Descartar cambios' : 'Cancelar'}
            </Button>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isUpdating || !isFormValid}
              startIcon={
                isUpdating ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Edit />
                )
              }
              sx={submitButtonSx}
            >
              {isUpdating ? 'Actualizando Usuario...' : 'Actualizar Usuario'}
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

export default EditUserModal
