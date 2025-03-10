// ConditionsSection.tsx
import React from 'react'
import { Paper, TextField } from '@mui/material'

interface ConditionsSectionProps {
  otherFields: any
  handleOtherFields: (e: React.ChangeEvent<HTMLInputElement>) => void
  onlyRead: boolean
  quoteType: 'equipos' | 'mantenimiento'
}

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({
  otherFields,
  handleOtherFields,
  onlyRead,
  quoteType
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
    {quoteType === 'mantenimiento' && (
      <>
        <TextField
          disabled={onlyRead}
          name='maintenanceConditionsInLab'
          label='Condiciones de Mantenimiento en Laboratorio'
          variant='outlined'
          multiline
          rows={5}
          value={otherFields.maintenanceConditionsInLab}
          onChange={handleOtherFields}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          disabled={onlyRead}
          name='maintenanceConditionsInInSitu'
          label='Condiciones de Mantenimiento en Sitio'
          variant='outlined'
          multiline
          rows={5}
          value={otherFields.maintenanceConditionsInInSitu}
          onChange={handleOtherFields}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          disabled={onlyRead}
          name='methodsUsed'
          label='Métodos Utilizados'
          variant='outlined'
          multiline
          rows={5}
          value={otherFields.methodsUsed}
          onChange={handleOtherFields}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          disabled={onlyRead}
          name='capacityAndResources'
          label='Capacidad y Recursos'
          variant='outlined'
          multiline
          rows={5}
          value={otherFields.capacityAndResources}
          onChange={handleOtherFields}
          fullWidth
          sx={{ mb: 2 }}
        />
      </>
    )}

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
