import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { tealButtonSx, tealOutlineSx } from './calibrationServiceWorkspaceConstants'
import { CalibrationServiceWorkspaceSummary } from './calibrationServiceWorkspaceSummary'
import { SaveTargetStatus } from './calibrationServiceWorkspaceTypes'

interface CalibrationServiceWorkspaceActionBarProps {
  summary: CalibrationServiceWorkspaceSummary
  actionBarBox: { left: number; width: number } | null
  isSaveDisabled: boolean
  goToSection: (index: number) => void
  handleSave: (targetStatus: SaveTargetStatus) => Promise<void>
}

/** Barra fija inferior: estado de lo que falta y botones de guardar / enviar. */
const CalibrationServiceWorkspaceActionBar = ({
  summary,
  actionBarBox,
  isSaveDisabled,
  goToSection,
  handleSave
}: CalibrationServiceWorkspaceActionBarProps) => {
  const { pendingRequirements, pendingForDraft } = summary

  return (
    <>
      <Box sx={{ height: { xs: 150, sm: 88 } }} aria-hidden />
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: actionBarBox?.left ?? 16,
          width: actionBarBox?.width ?? 'calc(100vw - 32px)',
          zIndex: 1100,
          px: { xs: 1.5, sm: 2.5 },
          py: 1.5,
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 }
        }}
      >
        {pendingRequirements.length ? (
          <Stack direction='row' alignItems='center' spacing={1.25}>
            <ErrorOutlineOutlinedIcon sx={{ color: pendingForDraft.length ? '#d97706' : '#9ca3af' }} />
            <Typography variant='body2' sx={{ color: '#374151', flex: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {pendingForDraft.length
                ? `Faltan ${pendingForDraft.length} dato${pendingForDraft.length === 1 ? '' : 's'} para guardar y ${pendingRequirements.length} para enviar`
                : `Puedes guardar el borrador. Faltan ${pendingRequirements.length} dato${pendingRequirements.length === 1 ? '' : 's'} para enviar`}
            </Typography>
            <Button size='small' onClick={() => goToSection(pendingRequirements[0].section)} sx={{ textTransform: 'none', fontWeight: 600, color: '#00897B' }}>
              Ver qué falta
            </Button>
          </Stack>
        ) : (
          <Stack direction='row' alignItems='center' spacing={1.25}>
            <CheckCircleOutlineOutlinedIcon sx={{ color: '#00897B' }} />
            <Typography variant='body2' sx={{ color: '#374151' }}>
              Todo listo para enviar la cotización
            </Typography>
          </Stack>
        )}
        <Stack direction='row' spacing={1} sx={{ '& .MuiButton-root': { flex: { xs: 1, sm: 'initial' }, whiteSpace: 'nowrap', px: { xs: 1, sm: 2 }, fontSize: { xs: '0.82rem', sm: '0.875rem' } }, '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inherit' } } }}>
          <Button
            variant='outlined'
            startIcon={<SaveOutlinedIcon />}
            onClick={() => void handleSave('draft')}
            disabled={isSaveDisabled}
            sx={tealOutlineSx}
          >
            Guardar borrador
          </Button>
          <Button
            variant='contained'
            disableElevation
            startIcon={<SendOutlinedIcon />}
            onClick={() => void handleSave('pending_approval')}
            disabled={isSaveDisabled}
            sx={tealButtonSx}
          >
            Guardar y enviar
            <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>&nbsp;cotización</Box>
          </Button>
        </Stack>
      </Paper>
    </>
  )
}

export default CalibrationServiceWorkspaceActionBar
