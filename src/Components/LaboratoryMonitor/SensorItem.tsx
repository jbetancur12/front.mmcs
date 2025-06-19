// src/Components/LaboratoryMonitor/SensorItem.tsx
import React, { useState } from 'react' // useMemo no se usa pero puede quedar
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  Grid,
  Chip,
  Tooltip as MuiTooltip,
  CircularProgress,
  Alert
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import OpacityIcon from '@mui/icons-material/Opacity'
import ShowChartIcon from '@mui/icons-material/ShowChart'

import { useQuery, useQueryClient, QueryKey } from 'react-query' // Para React Query v3
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta ruta

// Ajusta ruta a tipos
import {
  Sensor,
  SensorDataPoint,
  Chamber,
  CHAMBER_STATUS,
  ChamberStatus
} from './types'
import { SensorDataTable } from './SensorDataTable'
import { SensorRealtimeChart } from './SensorRealtimeChart'
// Importar SOLO la función de fetch para CalibrationReadings
import { fetchSensorReadings as apiFetchSensorReadings } from './services/calibrationApi'
import { ErrorOutline } from '@mui/icons-material'

// Límite para historial general (o calibración)
const MAX_HISTORICAL_DATA_POINTS_DISPLAY = 60 // Límite en frontend (manejado por WS hook)

interface SensorItemProps {
  sensor: Sensor
  chamberId: string | number
  patternId: string | number
  chamberStatus: ChamberStatus // <= Prop obligatorio para saber el estado
  onDeleteSensor: (sensorId: string | number) => void
  isLoadingDelete?: boolean
}

