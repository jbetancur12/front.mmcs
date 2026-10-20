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

import { Role } from './types'
import { getRoleChipLabel } from './userValidation'

interface RoleHelpDialogProps {
  open: boolean
  rolesList?: Role[]
  onClose: () => void
}

const RoleHelpDialog: React.FC<RoleHelpDialogProps> = ({
  open,
  rolesList = [],
  onClose
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
    <DialogTitle sx={{ fontWeight: 700 }}>Roles disponibles</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={1.5}>
        {rolesList.map((role) => (
          <Box
            key={role.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' },
              gap: 1,
              alignItems: 'start',
              py: 1,
              borderBottom: '1px solid #e5e7eb',
              '&:last-of-type': {
                borderBottom: 'none'
              }
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
            <Typography variant='body2' color='text.secondary'>
              {role.description || role.name}
            </Typography>
          </Box>
        ))}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cerrar</Button>
    </DialogActions>
  </Dialog>
)

export default RoleHelpDialog
