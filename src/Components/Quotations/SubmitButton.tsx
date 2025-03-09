// SubmitButton.tsx
import React from 'react'
import { Button } from '@mui/material'

interface SubmitButtonProps {
  onlyRead: boolean
  hasId: boolean
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onlyRead,
  hasId
}) => (
  <Button type='submit' variant='contained' sx={{ mb: 2 }} disabled={onlyRead}>
    {hasId ? 'Actualizar' : 'Crear'}
  </Button>
)
