import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { Cancel, Save } from '@mui/icons-material'
import { brand, neutral, withAlpha } from 'src/theme/designTokens'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketEditBarProps {
  details: MaintenanceTicketDetailsState
}

/** Barra fija abajo en modo edición: Guardar y Cancelar siempre a la mano, sin subir hasta el encabezado. */
const MaintenanceTicketEditBar = ({
  details
}: MaintenanceTicketEditBarProps) => {
  const {
    editMode,
    isEditValid,
    updateTicketMutation,
    handleSaveEdit,
    handleCancelEdit
  } = details

  if (!editMode) return null

  const saving = updateTicketMutation.isLoading

  return (
    <Box
      role='region'
      aria-label='Guardar o cancelar la edición'
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1.5,
        px: 2,
        pt: 1.5,
        pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
        bgcolor: neutral.surface,
        borderTop: `1px solid ${neutral.border}`,
        boxShadow: `0 -2px 8px ${withAlpha(neutral.text, 0.08)}`
      }}
    >
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ mr: 'auto', display: { xs: 'none', sm: 'block' } }}
      >
        Estás editando el ticket. Los cambios no se guardan hasta que pulses
        Guardar.
      </Typography>
      <Button
        variant='outlined'
        color='inherit'
        startIcon={<Cancel />}
        onClick={handleCancelEdit}
        disabled={saving}
        sx={{ minHeight: 48, textTransform: 'none', flex: { xs: 1, sm: 0 } }}
      >
        Cancelar
      </Button>
      <Button
        variant='contained'
        startIcon={
          saving ? <CircularProgress size={16} color='inherit' /> : <Save />
        }
        onClick={handleSaveEdit}
        disabled={saving || !isEditValid}
        sx={{
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 700,
          flex: { xs: 1, sm: 0 },
          bgcolor: brand.main,
          color: neutral.text,
          '&:hover': { bgcolor: brand.hover, color: brand.onMain }
        }}
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </Button>
    </Box>
  )
}

export default MaintenanceTicketEditBar
