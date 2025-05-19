// src/Components/LaboratoryMonitor/AddChamberModal.tsx

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

interface AddChamberModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (chamberName: string) => Promise<void> | void
  isLoading?: boolean
}

export const AddChamberModal: React.FC<AddChamberModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [chamberName, setChamberName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!chamberName.trim()) {
      setError('El nombre de la cámara es requerido.')
      return
    }
    setError('')
    await onSubmit(chamberName)
    // No cerramos aquí, asumimos que onSubmit lo hará o se invalidará la query
    // y el componente padre controlará el estado 'open'
    // si onSubmit es exitoso.
    // setChamberName(''); // Opcional: limpiar el campo si el modal permanece abierto
  }

  const handleClose = () => {
    setChamberName('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Agregar Nueva Cámara</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          id='name'
          label='Nombre de la Cámara'
          type='text'
          fullWidth
          variant='outlined'
          value={chamberName}
          onChange={(e) => setChamberName(e.target.value)}
          error={!!error}
          helperText={error || 'Ej: Cámara de Calibración Alpha'}
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
