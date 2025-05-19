import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AccessTimeIcon from '@mui/icons-material/AccessTime' // Re-added AccessTimeIcon
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Tooltip from '@mui/material/Tooltip' // Import Tooltip for icons
import { format, parseISO, isValid } from 'date-fns' // Import date-fns functions

// Importar interfaces necesarias
// Asegúrate que la ruta de importación sea correcta
import { ApiDeviceData } from './LaboratoryMonitor'
// Ya no se necesita la interfaz SensorStatistics aquí

interface SensorCardProps {
  // Datos actuales del sensor
  sensor: ApiDeviceData
  // Ya no se necesita la prop 'statistics'

  // Handlers para editar/eliminar
  onEditClick: (sensor: ApiDeviceData) => void
  onDeleteClick: (sensorId: number) => void
}

// Helper para formatear la fecha/hora de 'lastSeen'
const formatLastSeen = (timestamp: string | null | undefined): string => {
  if (!timestamp) {
    return 'N/A'
  }
  try {
    const date = parseISO(timestamp) // Usar parseISO para strings ISO
    // Verifica si la fecha es válida después de parsear
    if (!isValid(date)) {
      // Usar isValid de date-fns
      console.warn('Invalid date format received for lastSeen:', timestamp)
      return 'Fecha inválida'
    }
    // Formato deseado (ej: YYYY-MM-DD HH:mm:ss)
    return format(date, 'yyyy-MM-dd HH:mm:ss')
  } catch (e) {
    console.error('Error formatting date:', timestamp, e)
    return 'Error fecha'
  }
}

const SensorCard: React.FC<SensorCardProps> = ({
  sensor,
  onEditClick,
  onDeleteClick
}) => {
  // Usar un color por defecto si sensor.color es null o undefined
  const cardBorderColor = sensor.color || '#cccccc' // Gris por defecto si no hay color

  return (
    // Card principal con borde completo controlado por el color del sensor
    <Card
      variant='outlined' // Usar outlined para el borde
      sx={{
        borderRadius: '12px', // Bordes más redondeados
        borderColor: cardBorderColor,
        borderWidth: 2, // Borde un poco más grueso
        height: '100%', // Para que todas las tarjetas tengan la misma altura en un grid
        display: 'flex',
        flexDirection: 'column',
        position: 'relative', // Para posicionar los botones
        backgroundColor: '#f8f9fa' // Fondo ligeramente grisáceo
      }}
    >
      {/* --- Botones de Editar y Eliminar --- */}
      {/* Posicionados arriba a la derecha */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 1,
          display: 'flex',
          gap: 0.5
        }}
      >
        <Tooltip title={`Editar ${sensor.name}`}>
          <IconButton
            size='small'
            onClick={() => onEditClick(sensor)}
            aria-label='editar sensor'
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(220, 220, 220, 0.8)' }
            }}
          >
            <EditIcon fontSize='small' sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Eliminar ${sensor.name}`}>
          <IconButton
            size='small'
            onClick={() => onDeleteClick(sensor.id)}
            aria-label='eliminar sensor'
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(220, 220, 220, 0.8)' }
            }}
          >
            <DeleteIcon fontSize='small' sx={{ color: 'error.main' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <CardContent
        sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}
      >
        {' '}
        {/* Padding y flex grow */}
        {/* Nombre y Ubicación */}
        <Box sx={{ mb: 2, pr: '60px' }}>
          {' '}
          {/* Padding derecho para no superponer botones */}
          <Typography
            variant='h6'
            component='div'
            sx={{ fontWeight: 'bold', color: 'text.primary', lineHeight: 1.3 }}
          >
            {sensor.name}
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {sensor.location || 'Ubicación no especificada'}
          </Typography>
        </Box>
        {/* Contenedor principal para las cajas de Temp y Humedad */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {' '}
          {/* Añadido margen inferior mb: 2 */}
          {/* Caja de Temperatura */}
          <Box
            sx={{
              flex: 1, // Ocupar espacio equitativo
              backgroundColor: '#e3f2fd', // Azul claro
              borderRadius: '8px',
              p: 1.5, // Padding interno
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center', // Centrar contenido
              textAlign: 'center'
            }}
          >
            <Typography
              variant='body2'
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#0d47a1',
                mb: 0.5,
                fontWeight: 'medium'
              }}
            >
              {' '}
              {/* Azul oscuro */}
              <ThermostatIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />
              Temperatura
            </Typography>
            <Typography
              variant='h4'
              component='div'
              sx={{ fontWeight: 'bold', color: '#0d47a1', lineHeight: 1.2 }}
            >
              {' '}
              {/* Quitado mb: 0.5 */}
              {/* Mostrar valor actual o N/A */}
              {sensor.lastTemperature !== null
                ? `${sensor.lastTemperature.toFixed(1)}°C`
                : 'N/A'}
            </Typography>
            {/* SE ELIMINA LA SECCIÓN MIN/MAX */}
          </Box>
          {/* Caja de Humedad */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#fff8e1', // Amarillo/beige claro
              borderRadius: '8px',
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography
              variant='body2'
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#e65100',
                mb: 0.5,
                fontWeight: 'medium'
              }}
            >
              {' '}
              {/* Naranja oscuro */}
              <WaterDropIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />
              Humedad
            </Typography>
            <Typography
              variant='h4'
              component='div'
              sx={{ fontWeight: 'bold', color: '#e65100', lineHeight: 1.2 }}
            >
              {' '}
              {/* Quitado mb: 0.5 */}
              {/* Mostrar valor actual o N/A */}
              {sensor.lastHumidity !== null
                ? `${sensor.lastHumidity.toFixed(1)}%`
                : 'N/A'}
            </Typography>
            {/* SE ELIMINA LA SECCIÓN MIN/MAX */}
          </Box>
        </Box>
        {/* --- RE-AÑADIDO: Última vez visto --- */}
        {/* Usar flexGrow: 1 en CardContent y mt: 'auto' aquí para empujar al fondo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 'auto',
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <AccessTimeIcon
            sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }}
          />
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', fontStyle: 'italic' }}
          >
            Última vez: {formatLastSeen(sensor.lastSeen)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default SensorCard
