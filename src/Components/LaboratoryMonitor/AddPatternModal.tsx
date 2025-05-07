// src/Components/LaboratoryMonitor/AddPatternModal.tsx
import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress
} from '@mui/material'

interface AddPatternModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (patternName: string) => Promise<void> | void
  isLoading?: boolean
  chamberName?: string // Opcional, para mostrar en el título
}

export const AddPatternModal: React.FC<AddPatternModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  chamberName
}) => {
  const [patternName, setPatternName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!patternName.trim()) {
      setError('El nombre del patrón es requerido.')
      return
    }
    setError('')
    await onSubmit(patternName)
    // setPatternName(''); // Opcional
  }

  const handleClose = () => {
    setPatternName('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        Agregar Nuevo Patrón {chamberName ? `a ${chamberName}` : ''}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          id='patternName'
          label='Nombre del Patrón'
          type='text'
          fullWidth
          variant='outlined'
          value={patternName}
          onChange={(e) => setPatternName(e.target.value)}
          error={!!error}
          helperText={error || 'Ej: Patrón de Referencia'}
          disabled={isLoading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='secondary' disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color='primary'
          variant='contained'
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color='inherit' />
          ) : (
            'Agregar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
