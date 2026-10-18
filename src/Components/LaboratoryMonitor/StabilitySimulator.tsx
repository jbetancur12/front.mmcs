// src/Components/LaboratoryMonitor/StabilitySimulator.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import {
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { PlayArrow, Stop, Science } from '@mui/icons-material'
import { applyCalibrationSensorUpdate } from '@utils/useCalibrationRealtimeUpdates'
import {
  CalibrationSensorUpdatePayload,
  Chamber,
  CHAMBER_STATUS
} from './types'

type Scenario = 'stable' | 'noisy_then_stable' | 'unstable' | 'silent_sensor'

const SCENARIOS: Record<Scenario, { label: string; hint: string }> = {
  stable: {
    label: 'Lecturas estables',
    hint: 'Todos los sensores se estabilizan en unos 10 segundos.'
  },
  noisy_then_stable: {
    label: 'Inestable y luego estable',
    hint: 'Oscilan unos 25 segundos y después se estabilizan.'
  },
  unstable: {
    label: 'Siempre inestable',
    hint: 'No debe avisar nunca.'
  },
  silent_sensor: {
    label: 'Un sensor deja de enviar',
    hint: 'El segundo sensor se queda callado: debe marcarse "Sin señal" y no contar.'
  }
}

const TICK_MS = 2000
const NOISY_TICKS = 12
const SILENT_AFTER_TICK = 5
const WINDOW = 8 // Lecturas que cuentan para la estabilidad simulada

// Mismos umbrales y mínimo que usa la API (checkReadingsStability)
const TEMP_THRESHOLD = 0.5
const HUM_THRESHOLD = 2
const MIN_POINTS = 5

const stdDev = (values: number[]) => {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

const gauss = (sd: number) => {
  // Box-Muller
  const u = 1 - Math.random()
  const v = Math.random()
  return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

interface Props {
  chamber: Chamber
}

/**
 * Panel de pruebas (solo en desarrollo): genera lecturas simuladas y las
 * aplica al caché de la pantalla por el mismo camino que un mensaje real
 * del WebSocket. No toca la API, ni MQTT, ni la base de datos.
 */
export const StabilitySimulator: React.FC<Props> = ({ chamber }) => {
  const queryClient = useQueryClient()
  const [scenario, setScenario] = useState<Scenario>('noisy_then_stable')
  const [running, setRunning] = useState(false)
  const [ticks, setTicks] = useState(0)

  const chamberRef = useRef(chamber)
  chamberRef.current = chamber
  const scenarioRef = useRef(scenario)
  scenarioRef.current = scenario
  const tickRef = useRef(0)
  const historyRef = useRef<Record<string, { t: number[]; h: number[] }>>({})
  const baseRef = useRef<Record<string, { t: number; h: number }>>({})
  const timerRef = useRef<number | null>(null)

  const isCalibrating = chamber.status === CHAMBER_STATUS.CALIBRATING

  const tick = useCallback(() => {
    tickRef.current += 1
    const n = tickRef.current
    const current = chamberRef.current
    const sc = scenarioRef.current
    const noisy =
      sc === 'unstable' || (sc === 'noisy_then_stable' && n <= NOISY_TICKS)
    const sensors = (current.patterns || []).flatMap((p) =>
      (p.sensors || []).map((s) => ({ pattern: p, sensor: s }))
    )
    const silentId = sc === 'silent_sensor' ? sensors[1]?.sensor.id : undefined

    sensors.forEach(({ pattern, sensor }) => {
      const now = Date.now()
      if (sensor.id === silentId && n > SILENT_AFTER_TICK) {
        if (n === SILENT_AFTER_TICK + 1) {
          // Último reporte "viejo": quedó callado hace 5 minutos
          const stale = new Date(now - 5 * 60 * 1000).toISOString()
          applyCalibrationSensorUpdate(queryClient, {
            chamberId: current.id,
            patternId: pattern.id,
            sensorId: sensor.id,
            sensorType: sensor.type,
            lastTemperature: sensor.lastTemperature,
            lastHumidity: sensor.lastHumidity,
            lastSeen: stale,
            newReading: {
              temperature: sensor.lastTemperature ?? null,
              humidity: sensor.lastHumidity ?? null,
              timestamp: stale
            },
            stabilityStatus: { temperatureStable: true, humidityStable: true }
          })
        }
        return
      }

      const base = (baseRef.current[sensor.id] ??= {
        t: sensor.lastTemperature ?? 29.5,
        h: sensor.lastHumidity ?? 60
      })
      const temperature = base.t + gauss(noisy ? 1.5 : 0.08)
      const humidity = base.h + gauss(noisy ? 5 : 0.3)
      const hist = (historyRef.current[sensor.id] ??= { t: [], h: [] })
      hist.t = [...hist.t, temperature].slice(-WINDOW)
      hist.h = [...hist.h, humidity].slice(-WINDOW)

      const hasHum = sensor.type.includes('humidity')
      const payload: CalibrationSensorUpdatePayload = {
        chamberId: current.id,
        patternId: pattern.id,
        sensorId: sensor.id,
        sensorType: sensor.type,
        lastTemperature: temperature,
        lastHumidity: hasHum ? humidity : null,
        lastSeen: new Date(now).toISOString(),
        newReading: {
          temperature,
          humidity: hasHum ? humidity : null,
          timestamp: new Date(now).toISOString()
        },
        stabilityStatus: {
          temperatureStable:
            hist.t.length >= MIN_POINTS && stdDev(hist.t) <= TEMP_THRESHOLD,
          humidityStable:
            hasHum &&
            hist.h.length >= MIN_POINTS &&
            stdDev(hist.h) <= HUM_THRESHOLD
        }
      }
      applyCalibrationSensorUpdate(queryClient, payload)
    })
    setTicks(n)
  }, [queryClient])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRunning(false)
    // Vuelve a los datos reales de la API
    queryClient.invalidateQueries(['chambers'])
  }, [queryClient])

  const start = () => {
    tickRef.current = 0
    historyRef.current = {}
    baseRef.current = {}
    setTicks(0)
    setRunning(true)
    timerRef.current = window.setInterval(tick, TICK_MS)
    tick()
  }

  // Si la cámara deja de calibrar o se desmonta el panel, se detiene sola
  useEffect(() => {
    if (running && !isCalibrating) stop()
  }, [running, isCalibrating, stop])
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    },
    []
  )

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        borderRadius: '12px',
        borderStyle: 'dashed',
        borderColor: '#9ca3af'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Science sx={{ color: '#6b7280' }} />
        <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
          <Typography variant='subtitle2' fontWeight={700}>
            Modo de prueba (solo desarrollo)
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {isCalibrating
              ? 'Lecturas simuladas en esta pantalla: no se guardan ni pasan por MQTT.'
              : 'Inicia la calibración de esta cámara para poder simular lecturas.'}
          </Typography>
        </Box>
        <TextField
          select
          size='small'
          label='Escenario'
          value={scenario}
          onChange={(e) => setScenario(e.target.value as Scenario)}
          disabled={running}
          helperText={SCENARIOS[scenario].hint}
          sx={{ minWidth: 240 }}
        >
          {Object.entries(SCENARIOS).map(([key, { label }]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        {running ? (
          <Button
            variant='outlined'
            color='error'
            startIcon={<Stop />}
            onClick={stop}
          >
            Detener ({ticks})
          </Button>
        ) : (
          <Button
            variant='contained'
            startIcon={<PlayArrow />}
            onClick={start}
            disabled={!isCalibrating}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
          >
            Simular
          </Button>
        )}
      </Box>
    </Paper>
  )
}
