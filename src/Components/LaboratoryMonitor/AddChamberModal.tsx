// src/Components/LaboratoryMonitor/AddChamberModal.tsx

import React, { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'

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
  }

  const handleClose = () => {
    setChamberName('')
    setError('')
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? 'Editar nombre de la cámara' : 'Agregar cámara'}
      submitLabel={isEditMode ? 'Guardar cambios' : 'Agregar cámara'}
      onSubmit={handleSubmit}
      loading={isLoading}
    >
      <TextField
        autoFocus
        label='Nombre de la cámara'
        fullWidth
        value={chamberName}
        onChange={(e) => {
          setChamberName(e.target.value)
          if (error) setError('')
        }}
        error={!!error}
        helperText={error || 'Cómo la reconoce el equipo de laboratorio.'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
      />
    </FormDialog>
  )
}
