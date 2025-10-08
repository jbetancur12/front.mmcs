import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper
} from '@mui/material'
import { Keyboard, Close } from '@mui/icons-material'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onClose
}) => {
  const globalShortcuts = [
    { key: 'Ctrl + K', description: 'Enfocar búsqueda' },
    { key: 'Ctrl + N', description: 'Nuevo ticket' },
    { key: 'Ctrl + F', description: 'Alternar filtros' },
    { key: 'Ctrl + R', description: 'Actualizar datos' },
    { key: 'Shift + ?', description: 'Mostrar esta ayuda' },
    { key: 'Esc', description: 'Cerrar modal/diálogo' }
  ]

  const contextShortcuts = [
    { key: 'E', description: 'Editar ticket' },
    { key: 'C', description: 'Agregar comentario' }
  ]

  const renderShortcut = (key: string, description: string) => (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={1}
      key={key}
    >
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      <Box display="flex" gap={0.5}>
        {key.split(' + ').map((part, index, array) => (
          <React.Fragment key={part}>
            <Chip
              label={part}
              size="small"
              variant="outlined"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                height: '24px'
              }}
            />
            {index < array.length - 1 && (
              <Typography variant="body2" sx={{ mx: 0.5, color: 'text.secondary' }}>
                +
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Keyboard color="primary" />
          <Typography variant="h6">
            Atajos de Teclado
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Usa estos atajos para navegar más rápido en el sistema de mantenimiento.
        </Typography>

        {/* Global Shortcuts */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            background: 'rgba(109, 198, 98, 0.05)',
            border: '1px solid rgba(109, 198, 98, 0.1)',
            borderRadius: '8px'
          }}
        >
          <Typography variant="subtitle2" gutterBottom color="primary.main">
            Atajos Globales
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Funcionan en cualquier parte del sistema
          </Typography>

          {globalShortcuts.map(({ key, description }) =>
            renderShortcut(key, description)
          )}
        </Paper>

        {/* Context Shortcuts */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'rgba(255, 152, 0, 0.05)',
            border: '1px solid rgba(255, 152, 0, 0.1)',
            borderRadius: '8px'
          }}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ color: '#ff9800' }}>
            Atajos Contextuales
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Solo funcionan cuando estás viendo un ticket específico
          </Typography>

          {contextShortcuts.map(({ key, description }) =>
            renderShortcut(key, description)
          )}
        </Paper>

        <Box mt={2} p={2} sx={{ background: 'rgba(33, 150, 243, 0.05)', borderRadius: '8px' }}>
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Tip:</strong> Los atajos contextuales (E, C) no funcionan cuando estás escribiendo en un campo de texto.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<Close />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default KeyboardShortcutsHelp