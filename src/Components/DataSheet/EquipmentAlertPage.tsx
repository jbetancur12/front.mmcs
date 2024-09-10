import React, { useEffect, useState } from 'react'
import { Alert, Box, Collapse, Button, Paper, Typography } from '@mui/material'
import { Warning as WarningIcon, Info as InfoIcon } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Link } from 'react-router-dom'

type EquipmentData = {
  id: number
  internalCode: string
  equipmentName: string
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
}

const EquipmentAlertsPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [equipments, setEquipments] = useState<EquipmentData[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchEquipmentData = async () => {
      try {
        const response = await axiosPrivate('/dataSheet/')
        setEquipments(response.data)
      } catch (error) {
        console.error('Error fetching equipment data:', error)
      }
    }

    fetchEquipmentData()
  }, [axiosPrivate])

  const calibrationDueSoon = equipments.filter(
    (equipment) => equipment.isCalibrationDueSoon
  )
  const inspectionDueSoon = equipments.filter(
    (equipment) => equipment.isInspectionDueSoon
  )

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 2,
        maxWidth: 800,
        margin: 'auto',
        mt: 4
      }}
    >
      <Typography variant='h4' gutterBottom>
        Resumen de Alertas
      </Typography>

      {/* Resumen de equipos con calibración e inspección próximas */}
      <Paper elevation={3} sx={{ padding: 2, mb: 2 }}>
        <Alert icon={<WarningIcon />} severity='warning' sx={{ mb: 1 }}>
          <Typography variant='body1'>
            Equipos con calibración próxima: {calibrationDueSoon.length}
          </Typography>
        </Alert>
        <Alert icon={<InfoIcon />} severity='info' sx={{ mb: 1 }}>
          <Typography variant='body1'>
            Equipos con inspección próxima: {inspectionDueSoon.length}
          </Typography>
        </Alert>
      </Paper>

      {/* Botón para expandir detalles */}
      <Button
        variant='contained'
        color='primary'
        onClick={() => setShowDetails(!showDetails)}
        sx={{ mb: 2 }}
      >
        {showDetails ? 'Ocultar Detalles' : 'Mostrar Detalles'}
      </Button>

      {/* Mostrar detalles de cada equipo que requiere calibración o inspección */}
      <Collapse in={showDetails} timeout={500}>
        <Box>
          {calibrationDueSoon.length > 0 && (
            <>
              <Typography variant='h6' gutterBottom>
                Detalles de Equipos con Calibración Próxima
              </Typography>
              {calibrationDueSoon.map((equipment) => (
                <Alert
                  severity='warning'
                  key={equipment.id}
                  icon={<WarningIcon />}
                  sx={{ mb: 1 }}
                >
                  <Link
                    to={`/datasheets/${equipment.id}/inspection-maintenance`}
                  >
                    {equipment.internalCode} - {equipment.equipmentName} -
                    Calibración próxima
                  </Link>
                </Alert>
              ))}
            </>
          )}

          {inspectionDueSoon.length > 0 && (
            <>
              <Typography variant='h6' gutterBottom>
                Detalles de Equipos con Inspección Próxima
              </Typography>
              {inspectionDueSoon.map((equipment) => (
                <Alert
                  severity='info'
                  key={equipment.id}
                  icon={<InfoIcon />}
                  sx={{ mb: 1 }}
                >
                  <Link
                    to={`/datasheets/${equipment.id}/inspection-maintenance`}
                  >
                    {equipment.internalCode} - {equipment.equipmentName} -
                    Inspección próxima
                  </Link>
                </Alert>
              ))}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default EquipmentAlertsPage
