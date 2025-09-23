import React, { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  Search,
  Build,
  Person,
  LocationOn,
  Schedule,
  AttachFile,
  Phone,
  Email
} from '@mui/icons-material'
import { useTrackMaintenanceTicket } from '../../hooks/useMaintenance'
import MaintenanceStatusBadge from '../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../Components/Maintenance/MaintenancePriorityBadge'
import MaintenanceTimeline from '../../Components/Maintenance/MaintenanceTimeline'
import MaintenanceErrorBoundary from '../../Components/Maintenance/MaintenanceErrorBoundary'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * MaintenanceTracking component provides a public interface for tracking maintenance tickets
 * Customers can enter their ticket number to see the current status and history
 */
const MaintenanceTracking: React.FC = () => {
  const [ticketNumber, setTicketNumber] = useState('')
  const [searchedTicketNumber, setSearchedTicketNumber] = useState('')

  const {
    data: trackingData,
    isLoading,
    error,
    refetch
  } = useTrackMaintenanceTicket(searchedTicketNumber)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticketNumber.trim()) {
      setSearchedTicketNumber(ticketNumber.trim())
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return (
      name
        .split(' ')
        .map((n) => n?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
    )
  }

  return (
    <MaintenanceErrorBoundary>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Box textAlign='center' mb={4}>
            <Search color='primary' sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant='h4' gutterBottom>
              Seguimiento de Mantenimiento
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Ingrese su número de ticket para ver el estado actual de su
              solicitud
            </Typography>
          </Box>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <Box
              display='flex'
              gap={2}
              alignItems='center'
              justifyContent='center'
            >
              <TextField
                label='Número de Ticket'
                placeholder='Ej: MTN-2024-001'
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                sx={{ minWidth: 300 }}
                disabled={isLoading}
              />
              <Button
                type='submit'
                variant='contained'
                size='large'
                disabled={!ticketNumber.trim() || isLoading}
                startIcon={<Search />}
              >
                Buscar
              </Button>
            </Box>
          </form>

          {/* Loading */}
          {isLoading && (
            <Box mt={3}>
              <LinearProgress />
              <Typography variant='body2' textAlign='center' mt={1}>
                Buscando ticket...
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity='error' sx={{ mt: 3 }}>
              Error al buscar el ticket. Verifique el número e intente
              nuevamente.
            </Alert>
          )}

          {/* No results */}
          {trackingData && !trackingData.found && (
            <Alert severity='warning' sx={{ mt: 3 }}>
              No se encontró un ticket con el número "{searchedTicketNumber}".
              Verifique que el número sea correcto.
            </Alert>
          )}
        </Paper>

        {/* Ticket Details */}
        {trackingData?.found && trackingData.ticket && (
          <Grid container spacing={3}>
            {/* Main Ticket Info */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                  mb={3}
                >
                  <Typography variant='h5' component='h2'>
                    Ticket #{trackingData.ticket.ticketNumber}
                  </Typography>
                  <Box display='flex' gap={1}>
                    <MaintenanceStatusBadge
                      status={trackingData.ticket.status}
                    />
                    <MaintenancePriorityBadge
                      priority={trackingData.ticket.priority}
                    />
                  </Box>
                </Box>

                {/* Customer Info */}
                <Card variant='outlined' sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información del Cliente
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display='flex' alignItems='center' gap={1} mb={1}>
                          <Person fontSize='small' color='action' />
                          <Typography variant='body2'>
                            <strong>Nombre:</strong>{' '}
                            {trackingData.ticket.customerName}
                          </Typography>
                        </Box>
                        <Box display='flex' alignItems='center' gap={1} mb={1}>
                          <Email fontSize='small' color='action' />
                          <Typography variant='body2'>
                            <strong>Email:</strong>{' '}
                            {trackingData.ticket.customerEmail}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display='flex' alignItems='center' gap={1} mb={1}>
                          <Phone fontSize='small' color='action' />
                          <Typography variant='body2'>
                            <strong>Teléfono:</strong>{' '}
                            {trackingData.ticket.customerPhone}
                          </Typography>
                        </Box>
                        <Box display='flex' alignItems='center' gap={1}>
                          <LocationOn fontSize='small' color='action' />
                          <Typography variant='body2'>
                            <strong>Ubicación:</strong>{' '}
                            {trackingData.ticket.location}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Equipment Info */}
                <Card variant='outlined' sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información del Equipo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          <strong>Tipo:</strong>{' '}
                          {trackingData.ticket.equipmentType}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          <strong>Marca:</strong>{' '}
                          {trackingData.ticket.equipmentBrand}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='body2' color='text.secondary'>
                          <strong>Modelo:</strong>{' '}
                          {trackingData.ticket.equipmentModel}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          <strong>Serie:</strong>{' '}
                          {trackingData.ticket.equipmentSerial}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Issue Description */}
                <Card variant='outlined' sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Descripción del Problema
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {trackingData.ticket.issueDescription}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Assigned Technician */}
                {trackingData.ticket.assignedTechnician &&
                  trackingData.ticket.assignedTechnician.name && (
                    <Card variant='outlined' sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Técnico Asignado
                        </Typography>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(
                              trackingData.ticket.assignedTechnician.name
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant='body1' fontWeight='medium'>
                              {trackingData.ticket.assignedTechnician.name}
                            </Typography>
                            {trackingData.ticket.assignedTechnician.email && (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {trackingData.ticket.assignedTechnician.email}
                              </Typography>
                            )}
                            {trackingData.ticket.assignedTechnician
                              .specialization && (
                              <Box mt={1}>
                                <Chip
                                  key={
                                    trackingData.ticket.assignedTechnician
                                      .specialization
                                  }
                                  label={
                                    trackingData.ticket.assignedTechnician
                                      .specialization
                                  }
                                  size='small'
                                  variant='outlined'
                                  color='primary'
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                {/* Files */}
                {trackingData.ticket.files &&
                  trackingData.ticket.files.length > 0 && (
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='h6' gutterBottom>
                          Archivos Adjuntos
                        </Typography>
                        <Grid container spacing={1}>
                          {trackingData.ticket.files.map((file) => (
                            <Grid item key={file.id}>
                              <Chip
                                icon={<AttachFile />}
                                label={file.originalName}
                                variant='outlined'
                                color='primary'
                                size='small'
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              {/* Dates */}
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Fechas Importantes
                </Typography>

                <Box mb={2}>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Creado:</strong>
                  </Typography>
                  <Typography variant='body2'>
                    {formatDate(trackingData.ticket.createdAt)}
                  </Typography>
                </Box>

                {trackingData.ticket.scheduledDate && (
                  <Box mb={2}>
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Fecha Programada:</strong>
                    </Typography>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <Schedule fontSize='small' color='action' />
                      <Typography variant='body2'>
                        {formatDate(trackingData.ticket.scheduledDate)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {trackingData.ticket.completedDate && (
                  <Box mb={2}>
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Completado:</strong>
                    </Typography>
                    <Typography variant='body2'>
                      {formatDate(trackingData.ticket.completedDate)}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Última Actualización:</strong>
                  </Typography>
                  <Typography variant='body2'>
                    {formatDate(trackingData.ticket.updatedAt)}
                  </Typography>
                </Box>
              </Paper>

              {/* Customer Satisfaction */}
              {trackingData.ticket.customerSatisfaction && (
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant='h6' gutterBottom>
                    Calificación del Servicio
                  </Typography>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography variant='h4' color='primary'>
                      {trackingData.ticket.customerSatisfaction}/5
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      estrellas
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>

            {/* Timeline */}
            <Grid item xs={12}>
              <MaintenanceTimeline
                timeline={trackingData.ticket.timeline || []}
              />
            </Grid>
          </Grid>
        )}

        {/* Help */}
        <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant='h6' gutterBottom>
            ¿Necesita Ayuda?
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Si tiene preguntas sobre su solicitud de mantenimiento o necesita
            asistencia adicional, puede contactarnos a través de:
          </Typography>
          <Box mt={2}>
            <Typography variant='body2'>
              <strong>Email:</strong> mantenimiento@metromedicslab.com.co
            </Typography>
            <Typography variant='body2'>
              <strong>Teléfono:</strong> (601) 123-4567
            </Typography>
            <Typography variant='body2'>
              <strong>Horario:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM
            </Typography>
          </Box>
        </Paper>
      </Container>
    </MaintenanceErrorBoundary>
  )
}

export default MaintenanceTracking
