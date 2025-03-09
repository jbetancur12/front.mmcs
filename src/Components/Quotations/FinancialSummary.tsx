// FinancialSummary.tsx
import React from 'react'
import { Paper, Typography } from '@mui/material'

interface FinancialSummaryProps {
  subtotal: number
  discountAmount: number
  tax: number
  taxRate: number
  discount: number
  total: number
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  subtotal,
  discountAmount,
  tax,
  taxRate,
  discount,
  total
}) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Typography variant='subtitle1'>
      Subtotal:{' '}
      {subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'COP' })}
    </Typography>
    <Typography variant='subtitle1'>
      Descuento:{' '}
      {discountAmount.toLocaleString('es-ES', {
        style: 'currency',
        currency: 'COP'
      })}{' '}
      ({discount}%)
    </Typography>
    <Typography variant='subtitle1'>
      IVA ({taxRate}%):{' '}
      {tax.toLocaleString('es-ES', { style: 'currency', currency: 'COP' })}
    </Typography>
    <Typography variant='h6'>
      Total:{' '}
      {total.toLocaleString('es-ES', { style: 'currency', currency: 'COP' })}
    </Typography>
  </Paper>
)
