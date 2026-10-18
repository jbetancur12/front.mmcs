// src/Components/LaboratoryMonitor/AddPatternModal.tsx
import React, { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'

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

  // Cada apertura empieza limpia (el modal también se cierra desde el padre)
  useEffect(() => {
    if (open) {
      setPatternName('')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!patternName.trim()) {
      setError('El nombre del patrón es requerido.')
      return
    }
    setError('')
    await onSubmit(patternName.trim())
  }

  const handleClose = () => {
    setPatternName('')
    setError('')
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Agregar patrón'
      subtitle={chamberName ? `En ${chamberName}` : undefined}
      submitLabel='Agregar patrón'
      onSubmit={handleSubmit}
      loading={isLoading}
    >
      <TextField
        autoFocus
        label='Nombre del patrón'
        fullWidth
        value={patternName}
        onChange={(e) => {
          setPatternName(e.target.value)
          if (error) setError('')
        }}
        error={!!error}
        helperText={
          error ||
          'Único en todo el laboratorio; lo usa el dispositivo. Sin /, + ni #.'
        }
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
      />
    </FormDialog>
  )
}
