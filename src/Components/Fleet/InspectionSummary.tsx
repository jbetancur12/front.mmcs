import React from 'react'
import { Box, Typography } from '@mui/material'
import { CheckCircle, Warning, Error } from '@mui/icons-material'
import { InspectionHistory } from './types'
import { useLocation } from 'react-router-dom'
import { tr } from 'date-fns/locale'
import { triggerAsyncId } from 'async_hooks'
import { format } from 'date-fns'

// Función para determinar el ícono basado en el estado
const getConditionIcon = (condition: string) => {
  switch (condition) {
    case 'good':
      return <CheckCircle sx={{ color: 'green' }} />
    case 'fair':
      return <Warning sx={{ color: 'orange' }} />
    case 'poor':
    case 'low':
      return <Error sx={{ color: 'red' }} />
    default:
      return null
  }
}

// Componente para mostrar el resumen de la inspección
const InspectionSummary = () => {
  const location = useLocation()
  const { inspection } = location.state as { inspection: InspectionHistory }

  const {
    tireCondition,
    brakeCondition,
    fluidLevels,
    lightsCondition,
    comments,
    trip,
    inspectionDate,
    inspectorName
    // Otros campos que quieras mostrar
  } = inspection

  // Combinar las condiciones en un solo estado
  const conditions = [
    tireCondition,
    brakeCondition,
    fluidLevels,
    lightsCondition
  ]
  const worstCondition = conditions.reduce((worst, condition) => {
    if (
      condition.toLocaleLowerCase() === 'poor' ||
      condition.toLocaleLowerCase() === 'low'
    )
      return 'poor'
    if (condition.toLocaleLowerCase() === 'fair')
      return worst === 'good' ? worst : 'fair'
    return worst
  }, 'good')

  return (
    <Box
      sx={{
        padding: 2,
        border: '1px solid #ddd',
        borderRadius: 2,
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <Typography variant='h6' gutterBottom>
        Resumen de la Inspección
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant='body1' sx={{ flexGrow: 1 }}>
          Estado General:
        </Typography>
        {getConditionIcon(worstCondition)}
      </Box>
      <Box sx={{ mb: 1 }}>
        <Typography variant='body2'>
          <strong>Proposito del viaje: </strong> {trip.purpose}
        </Typography>
        <Typography variant='body2'>
          <strong>Fecha de Inspección: </strong>{' '}
          {format(new Date(inspectionDate), 'dd/MM/yyyy')}
        </Typography>
        <Typography variant='body2'>
          <strong>Inspector:</strong> {inspectorName}
        </Typography>

        <Typography variant='body2'>
          <strong>Condición de los Neumáticos: </strong> {tireCondition}
        </Typography>
        <Typography variant='body2'>
          <strong>Condición de los Frenos: </strong> {brakeCondition}
        </Typography>
        <Typography variant='body2'>
          <strong>Niveles de Fluidos: </strong> {fluidLevels}
        </Typography>
        <Typography variant='body2'>
          <strong>Condición de las Luces: </strong> {lightsCondition}
        </Typography>
        <Typography variant='body2'>
          <strong>Comentarios: </strong>
          {comments}
        </Typography>

        {/* Agrega aquí otros detalles que quieras mostrar */}
      </Box>
    </Box>
  )
}

export default InspectionSummary
