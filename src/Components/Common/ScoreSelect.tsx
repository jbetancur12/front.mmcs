import React from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import { neutral } from 'src/theme/designTokens'

interface ScoreSelectProps {
  label: string
  name: string
  value: number
  /** Valores permitidos: `[1, 5]` o `[1, 3, 5]`. */
  options: number[]
  /** Qué significa cada valor: "(1: No, 5: Sí)". */
  helperText?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/** Selector de la calificación numérica de un criterio (escala 1/5 o 1/3/5). */
const ScoreSelect: React.FC<ScoreSelectProps> = ({
  label,
  name,
  value,
  options,
  helperText,
  onChange
}) => (
  <TextField
    select
    fullWidth
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    helperText={helperText}
  >
    {options.map((opt) => (
      <MenuItem key={opt} value={opt}>
        {opt}
      </MenuItem>
    ))}
  </TextField>
)

export default ScoreSelect

interface ScoreSummaryProps {
  /** Resultados calculados: etiqueta y valor ("Total", 9). */
  items: Array<{ label: string; value: string | number }>
}

/** Franja gris suave con los totales calculados de un grupo de criterios. */
export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ items }) => (
  <Box
    sx={{
      gridColumn: '1 / -1',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 3,
      px: 2,
      py: 1.5,
      borderRadius: '12px',
      bgcolor: neutral.surfaceAlt,
      border: `1px solid ${neutral.border}`,
      fontSize: 14,
      color: neutral.textBody
    }}
  >
    {items.map((item) => (
      <span key={item.label}>
        {item.label}: <b style={{ color: neutral.text }}>{item.value}</b>
      </span>
    ))}
  </Box>
)
