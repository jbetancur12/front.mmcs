// Suspense wrapper for lazy-loaded modals
import React, { Suspense } from 'react'
import { Dialog, DialogContent, CircularProgress, Box } from '@mui/material'
import { colors, spacing } from '../../theme/designSystem'

interface ModalSuspenseProps {
  children: React.ReactNode
  open: boolean
  onClose?: () => void
}

const ModalLoadingFallback: React.FC = () => (
  <Dialog open={true} maxWidth='sm' fullWidth>
    <DialogContent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[8],
          minHeight: 200
        }}
      >
        <CircularProgress
          size={40}
          sx={{
            color: colors.primary[500]
          }}
        />
      </Box>
    </DialogContent>
  </Dialog>
)

const ModalSuspense: React.FC<ModalSuspenseProps> = ({ children, open }) => {
  if (!open) return null

  return <Suspense fallback={<ModalLoadingFallback />}>{children}</Suspense>
}

export default ModalSuspense
