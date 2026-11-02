import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import GuideStepper from './GuideStepper'
import { ANALYST_GUIDE_STEPS } from './analystGuideSteps'

interface ReleaseAnalystGuideDialogProps {
  open: boolean
  onClose: () => void
}

/** Guía corta del trabajo diario: cargar, revisar, firmar, liberar y deshacer errores. */
const ReleaseAnalystGuideDialog: React.FC<ReleaseAnalystGuideDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      fullScreen={fullScreen}
    >
      <DialogTitle>Cómo trabajar con certificados a liberar</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          El recorrido de un certificado: cargar, revisar, verificar, firmar y
          liberar. Cada paso dice quién lo hace.
        </Typography>
        <GuideStepper steps={ANALYST_GUIDE_STEPS} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseAnalystGuideDialog
