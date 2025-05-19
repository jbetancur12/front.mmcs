import React, { useState, useCallback } from 'react' // Import useCallback
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
  // Type for Brush onChange event (check Recharts docs or infer)
  // Assuming it provides an object with startIndex and endIndex
} from 'recharts'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { format, parseISO, isValid } from 'date-fns'
import { Alert, CircularProgress } from '@mui/material'

// --- Interfaces (sin cambios) ---
interface ChartDataPoint {
  timestamp: string
  [key: string]: any
}

interface SensorInfo {
  id: number
  name: string
  color: string | null
  location: string | null
}

interface HistoricalChartsProps {
  data: ChartDataPoint[]
  sensors: SensorInfo[]
  isLoading: boolean
  isError: boolean
  errorMessage?: string
}

// --- Funciones de formato (sin cambios) ---
const formatTooltipTimestamp = (value: string | number): string => {
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm:ss') : 'Fecha inválida'
}

interface TooltipPayloadItem {
  dataKey?: string | number
  name?: string
  value?: number
  payload?: ChartDataPoint
}

const formatTooltipValue = (
  value: number,
  name: string,
  entry: TooltipPayloadItem
): [string, string] | string => {
  // Allow returning just string for simplicity if needed
  // Handle potential null/undefined values gracefully
  if (value === null || value === undefined) {
    return [`N/A`, name]
  }
  const dataKey = String(entry.dataKey || '')
  const metric = dataKey.startsWith('temp') ? '°C' : '%'
  return [`${value.toFixed(2)} ${metric}`, name]
}

