// src/Components/LaboratoryMonitor/AddChamberModal.tsx

import React, { useEffect, useState } from 'react'
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
  isEditMode?: boolean // NUEVA PROP
  initialValue?: string // NUEVA PROP
}

export const AddChamberModal: React.FC<AddChamberModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  isEditMode = false, // Valor por defecto
  initialValue = '' // Valor por defecto
}) => {
  const [chamberName, setChamberName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setChamberName(initialValue)
      setError('')
    }
  }, [open, initialValue])

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
      <DialogTitle>
        {isEditMode ? 'Editar Nombre de la Cámara' : 'Agregar Nueva Cámara'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Nombre de la Cámara'
          type='text'
          fullWidth
          variant='outlined'
          value={chamberName}
          onChange={(e) => {
            setChamberName(e.target.value)
            if (error) setError('')
          }}
          error={!!error}
          helperText={error}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
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
          {isLoading
            ? 'Guardando...'
            : isEditMode
              ? 'Guardar Cambios'
              : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
