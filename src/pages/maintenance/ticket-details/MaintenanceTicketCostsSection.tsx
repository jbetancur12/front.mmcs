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
import { neutral, intent, withAlpha } from 'src/theme/designTokens'

interface MaintenanceTicketCostsSectionProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Costos del servicio, tiempo de trabajo y cierre del ticket completado. */
const MaintenanceTicketCostsSection = ({
  ticket,
  details
}: MaintenanceTicketCostsSectionProps) => {
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
      {/* Service Costs */}
      {ticket.costs && ticket.costs.length > 0 && (
        <Paper
          sx={{
            ...surfaceSx,
            p: 3,
            mb: 3,
            '&:hover': {
              borderColor: neutral.borderStrong,
              boxShadow: `0 1px 3px ${withAlpha(neutral.text, 0.08)}`
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
                backgroundColor: intent.successSoft,
                color: intent.successInk,
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
                    color: neutral.text,
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
                backgroundColor: intent.successSoft,
                color: intent.successInk,
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

      {ticket.costs &&
        ticket.costs.length === 0 &&
        ticket.technicianWorkMinutes &&
        ticket.status === MaintenanceStatus.COMPLETED && (
          <Paper
            sx={{
              ...surfaceSx,
              p: 3,
              mb: 3,
              '&:hover': {
                borderColor: neutral.borderStrong,
                boxShadow: `0 1px 3px ${withAlpha(neutral.text, 0.08)}`
              },
              cursor: 'pointer'
            }}
            onClick={() => setBriefCostsDialogOpen(true)}
          >
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              gap={3}
            >
              <Avatar
                sx={{
                  backgroundColor: intent.warningSoft,
                  color: intent.warningInk,
                  width: 48,
                  height: 48,
                  flexShrink: 0
                }}
              >
                <Schedule fontSize='medium' />
              </Avatar>
              <Box flexGrow={1} minWidth={0}>
                <Typography
                  variant='body1'
                  sx={{ fontWeight: 700, color: neutral.text, lineHeight: 1 }}
                >
                  Sin costos de materiales
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  lineHeight={1}
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  Tiempo técnico registrado:{' '}
                  {formatWorkMinutes(ticket.technicianWorkMinutes)}
                </Typography>
              </Box>
              <Chip
                label='Solo tiempo técnico'
                size='small'
                sx={{
                  backgroundColor: intent.warningSoft,
                  color: intent.warningInk,
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
            borderColor: intent.infoSoft
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
                sx={{ fontWeight: 600, color: neutral.text }}
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
                  El cliente ya firmó la conformidad del servicio. El reporte
                  técnico quedó bloqueado para proteger la trazabilidad
                  documental.
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
