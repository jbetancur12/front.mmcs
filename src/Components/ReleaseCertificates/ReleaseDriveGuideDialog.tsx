import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepButton,
  StepContent,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { OpenInNewRounded } from '@mui/icons-material'
import { DRIVE_GUIDE_STEPS } from './driveGuideSteps'

interface ReleaseDriveGuideDialogProps {
  open: boolean
  onClose: () => void
}

/** Guía paso a paso para obtener la credencial de Google y preparar la carpeta del Drive. */
const ReleaseDriveGuideDialog: React.FC<ReleaseDriveGuideDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [active, setActive] = useState(0)
  const last = DRIVE_GUIDE_STEPS.length - 1

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      fullScreen={fullScreen}
    >
      <DialogTitle>Cómo conectar el Drive, paso a paso</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Sigue los pasos en orden. Si algo se ve distinto en tu pantalla,
          avísale a quien administra la plataforma antes de seguir.
        </Typography>
        <Stepper nonLinear activeStep={active} orientation='vertical'>
          {DRIVE_GUIDE_STEPS.map((step, index) => (
            <Step key={step.id} completed={index < active}>
              <StepButton onClick={() => setActive(index)}>
                <Typography fontWeight={600}>{step.title}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {step.where}
                </Typography>
              </StepButton>
              <StepContent>
                <Box component='ol' sx={{ pl: 2.5, my: 1 }}>
                  {step.actions.map((action) => (
                    <li key={action}>
                      <Typography variant='body2' sx={{ mb: 0.75 }}>
                        {action}
                      </Typography>
                    </li>
                  ))}
                </Box>
                {step.link && (
                  <Button
                    size='small'
                    variant='outlined'
                    component='a'
                    href={step.link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    endIcon={<OpenInNewRounded fontSize='small' />}
                    sx={{ mb: 1.5 }}
                  >
                    {step.link.label}
                  </Button>
                )}
                {step.warning && (
                  <Alert severity='warning' sx={{ mb: 1.5 }}>
                    {step.warning}
                  </Alert>
                )}
                {step.image && (
                  <Box
                    component='img'
                    src={step.image.src}
                    alt={step.image.alt}
                    sx={{
                      maxWidth: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: 1,
                      mb: 1.5
                    }}
                  />
                )}
                <Alert severity='success' variant='outlined' sx={{ mb: 1.5 }}>
                  <strong>Debes ver:</strong> {step.expect}
                </Alert>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size='small'
                    disabled={index === 0}
                    onClick={() => setActive(index - 1)}
                  >
                    Anterior
                  </Button>
                  {index < last && (
                    <Button
                      size='small'
                      variant='contained'
                      onClick={() => setActive(index + 1)}
                      sx={{
                        bgcolor: '#00BFA5',
                        '&:hover': { bgcolor: '#00897B' }
                      }}
                    >
                      Ya lo hice, siguiente
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseDriveGuideDialog
