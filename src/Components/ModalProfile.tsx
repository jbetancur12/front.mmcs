import { Dialog, Box, Typography, IconButton } from '@mui/material'
import { Person, Clear } from '@mui/icons-material'
import ProfileCreationForm from './ProfileCreationForm'

interface ModalProfileProps {
  open: boolean
  onClose: () => void
}

const ModalProfile: React.FC<ModalProfileProps> = ({ open, onClose }) => {
  const handleClose = () => {
    onClose()
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3, 
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header colorido */}
      <Box
        sx={{
          bgcolor: '#00BFA5',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Crear Perfil de Metrólogo
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Completa la información del nuevo metrólogo
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{ color: 'white' }}
        >
          <Clear />
        </IconButton>
      </Box>
      
      <ProfileCreationForm onSave={handleClose} />
    </Dialog>
  )
}

export default ModalProfile
