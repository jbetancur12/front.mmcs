// PaymentConditionsSection.tsx
import React from 'react'
import { FormControl, InputLabel, MenuItem, Paper, Select } from '@mui/material'
import { paymentConditionsOptions } from './constants'

interface PaymentConditionsSectionProps {
  paymentMethod: string
  handlePaymentChange: (e: any) => void
  onlyRead: boolean
}

export const PaymentConditionsSection: React.FC<
  PaymentConditionsSectionProps
> = ({ paymentMethod, handlePaymentChange, onlyRead }) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <FormControl fullWidth>
      <InputLabel>Forma de Pago</InputLabel>
      <Select
        disabled={onlyRead}
        label='Forma de Pago'
        value={paymentMethod}
        onChange={handlePaymentChange}
      >
        {Object.keys(paymentConditionsOptions).map((key) => (
          <MenuItem key={key} value={key}>
            {paymentConditionsOptions[key]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Paper>
)
