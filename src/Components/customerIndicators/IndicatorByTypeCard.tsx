import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material'
import { Link as LinkIcon, WarningAmberRounded } from '@mui/icons-material'
import { IndicatorTypeRow } from 'src/types/customerIndicators'
import {
  TEAL,
  TEAL_TEXT,
  cleanTypeLabel,
  formatCount,
  formatPctOrDash
} from './indicatorFormat'

interface Props {
  rows: IndicatorTypeRow[]
  /** Si se pasa, los tipos de ODS sin certificados muestran "Asociar". */
  onAssociate?: (row: IndicatorTypeRow) => void
}

// Tipos que se muestran antes de "Ver todos"
const VISIBLE_ROWS = 6

/** Indicador 2: equipos con servicio metrológico frente a contratados de cada tipo de equipo. */
const IndicatorByTypeCard: React.FC<Props> = ({ rows, onAssociate }) => {
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => b.contracted - a.contracted || b.calibrated - a.calibrated
      ),
    [rows]
  )
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          contracted: acc.contracted + row.contracted,
          calibrated: acc.calibrated + row.calibrated
        }),
        { contracted: 0, calibrated: 0 }
      ),
    [rows]
  )
  const totalPct =
    totals.contracted > 0 ? (totals.calibrated / totals.contracted) * 100 : null
  const [expanded, setExpanded] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const isUnmatched = (row: IndicatorTypeRow) =>
    !!onAssociate && row.contracted > 0 && row.calibrated === 0
  const unmatchedRows = sorted.filter(isUnmatched)
  const visibleRows = expanded ? sorted : sorted.slice(0, VISIBLE_ROWS)

  return (
    <Card
      elevation={0}
      sx={{ height: '100%', borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 1
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            Con servicio metrológico por tipo de equipo
          </Typography>
          {unmatchedRows.length > 0 && (
            <>
              <Button
                size='small'
                startIcon={<LinkIcon />}
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                aria-haspopup='menu'
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: TEAL_TEXT
                }}
              >
                Asociar tipos ({unmatchedRows.length})
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                {unmatchedRows.map((row) => (
                  <MenuItem
                    key={row.key}
                    onClick={() => {
                      setMenuAnchor(null)
                      onAssociate?.(row)
                    }}
                  >
                    {cleanTypeLabel(row.label)}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
        {unmatchedRows.length > 0 && (
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block', mb: 1 }}
          >
            {unmatchedRows.length}{' '}
            {unmatchedRows.length === 1
              ? 'tipo sin certificados asociados'
              : 'tipos sin certificados asociados'}
            .
          </Typography>
        )}
        {sorted.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 4 }}>
            Aún no hay equipos contratados ni certificados de calibración en
            este periodo.
          </Typography>
        ) : (
          <>
            <Box
              component='ul'
              tabIndex={0}
              aria-label='Con servicio metrológico por tipo de equipo'
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                pr: 0
              }}
            >
              {visibleRows.map((row) => {
                const pct = row.contracted > 0 ? row.progressPct : null
                const label = cleanTypeLabel(row.label)
                const unmatched = isUnmatched(row)
                return (
                  <Box
                    component='li'
                    key={row.key}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr auto',
                        sm: 'minmax(120px, 1.2fr) minmax(80px, 1.5fr) auto 52px'
                      },
                      alignItems: 'center',
                      columnGap: 2,
                      rowGap: 0.5,
                      py: 1
                    }}
                  >
                    <Typography
                      variant='body2'
                      fontWeight={600}
                      sx={{ minWidth: 0, overflowWrap: 'anywhere' }}
                    >
                      {label}
                      {unmatched && (
                        <Tooltip title='Sin certificados asociados'>
                          <WarningAmberRounded
                            aria-label='Sin certificados asociados'
                            sx={{
                              ml: 0.75,
                              fontSize: 16,
                              color: '#b45309',
                              verticalAlign: 'text-bottom'
                            }}
                          />
                        </Tooltip>
                      )}
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={Math.min(pct ?? 0, 100)}
                      aria-label={`Avance de ${label}`}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e5e7eb',
                        gridColumn: { xs: '1 / 2', sm: 2 },
                        gridRow: { xs: 2, sm: 1 },
                        '& .MuiLinearProgress-bar': {
                          bgcolor: TEAL,
                          borderRadius: 4
                        }
                      }}
                    />
                    <Typography
                      variant='body2'
                      sx={{
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right',
                        gridColumn: { xs: 2, sm: 3 },
                        gridRow: 1
                      }}
                    >
                      {formatCount(row.calibrated)} /{' '}
                      {formatCount(row.contracted)}
                    </Typography>
                    <Typography
                      variant='body2'
                      fontWeight={600}
                      sx={{
                        color: TEAL_TEXT,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right',
                        gridColumn: { xs: 2, sm: 4 },
                        gridRow: { xs: 2, sm: 1 }
                      }}
                    >
                      {formatPctOrDash(pct)}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
            {sorted.length > VISIBLE_ROWS && (
              <Button
                size='small'
                onClick={() => setExpanded((current) => !current)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: TEAL_TEXT
                }}
              >
                {expanded
                  ? 'Ver menos'
                  : `Ver todos los tipos (${sorted.length})`}
              </Button>
            )}
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
            >
              <Typography variant='body2' fontWeight={700}>
                Total
              </Typography>
              <Typography
                variant='body2'
                fontWeight={700}
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCount(totals.calibrated)} /{' '}
                {formatCount(totals.contracted)}
                {'  ·  '}
                {formatPctOrDash(totalPct)}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default IndicatorByTypeCard
