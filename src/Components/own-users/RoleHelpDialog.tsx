import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import { moduleCounts, unassignableText } from './roleSummary'
import { AssignableRole } from './types'
import { getRoleChipLabel } from './userValidation'

interface RoleHelpDialogProps {
  open: boolean
  rolesList?: AssignableRole[]
  onClose: () => void
}

/**
 * Qué permite cada rol, calculado con sus capacidades reales (módulos y cantidad) y no solo con la descripción que
 * se escribió al crearlo. Los roles desactivados no se listan; los que quien asigna no puede dar salen con el motivo.
 */
const RoleHelpDialog: React.FC<RoleHelpDialogProps> = ({
  open,
  rolesList = [],
  onClose
}) => {
  const canSeeGuide = useCan(PERMISSIONS.RBAC_VIEW)
  const roles = rolesList.filter((role) => role.isActive)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 700 }}>Qué permite cada rol</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Los roles se suman: la persona puede hacer todo lo que permita
          cualquiera de los que tenga.
        </Typography>
        <Stack spacing={1.5}>
          {roles.map((role) => {
            const modules = moduleCounts(role.permissions ?? [])
            const blocked = unassignableText(role)
            return (
              <Box
                key={role.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '170px 1fr' },
                  gap: 1,
                  alignItems: 'start',
                  py: 1,
                  borderBottom: '1px solid #e5e7eb',
                  '&:last-of-type': { borderBottom: 'none' }
                }}
              >
                <Chip
                  label={getRoleChipLabel(role)}
                  size='small'
                  sx={{
                    width: 'fit-content',
                    backgroundColor: '#d1fae5',
                    color: '#047857',
                    fontWeight: 600
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  {modules.length === 0 ? (
                    <Typography variant='body2' color='text.secondary'>
                      Sin capacidades propias.
                    </Typography>
                  ) : (
                    <>
                      <Typography variant='body2'>
                        {role.permissions.length}{' '}
                        {role.permissions.length === 1
                          ? 'capacidad'
                          : 'capacidades'}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mt: 0.5
                        }}
                      >
                        {modules.map((module) => (
                          <Chip
                            key={module.module}
                            size='small'
                            variant='outlined'
                            label={`${module.label} ${module.count}`}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                  {role.description && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      component='div'
                      sx={{ mt: 0.5 }}
                    >
                      {role.description}
                    </Typography>
                  )}
                  {blocked && (
                    <Typography
                      variant='caption'
                      component='div'
                      sx={{ mt: 0.5, color: '#b45309' }}
                    >
                      {blocked}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        {canSeeGuide && (
          <Button
            component={RouterLink}
            to='/settings/roles/ayuda'
            target='_blank'
            sx={{ textTransform: 'none', mr: 'auto' }}
          >
            Ver la guía de capacidades
          </Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default RoleHelpDialog
