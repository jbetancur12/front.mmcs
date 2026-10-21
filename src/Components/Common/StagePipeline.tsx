import React from 'react'
import { Box, ButtonBase, Paper, Typography } from '@mui/material'

const TEAL = '#00BFA5'
const TEAL_INK = '#00695C'
const TEAL_SOFT = '#E0F7F4'

export interface StagePipelineStage {
  key: string
  label: string
  count: number
}

interface StagePipelineProps {
  /** Etapas del ciclo en orden, con cuántos registros hay en cada una. */
  stages: StagePipelineStage[]
  /** Estados fuera del ciclo (rechazada, cancelada): van aparte, al final. */
  outside?: StagePipelineStage[]
  /** Total para la opción "Todas". */
  total: number
  /** Filtro activo (`key`), o '' para todas. */
  selected: string
  onSelect: (key: string) => void
  /** Nombre del filtro para lectores de pantalla: "Filtrar cotizaciones por etapa". */
  ariaLabel: string
}

const StageButton: React.FC<{
  label: string
  count: number
  active: boolean
  onClick: () => void
  compact?: boolean
}> = ({ label, count, active, onClick, compact = false }) => (
  <ButtonBase
    onClick={onClick}
    aria-pressed={active}
    sx={{
      position: 'relative',
      zIndex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.75,
      px: 1,
      py: 1,
      minWidth: compact ? 88 : 0,
      width: compact ? 'auto' : '100%',
      borderRadius: '12px',
      bgcolor: active ? TEAL_SOFT : 'transparent',
      '&:hover': { bgcolor: active ? TEAL_SOFT : '#f3f4f6' },
      '&.Mui-focusVisible': {
        outline: `3px solid ${TEAL_INK}`,
        outlineOffset: 2
      }
    }}
  >
    <Box
      sx={{
        minWidth: compact ? 32 : 40,
        height: compact ? 32 : 40,
        px: 1,
        borderRadius: '999px',
        display: 'grid',
        placeItems: 'center',
        border: '2px solid',
        borderColor: active ? TEAL_INK : count > 0 ? TEAL : '#d1d5db',
        bgcolor: active ? TEAL_INK : '#fff',
        color: active ? '#fff' : count > 0 ? TEAL_INK : '#6b7280',
        fontWeight: 700,
        fontSize: compact ? 13 : 15,
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      {count}
    </Box>
    <Typography
      component='span'
      sx={{
        fontSize: 12,
        lineHeight: 1.25,
        textAlign: 'center',
        fontWeight: active ? 700 : 500,
        color: active ? TEAL_INK : '#374151'
      }}
    >
      {label}
    </Typography>
  </ButtonBase>
)

/**
 * Embudo de un ciclo con etapas fijas: cuántos registros hay en cada etapa,
 * unidas por una línea en el orden en que ocurren. Cada etapa filtra la
 * lista; los estados que salen del ciclo van aparte, a la derecha.
 */
const StagePipeline: React.FC<StagePipelineProps> = ({
  stages,
  outside = [],
  total,
  selected,
  onSelect,
  ariaLabel
}) => (
  <Paper
    variant='outlined'
    role='group'
    aria-label={ariaLabel}
    sx={{
      display: 'flex',
      alignItems: 'stretch',
      gap: 1,
      p: 1.5,
      mb: 3,
      borderRadius: '16px',
      borderColor: '#e5e7eb',
      overflowX: 'auto'
    }}
  >
    <Box sx={{ flexShrink: 0 }}>
      <StageButton
        compact
        label='Todas'
        count={total}
        active={!selected}
        onClick={() => onSelect('')}
      />
    </Box>

    <Box
      sx={{ width: '1px', bgcolor: '#e5e7eb', my: 1, flexShrink: 0 }}
      aria-hidden
    />

    <Box
      component='ol'
      sx={{
        display: 'flex',
        flex: 1,
        minWidth: stages.length * 104,
        listStyle: 'none',
        m: 0,
        p: 0
      }}
    >
      {stages.map((stage, index) => (
        <Box
          component='li'
          key={stage.key}
          sx={{ flex: 1, position: 'relative', minWidth: 0 }}
        >
          {/* Línea que une la etapa con la anterior, a la altura del número */}
          {index > 0 && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 28,
                left: '-50%',
                width: '100%',
                height: 2,
                bgcolor: '#d1d5db'
              }}
            />
          )}
          <StageButton
            label={stage.label}
            count={stage.count}
            active={selected === stage.key}
            onClick={() => onSelect(selected === stage.key ? '' : stage.key)}
          />
        </Box>
      ))}
    </Box>

    {outside.length > 0 && (
      <>
        <Box
          sx={{ width: '1px', bgcolor: '#e5e7eb', my: 1, flexShrink: 0 }}
          aria-hidden
        />
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          {outside.map((stage) => (
            <StageButton
              key={stage.key}
              compact
              label={stage.label}
              count={stage.count}
              active={selected === stage.key}
              onClick={() => onSelect(selected === stage.key ? '' : stage.key)}
            />
          ))}
        </Box>
      </>
    )}
  </Paper>
)

export default StagePipeline