// --- Componente HistoricalCharts (Modificado) ---
const HistoricalCharts: React.FC<HistoricalChartsProps> = ({
  data,
  sensors,
  isLoading,
  isError,
  errorMessage
}) => {
  // Estado para controlar qué sensores están deshabilitados en la leyenda
  const [disabledSensors, setDisabledSensors] = useState<Set<number>>(new Set())

  // --- NUEVO: Estado para controlar el rango del Brush ---
  // Guardamos startIndex y endIndex. Inicialmente undefined para que Recharts use el rango completo.
  const [brushRange, setBrushRange] = useState<{
    startIndex?: number
    endIndex?: number
  }>({
    startIndex: undefined,
    endIndex: undefined
  })

  // Ordenar los datos una sola vez
  // Usamos useMemo para evitar re-ordenar en cada render si 'data' no cambia de referencia
  const sortedData = React.useMemo(() => {
    // Es importante devolver una NUEVA instancia ordenada si 'data' cambia
    return [...data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [data]) // Re-calcular solo si la referencia de 'data' cambia

  // --- NUEVO: Handler para actualizar el estado del Brush ---
  // Usamos useCallback para evitar crear una nueva función en cada render
  const handleBrushChange = useCallback(
    (newRange: { startIndex?: number; endIndex?: number }) => {
      // Actualizar el estado solo si los índices son válidos (no undefined)
      // Esto ocurre cuando el usuario suelta el mouse después de mover el brush
      if (
        newRange.startIndex !== undefined &&
        newRange.endIndex !== undefined
      ) {
        console.log('Brush range changed:', newRange) // Para depuración
        setBrushRange({
          startIndex: newRange.startIndex,
          endIndex: newRange.endIndex
        })
      }
      // Si solo uno de los índices es undefined (puede pasar durante el movimiento),
      // podríamos optar por no actualizar el estado hasta que ambos sean válidos.
    },
    []
  ) // Sin dependencias, ya que solo llama a setBrushRange

  // Función para activar/desactivar sensores en la leyenda
  const toggleSensor = (sensorId: number) => {
    setDisabledSensors((prev) => {
      const next = new Set(prev)
      next.has(sensorId) ? next.delete(sensorId) : next.add(sensorId)
      return next
    })
  }

  // Función para renderizar la leyenda personalizada
  const renderLegend = () => {
    // Extraer payload de props (contiene la info de las líneas)
    // const { payload } = props; // Si necesitas acceder al payload original

    return (
      // Usar Tailwind para estilizar la leyenda
      <div className='flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2 mb-4 text-sm'>
        {sensors.map((sensor) => {
          const isDisabled = disabledSensors.has(sensor.id)
          return (
            <span
              key={sensor.id}
              onClick={() => toggleSensor(sensor.id)}
              style={{
                // Usar el color del sensor
                color: isDisabled ? '#aaa' : sensor.color || '#666',
                cursor: 'pointer',
                textDecoration: isDisabled ? 'line-through' : 'none',
                opacity: isDisabled ? 0.5 : 1, // Atenuar si está deshabilitado
                transition: 'opacity 0.2s ease-in-out' // Transición suave
              }}
              className='font-medium hover:opacity-80' // Estilo adicional con Tailwind
            >
              {/* Icono de color (opcional) */}
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  backgroundColor: isDisabled ? '#aaa' : sensor.color || '#666',
                  marginRight: '5px',
                  borderRadius: '50%', // Círculo
                  verticalAlign: 'middle'
                }}
              ></span>
              {sensor.name} ({sensor.location || 'N/A'})
            </span>
          )
        })}
      </div>
    )
  }

  // --- Renderizado Condicional ---
  if (isLoading) {
    return (
      <Box className='flex justify-center items-center h-64'>
        <CircularProgress />
        <Typography className='ml-4 text-gray-600'>
          Cargando gráficos...
        </Typography>
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert severity='error' className='mt-4'>
        Error al cargar los datos:{' '}
        {errorMessage || 'Ocurrió un error desconocido.'}
      </Alert>
    )
  }

  // Mostrar mensaje si no hay datos DESPUÉS de que la carga terminó y no hubo error
  if (!isLoading && !isError && (!sortedData || sortedData.length === 0)) {
    return (
      <Typography className='text-center text-gray-500 mt-10'>
        No hay datos históricos disponibles para la selección actual.
      </Typography>
    )
  }

  // --- Renderizado Principal de Gráficos ---
  return (
    // Usar un Fragment o Box si solo hay un elemento raíz
    <Box className='mt-4 space-y-8'>
      {' '}
      {/* Espacio entre gráficos */}
      {/* Gráfico unificado de Temperatura */}
      <Box>
        <Typography
          variant='h6'
          component='h3'
          sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}
        >
          {' '}
          {/* Estilo MUI */}
          Temperatura (°C)
        </Typography>
        <ResponsiveContainer width='100%' height={400}>
          {/* Usar sortedData */}
          <LineChart data={sortedData} syncId='historicalSync'>
            {' '}
            {/* syncId para sincronizar tooltips/brush */}
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            {/* Formato de hora/minuto para el eje X principal */}
            <XAxis
              dataKey='timestamp'
              tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              stroke='#666'
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: '°C',
                angle: -90,
                position: 'insideLeft',
                fill: '#666',
                fontSize: 12,
                dy: -10
              }}
              stroke='#666'
              tick={{ fontSize: 12 }}
              // Ajustar dominio dinámicamente con algo de padding
              domain={['dataMin - 2', 'dataMax + 2']} // Menor padding que antes
              allowDecimals={true}
              tickFormatter={(value) => value.toFixed(1)} // Formato con 1 decimal
            />
            <Tooltip
              labelFormatter={formatTooltipTimestamp}
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                borderColor: '#ccc'
              }} // Estilo tooltip
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
            />
            {/* Leyenda personalizada */}
            <Legend content={renderLegend} verticalAlign='bottom' />
            {/* Líneas de Temperatura */}
            {sensors.map(
              (sensor) =>
                !disabledSensors.has(sensor.id) && (
                  <Line
                    key={`temp_${sensor.id}`}
                    dataKey={`temp_${sensor.id}`}
                    stroke={sensor.color || '#8884d8'}
                    name={`${sensor.name} (${sensor.location || 'N/A'})`}
                    dot={false} // Sin puntos para datos densos
                    strokeWidth={1} // Grosor de línea
                    isAnimationActive={false} // Desactivar animación en actualizaciones
                    connectNulls={true} // Conectar puntos aunque falten datos intermedios
                  />
                )
            )}
            {/* --- Brush Controlado --- */}
            <Brush
              dataKey='timestamp'
              height={30}
              stroke='#8884d8' // Color del brush
              // Formato más simple para los ticks del brush
              tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              // --- Pasar el estado para controlar el rango ---
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              // --- Actualizar el estado cuando el usuario cambia el rango ---
              onChange={handleBrushChange}
              travellerWidth={10} // Ancho de los controles deslizantes
              gap={5} // Espacio entre controles
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {/* Gráfico unificado de Humedad */}
      <Box>
        <Typography
          variant='h6'
          component='h3'
          sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}
        >
          Humedad (%)
        </Typography>
        <ResponsiveContainer width='100%' height={400}>
          {/* Usar sortedData y el mismo syncId */}
          <LineChart data={sortedData} syncId='historicalSync'>
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            <XAxis
              dataKey='timestamp'
              tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              stroke='#666'
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: '%',
                angle: -90,
                position: 'insideLeft',
                fill: '#666',
                fontSize: 12,
                dy: -10
              }}
              stroke='#666'
              tick={{ fontSize: 12 }}
              // Dominio con padding para humedad
              domain={['dataMin - 5', 'dataMax + 5']} // Padding diferente para humedad
              allowDecimals={false} // Generalmente humedad no necesita decimales
            />
            <Tooltip
              labelFormatter={formatTooltipTimestamp}
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                borderColor: '#ccc'
              }}
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
            />
            <Legend content={renderLegend} verticalAlign='bottom' />

            {/* Líneas de Humedad */}
            {sensors.map(
              (sensor) =>
                !disabledSensors.has(sensor.id) && (
                  <Line
                    key={`hum_${sensor.id}`}
                    dataKey={`hum_${sensor.id}`}
                    stroke={sensor.color || '#82ca9d'} // Color diferente para humedad
                    name={`${sensor.name} (${sensor.location || 'N/A'})`}
                    dot={false}
                    strokeWidth={1}
                    isAnimationActive={false}
                    connectNulls={true}
                  />
                )
            )}

            {/* --- Brush Controlado (Sincronizado) --- */}
            <Brush
              dataKey='timestamp'
              height={30}
              stroke='#82ca9d' // Color diferente para el brush de humedad? O usar el mismo? Usemos el mismo para consistencia visual del control.
              // stroke="#8884d8" // O usar el mismo color que el de temperatura
              tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              // --- Pasar el MISMO estado para controlar el rango ---
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              // --- Actualizar el MISMO estado cuando el usuario cambia el rango ---
              onChange={handleBrushChange}
              travellerWidth={10}
              gap={5}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box> // Fin del Box contenedor principal
  )
}

export default HistoricalCharts
