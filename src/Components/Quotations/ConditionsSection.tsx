// ConditionsSection.tsx
import React from 'react'
import { Paper, TextField } from '@mui/material'

interface ConditionsSectionProps {
  otherFields: any
  handleOtherFields: (e: React.ChangeEvent<HTMLInputElement>) => void
  onlyRead: boolean
}

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  otherFields,
  handleOtherFields,
  onlyRead
}) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <TextField
      disabled={onlyRead}
      name='generalConditions'
      label='Condiciones Generales'
      variant='outlined'
      multiline
      rows={4}
      value={otherFields.generalConditions}
      onChange={handleOtherFields}
      fullWidth
      sx={{ mb: 2 }}
    />

    <TextField
      disabled={onlyRead}
      name='paymentConditions'
      label='Condiciones de Pago'
      variant='outlined'
      multiline
      rows={4}
      value={otherFields.paymentConditions}
      onChange={handleOtherFields}
      fullWidth
      sx={{ mb: 2 }}
    />

    <TextField
      disabled={onlyRead}
      name='deliveryConditions'
      label='Condiciones de Entrega'
      variant='outlined'
      multiline
      rows={1}
      value={otherFields.deliveryConditions}
      onChange={handleOtherFields}
      fullWidth
      sx={{ mb: 2 }}
    />
  </Paper>
)
