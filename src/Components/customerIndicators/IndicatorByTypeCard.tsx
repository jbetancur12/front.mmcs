import React, { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Typography
} from '@mui/material'
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

/** Indicador 2: calibrados frente a contratados de cada tipo de equipo. */
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

  return (
    <Card
      elevation={0}
      sx={{ height: '100%', borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Calibrados por tipo de equipo
        </Typography>
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
              aria-label='Calibrados por tipo de equipo'
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                maxHeight: 400,
                overflowY: 'auto',
                pr: 1
              }}
            >
              {sorted.map((row) => {
                const pct = row.contracted > 0 ? row.progressPct : null
                const label = cleanTypeLabel(row.label)
                const unmatched =
                  !!onAssociate && row.contracted > 0 && row.calibrated === 0
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
                        <Button
                          size='small'
                          onClick={() => onAssociate?.(row)}
                          aria-label={`Asociar ${label} a un tipo de certificado`}
                          sx={{
                            ml: 1,
                            minWidth: 0,
                            py: 0,
                            textTransform: 'none',
                            color: TEAL_TEXT
                          }}
                        >
                          Asociar
                        </Button>
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