export const SensorItem: React.FC<SensorItemProps> = ({
  sensor: sensorProp,
  chamberId,
  patternId,
  chamberStatus, // <= Recibir estado
  onDeleteSensor,
  isLoadingDelete = false
}) => {
  // Desestructurar el sensor que viene de React Query (actualizado por WS)
  const {
    id: sensorId,
    name,
    type,
    showGraph,

    lastTemperature,
    lastHumidity,

    historicalData = [] // Este array es la fuente principal, actualizado por WS
  } = sensorProp

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const chambersQueryKey: QueryKey = ['chambers']

  const [isExpanded, setIsExpanded] = useState(showGraph) // Expandir inicialmente si la gráfica está activa

  const isCalibrating = chamberStatus === CHAMBER_STATUS.CALIBRATING

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    expanded: boolean
  ) => {
    setIsExpanded(expanded)
  }

  const sensorReadingsQueryKey: QueryKey = ['sensorReadings', sensorId] // La clave puede ser la misma
  const {
    isLoading: isLoadingInitialData, // Renombrado para claridad
    isError: isErrorInitialData,
    error: errorInitialData
  } = useQuery(
    sensorReadingsQueryKey,
    // Llama a la función API existente, el backend decide qué datos devolver
    () => apiFetchSensorReadings(axiosPrivate, sensorId),
    {
      // Activar si está expandido, tiene gráfica Y NO hay datos históricos en caché
      enabled: isExpanded && showGraph && historicalData.length === 0,
      staleTime: 5 * 60 * 1000, // Datos pueden volverse stale
      cacheTime: 10 * 60 * 1000,
      onSuccess: (fetchedData) => {
        // Actualiza el caché principal ['chambers'] con los datos históricos obtenidos (calibración o general)
        // Chequea la fuente si el backend la envía

        queryClient.setQueryData<Chamber[]>(
          chambersQueryKey,
          (oldChambersData) => {
            if (!oldChambersData) return []
            return oldChambersData.map((chamber) => {
              if (chamber.id !== chamberId) return chamber
              return {
                ...chamber,
                patterns: (chamber.patterns || []).map((pattern) => {
                  if (pattern.id !== patternId) return pattern
                  return {
                    ...pattern,
                    sensors: (pattern.sensors || []).map((s_cache) => {
                      if (s_cache.id !== sensorId) return s_cache

                      // Mapear lecturas y ordenar
                      const fetchedPoints = (fetchedData.readings || [])
                        .map(
                          (reading) =>
                            ({
                              timestamp: new Date(reading.timestamp).getTime(),
                              temperature: reading.temperature,
                              humidity: reading.humidity
                            }) as SensorDataPoint
                        )
                        .sort((a, b) => a.timestamp - b.timestamp)

                      // Solo sobrescribir si no teníamos NADA (para no perder datos de WS)
                      // O podrías implementar una lógica de merge más sofisticada si es necesario.
                      const mergedData =
                        s_cache.historicalData &&
                        s_cache.historicalData.length > 0
                          ? [...s_cache.historicalData] // Si ya hay datos (de WS?), no los sobrescribas ciegamente
                          : fetchedPoints // Si estaba vacío, usa los datos del fetch

                      // (La lógica de merge más compleja de la versión anterior podría ir aquí si es necesaria)

                      // Aplicar límite
                      while (
                        mergedData.length > MAX_HISTORICAL_DATA_POINTS_DISPLAY
                      ) {
                        mergedData.shift()
                      }

                      return { ...s_cache, historicalData: mergedData }
                    })
                  }
                })
              }
            })
          }
        )
      },
      onError: (err) => {
        console.error(`Error fetching initial readings for ${sensorId}:`, err)
      }
    }
  )

  const isLoadingDisplay = isLoadingInitialData && historicalData.length === 0
  const isErrorDisplay = isErrorInitialData && historicalData.length === 0
  const errorDisplay = errorInitialData

  const getSensorTypeLabel = () => {
    if (type === 'temperature_humidity') return 'Temp & Hum'
    return 'Solo Temp'
  }

  return (
    <Accordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
      sx={{ mb: 1, '&.Mui-expanded': { mb: 1 } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} /* ... aria ... */>
        {/* ... Contenido del Summary (Iconos, Nombre, Chip, Botón Borrar) ... */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}
        >
          <Box sx={{ display: 'flex' }}>
            {type === 'temperature_humidity' ? (
              <>
                <MuiTooltip title='Temperatura'>
                  <ThermostatIcon
                    sx={{ color: 'error.main' }}
                    fontSize='small'
                  />
                </MuiTooltip>
                <MuiTooltip title='Humedad'>
                  <OpacityIcon sx={{ color: 'info.main' }} fontSize='small' />
                </MuiTooltip>
              </>
            ) : (
              <MuiTooltip title='Temperatura'>
                <ThermostatIcon sx={{ color: 'error.main' }} fontSize='small' />
              </MuiTooltip>
            )}
          </Box>
          <Typography variant='subtitle1' sx={{ flexGrow: 1, mr: 1 }}>
            {name}
          </Typography>
          {showGraph && (
            <MuiTooltip title='Gráfica Activada'>
              <ShowChartIcon color='action' fontSize='small' />
            </MuiTooltip>
          )}
          <Chip label={getSensorTypeLabel()} size='small' variant='outlined' />
          <MuiTooltip title='Eliminar Sensor'>
            <span>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSensor(sensorId)
                }}
                disabled={isLoadingDelete}
                color='error'
              >
                {isLoadingDelete ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  <DeleteIcon fontSize='small' />
                )}
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 2 }}>
        <Grid container spacing={2} sx={{ mb: showGraph ? 2 : 0 }}>
          {/* Valores Actuales */}
          {type.includes('temperature') && (
            <Grid item xs={12} sm={type === 'temperature_humidity' ? 6 : 12}>
              <Typography variant='h6' color='textPrimary'>
                Temp:{' '}
                {lastTemperature?.toFixed(2) ??
                  lastTemperature?.toFixed(2) ??
                  '--'}
                °C
              </Typography>
            </Grid>
          )}
          {type.includes('humidity') && (
            <Grid item xs={12} sm={6}>
              <Typography variant='h6' color='textPrimary'>
                Hum:{' '}
                {lastHumidity?.toFixed(2) ?? lastHumidity?.toFixed(2) ?? '--'}%
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Mostrar sección de gráfica y tabla si showGraph es true */}
        {showGraph ? (
          // Mostrar contenido SOLO si está calibrando (según "lo otro no lo necesito")
          isCalibrating ? (
            <>
              {/* Indicador de carga inicial */}
              {isLoadingDisplay && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                    minHeight: 100
                  }}
                >
                  <CircularProgress size={30} />
                  <Typography
                    sx={{ ml: 1 }}
                    variant='body2'
                    color='textSecondary'
                  >
                    Cargando historial de calibración...
                  </Typography>
                </Box>
              )}
              {/* Indicador de error inicial */}
              {isErrorDisplay && !isLoadingDisplay && (
                <Alert
                  severity='warning'
                  icon={<ErrorOutline fontSize='inherit' />}
                  sx={{ my: 1 }}
                >
                  No se pudo cargar historial inicial:{' '}
                  {(errorDisplay instanceof Error
                    ? errorDisplay.message
                    : String(errorDisplay)) || 'Error desconocido'}
                </Alert>
              )}
              {(!isLoadingDisplay && !isErrorDisplay) ||
              historicalData.length > 0 ? (
                <>
                  <SensorDataTable data={historicalData} sensorType={type} />
                  <SensorRealtimeChart
                    data={historicalData}
                    sensorType={type}
                  />
                </>
              ) : null}
            </>
          ) : (
            <Typography
              variant='body2'
              color='textSecondary'
              sx={{ textAlign: 'center', py: 4 }}
            >
              La gráfica y tabla se muestran durante la calibración.
            </Typography>
          )
        ) : (
          <Typography
            variant='body2'
            color='textSecondary'
            sx={{ textAlign: 'center', py: 4 }}
          >
            Gráfica desactivada para este sensor.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
