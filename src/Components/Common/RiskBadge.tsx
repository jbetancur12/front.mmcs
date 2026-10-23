import React from 'react'
import { Chip } from '@mui/material'

export type RiskTone = 'success' | 'error' | 'warning' | 'info' | 'default'

/** Color por significado de un nivel (Alta/Media/Baja, Crítico/Alto/...). */
export const riskTone = (nivel: string): RiskTone => {
  switch (nivel) {
    case 'Crítico':
    case 'Alta':
      return 'error'
    case 'Alto':
      return 'warning'
    case 'Media':
      return 'info'
    case 'Baja':
    case 'Muy Baja':
      return 'success'
    default:
      return 'default'
  }
}

interface RiskBadgeProps {
  /** Qué se mide: "Impacto", "Probabilidad", "Nivel de riesgo". */
  label: string
  /** Valor ya calculado: "Alta", "Media", "Crítico"... */
  value: string
}

/** Chip outlined con el color del nivel, igual que los listados. */
const RiskBadge: React.FC<RiskBadgeProps> = ({ label, value }) => (
  <Chip
    variant='outlined'
    color={riskTone(value)}
    label={`${label}: ${value}`}
    sx={{ fontWeight: 600 }}
  />
)

export default RiskBadge
