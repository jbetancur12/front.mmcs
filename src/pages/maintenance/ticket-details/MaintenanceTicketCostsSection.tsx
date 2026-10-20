import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Alert,
  Stack
} from '@mui/material'
import {
  Description,
  Schedule,
  PictureAsPdf,
  AttachMoney,
  CheckCircle
} from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import {
  formatCurrency,
  formatWorkMinutes,
  surfaceSx
} from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketCostsSectionProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Costos del servicio, tiempo de trabajo y cierre del ticket completado. */
const MaintenanceTicketCostsSection = ({ ticket, details }: MaintenanceTicketCostsSectionProps) => {
  const {
    isCustomerApprovalLocked,
    generateTechnicalReportMutation,
    statusChip,
    technicalReportCompletion,
    handleGenerateTechnicalReport,
    setBriefCostsDialogOpen,
    setTechnicalReportDialogOpen,
    technicalReport,
    showToast
  } = details

  return (
    <>
      {/* Costs */}
      {/* <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(109, 198, 98, 0.12)'
          }
        }}
      >
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #00bf75 0%, #008f4f 100%)',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AttachMoney sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography 
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#00bf75'
            }}
          >
            Costos
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Costo Estimado
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  id='detail-estimated-cost'
                  label='Costo estimado'
                  type='number'
                  value={editData.estimatedCost || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      estimatedCost: e.target.value
                        ? Number(e.target.value)
                        : undefined
                    }))
                  }
                  size='small'
                  InputProps={{
                    startAdornment: '$'
                  }}
                  helperText={
                    editErrors.estimatedCost ||
                    'Costo estimado del servicio'
                  }
                  error={!!editErrors.estimatedCost}
                  aria-label='Ingresar costo estimado del servicio'
                  aria-invalid={!!editErrors.estimatedCost}
                  aria-describedby={editErrors.estimatedCost ? 'estimated-cost-error' : 'estimated-cost-helper'}
                />
              ) : (
                <Typography variant='h6' color='warning.main'>
                  {formatCurrency(ticket.estimatedCost)}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Costo Real
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  id='detail-actual-cost'
                  label='Costo real'
                  type='number'
                  value={editData.actualCost || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      actualCost: e.target.value
                        ? Number(e.target.value)
                        : undefined
                    }))
                  }
                  size='small'
                  InputProps={{
                    startAdornment: '$'
                  }}
                  helperText={
                    editErrors.actualCost || 'Costo final del servicio'
                  }
                  error={!!editErrors.actualCost}
                  aria-label='Ingresar costo real del servicio'
                  aria-invalid={!!editErrors.actualCost}
                  aria-describedby={editErrors.actualCost ? 'actual-cost-error' : 'actual-cost-helper'}
                />
              ) : (
                <Typography variant='h6' color='success.main'>
                  {formatCurrency(ticket.actualCost)}
                </Typography>
              )}
            </Box>
          </Grid>

          {ticket.estimatedCost && ticket.actualCost && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  gutterBottom
                >
                  Variación
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight='medium'
                  color={
                    ticket.actualCost <= ticket.estimatedCost
                      ? 'success.main'
                      : 'error.main'
                  }
                >
                  {ticket.actualCost <= ticket.estimatedCost ? '-' : '+'}
                  {formatCurrency(
                    Math.abs(ticket.actualCost - ticket.estimatedCost)
                  )}{' '}
                  (
                  {(
                    ((ticket.actualCost - ticket.estimatedCost) /
                      ticket.estimatedCost) *
                    100
                  ).toFixed(1)}
                  %)
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper> */}

      {/* Service Costs */}
      {ticket.costs && ticket.costs.length > 0 && (
        <Paper
          sx={{
            ...surfaceSx,
            p: 3,
            mb: 3,
            '&:hover': {
              borderColor: '#cbd5e1',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
            },
            cursor: 'pointer'
          }}
          onClick={() => setBriefCostsDialogOpen(true)}
        >
          {/* Contenedor Principal: Asegura la separación y alineación vertical central */}
          <Box
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            gap={3}
          >
            {/* 1. Avatar (Ícono) */}
            <Avatar
              sx={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                width: 48,
                height: 48,
                flexShrink: 0
              }}
            >
              <AttachMoney fontSize='medium' />
            </Avatar>

            <Box flexGrow={1} minWidth={0}>
              <Box display='flex' alignItems='center' mb={0.5}>
                <Typography
                  variant='body1'
                  sx={{
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1
                  }}
                >
                  Costos del Servicio
                </Typography>
                <Box ml={1.5} sx={{ pt: '2px' }}>
                  {statusChip}
                </Box>
              </Box>

              <Typography
                variant='caption'
                color='text.secondary'
                lineHeight={1}
              >
                {ticket.costs.length} costo(s) registrado(s)
              </Typography>
            </Box>

            {/* 3. Chip del Monto Total (Monto de mayor jerarquía visual) */}
            <Chip
              icon={<CheckCircle sx={{ fontSize: '1.2rem' }} />}
              label={formatCurrency(
                ticket.costs.reduce(
                  (sum, cost) => sum + parseFloat(cost.amount.toString()),
                  0
                )
              )}
              sx={{
                backgroundColor: '#ecfdf5',
                color: '#166534',
                fontWeight: 700,
                fontSize: '0.9rem',
                height: 40,
                borderRadius: '20px',
                padding: '0 8px',
                flexShrink: 0
              }}
            />
          </Box>
        </Paper>
      )}

      {ticket.costs && ticket.costs.length === 0 && ticket.technicianWorkMinutes && ticket.status === MaintenanceStatus.COMPLETED && (
        <Paper
          sx={{
            ...surfaceSx,
            p: 3,
            mb: 3,
            '&:hover': {
              borderColor: '#cbd5e1',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
            },
            cursor: 'pointer'
          }}
          onClick={() => setBriefCostsDialogOpen(true)}
        >
          <Box display='flex' alignItems='center' justifyContent='space-between' gap={3}>
            <Avatar
              sx={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                width: 48,
                height: 48,
                flexShrink: 0
              }}
            >
              <Schedule fontSize='medium' />
            </Avatar>
            <Box flexGrow={1} minWidth={0}>
              <Typography variant='body1' sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                Sin costos de materiales
              </Typography>
              <Typography variant='caption' color='text.secondary' lineHeight={1} sx={{ mt: 0.5, display: 'block' }}>
                Tiempo técnico registrado: {formatWorkMinutes(ticket.technicianWorkMinutes)}
              </Typography>
            </Box>
            <Chip
              label='Solo tiempo técnico'
              size='small'
              sx={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 600,
                fontSize: '0.75rem',
                flexShrink: 0
              }}
            />
          </Box>
        </Paper>
      )}

      {ticket.status === MaintenanceStatus.COMPLETED && (
        <Paper
          sx={{
            ...surfaceSx,
            p: 3,
            mb: 3,
            borderColor: '#bfdbfe'
          }}
        >
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <Box>
              <Typography
                variant='h6'
                sx={{ fontWeight: 600, color: '#0f172a' }}
              >
                Reporte técnico de mantenimiento
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mt: 0.5 }}
              >
                Documento técnico completo para formalizar el cierre del
                servicio con diagnóstico, validación y recomendaciones.
              </Typography>
              <Stack
                direction='row'
                spacing={1}
                sx={{ mt: 1.5 }}
                flexWrap='wrap'
              >
                <Chip
                  size='small'
                  color='primary'
                  variant='outlined'
                  label={`${technicalReportCompletion}% completo`}
                />
                {technicalReport?.serviceFinalStatus && (
                  <Chip
                    size='small'
                    color='success'
                    label={technicalReport.serviceFinalStatus.replace(
                      /_/g,
                      ' '
                    )}
                  />
                )}
                {technicalReport?.verificationProtocolType && (
                  <Chip
                    size='small'
                    variant='outlined'
                    label={technicalReport.verificationProtocolType}
                  />
                )}
              </Stack>
              {isCustomerApprovalLocked && (
                <Alert severity='info' sx={{ mt: 1.5 }}>
                  El cliente ya firmó la conformidad del servicio. El
                  reporte técnico quedó bloqueado para proteger la
                  trazabilidad documental.
                </Alert>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant='outlined'
                startIcon={<Description />}
                onClick={() => {
                  if (isCustomerApprovalLocked) {
                    showToast(
                      'El reporte técnico ya no puede editarse después de la firma del cliente',
                      'warning'
                    )
                    return
                  }
                  setTechnicalReportDialogOpen(true)
                }}
                disabled={isCustomerApprovalLocked}
              >
                {technicalReport?.updatedAt
                  ? 'Editar reporte'
                  : 'Diligenciar reporte'}
              </Button>
              <Button
                variant='contained'
                startIcon={<PictureAsPdf />}
                onClick={handleGenerateTechnicalReport}
                disabled={generateTechnicalReportMutation.isLoading}
              >
                PDF técnico
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  )
}

export default MaintenanceTicketCostsSection
