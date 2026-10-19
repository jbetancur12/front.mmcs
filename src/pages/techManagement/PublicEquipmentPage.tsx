import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  Checkbox,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { MedicalServices, ReportProblemOutlined } from '@mui/icons-material'
import { techErrorMessage, usePublicEquipment, usePublicFailureReport } from '@hooks/useTechManagement'
import {
  ACTIVITY_TYPE_LABELS,
  formatDate,
  primaryButtonSx,
  SCHEDULE_STATUS,
  StatusChip
} from 'src/Components/techManagement/techUi'

/**
 * Página que abre el código QR pegado en el equipo: hoja de vida resumida para el auditor o el personal asistencial y
 * un formulario corto para reportar una falla (llega a la institución como borrador de tecnovigilancia).
 */
const PublicEquipmentPage = () => {
  const { token = '' } = useParams()
  const { data: equipment, isLoading, isError } = usePublicEquipment(token)
  const report = usePublicFailureReport(token)
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [service, setService] = useState('')
  const [patientAffected, setPatientAffected] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (description.trim().length < 10) {
      setError('Describe la falla con al menos 10 caracteres.')
      return
    }
    try {
      await report.mutateAsync({ description, reporterName, service, patientAffected })
    } catch (err) {
      setError(techErrorMessage(err, 'No se pudo enviar el reporte.'))
    }
  }

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 2, sm: 4 } }}>
      <Container maxWidth='sm'>
        {isError || !equipment ? (
          <Alert severity='warning'>Este código no corresponde a un equipo activo.</Alert>
        ) : (
          <Stack spacing={2}>
            <Box sx={{ borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', p: 3 }}>
              <Box display='flex' gap={2} alignItems='center'>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <MedicalServices />
                </Avatar>
                <Box minWidth={0}>
                  <Typography variant='h5' fontWeight='bold'>
                    {equipment.name}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    {[equipment.brand, equipment.model, equipment.serie && `Serie ${equipment.serie}`].filter(Boolean).join(' · ')}
                  </Typography>
                  {equipment.customerName && (
                    <Typography variant='body2' sx={{ opacity: 0.85 }}>
                      {equipment.customerName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <CardContent>
                <Box display='flex' justifyContent='space-between' alignItems='center' mb={2} gap={1} flexWrap='wrap'>
                  <Typography fontWeight={600}>Estado del equipo</Typography>
                  <StatusChip {...SCHEDULE_STATUS[equipment.scheduleStatus]} />
                </Box>
                <Grid container spacing={2}>
                  {[
                    ['Última calibración', formatDate(equipment.lastCalibration)],
                    ['Último preventivo', formatDate(equipment.lastPreventive)],
                    [
                      'Próxima actividad',
                      equipment.nextDueDate
                        ? `${formatDate(equipment.nextDueDate)}${equipment.nextDueType ? ` · ${ACTIVITY_TYPE_LABELS[equipment.nextDueType]}` : ''}`
                        : '—'
                    ],
                    ['Clase de riesgo', equipment.riskClass || '—'],
                    ['Registro sanitario', equipment.invimaRegistry || '—'],
                    ['Ubicación', [equipment.sede, equipment.service, equipment.location].filter(Boolean).join(' · ') || '—']
                  ].map(([label, value]) => (
                    <Grid item xs={6} key={label}>
                      <Typography variant='caption' color='text.secondary'>
                        {label}
                      </Typography>
                      <Typography variant='body2'>{value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {equipment.history.length > 0 && (
              <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography fontWeight={600} mb={1}>
                    Últimos servicios
                  </Typography>
                  {equipment.history.map((item, index) => (
                    <Box key={index} display='flex' justifyContent='space-between' py={0.75} borderBottom='1px solid #f1f5f9'>
                      <Typography variant='body2'>{ACTIVITY_TYPE_LABELS[item.type]}</Typography>
                      <Typography variant='body2' color={item.result === 'no_conforme' ? 'error' : 'text.secondary'}>
                        {formatDate(item.executedAt)}
                        {item.result === 'no_conforme' && ' · No conforme'}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <CardContent>
                {report.isSuccess ? (
                  <Alert severity='success'>
                    Reporte {report.data.code} enviado. El responsable de tecnovigilancia de la institución lo revisará.
                  </Alert>
                ) : !showForm ? (
                  <Button fullWidth variant='outlined' color='error' startIcon={<ReportProblemOutlined />} onClick={() => setShowForm(true)} sx={{ textTransform: 'none', fontWeight: 600, py: 1.25 }}>
                    Reportar una falla o incidente con este equipo
                  </Button>
                ) : (
                  <Stack spacing={2}>
                    <Typography fontWeight={600}>Reportar una falla</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      No incluyas datos personales del paciente.
                    </Typography>
                    <TextField
                      multiline
                      minRows={3}
                      label='¿Qué pasó?'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      inputProps={{ maxLength: 2000 }}
                    />
                    <TextField label='Tu nombre (opcional)' value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
                    <TextField label='Servicio (opcional)' value={service} onChange={(e) => setService(e.target.value)} />
                    <FormControlLabel
                      control={<Checkbox checked={patientAffected} onChange={(e) => setPatientAffected(e.target.checked)} />}
                      label='La falla afectó o pudo afectar a un paciente o usuario'
                    />
                    {error && <Alert severity='error'>{error}</Alert>}
                    <Button variant='contained' onClick={handleSubmit} disabled={report.isLoading} sx={primaryButtonSx}>
                      Enviar reporte
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
            <Typography variant='caption' color='text.secondary' textAlign='center'>
              Gestión tecnológica · Metromedics
            </Typography>
          </Stack>
        )}
      </Container>
    </Box>
  )
}

export default PublicEquipmentPage
