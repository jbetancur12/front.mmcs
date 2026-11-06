import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import GuideStepper from './GuideStepper'
import {
  DRIVE_GUIDE_PATH_LABELS,
  DRIVE_GUIDE_STEPS,
  DriveGuidePath
} from './driveGuideSteps'
import { brand } from 'src/theme/designTokens'

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
  const [path, setPath] = useState<DriveGuidePath>('gmail')
  const steps = DRIVE_GUIDE_STEPS.filter(
    (step) => !step.paths || step.paths.includes(path)
  )

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
        <Tabs
          value={path}
          onChange={(_event, value: DriveGuidePath) => setPath(value)}
          sx={{
            mb: 2,
            '& .MuiTabs-indicator': { backgroundColor: brand.main },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
          }}
        >
          {(Object.keys(DRIVE_GUIDE_PATH_LABELS) as DriveGuidePath[]).map(
            (value) => (
              <Tab
                key={value}
                value={value}
                label={DRIVE_GUIDE_PATH_LABELS[value]}
              />
            )
          )}
        </Tabs>
        <GuideStepper steps={steps} resetKey={path} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseDriveGuideDialog
