import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import FormDialog from 'src/Components/Common/FormDialog'
import { confirmDialog } from 'src/utils/confirm'
import { getApiErrorReason } from 'src/utils/apiError'
import { logger } from 'src/utils/logger'
import { brand, neutral, withAlpha } from 'src/theme/designTokens'
import {
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceUpdateRequest
} from '../../../types/maintenance'
import { maintenanceSignaturesEnabled } from '../../../features/maintenanceFlags'
import { MAINTENANCE_STATUS_LABELS } from '../../../Components/Maintenance/maintenanceLabels'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'
import { getNextStep, NextStepAction } from './ticketNextStep'
import { MOBILE_TABS_HEIGHT } from './MaintenanceTicketMobileTabs'

interface MaintenanceTicketNextStepProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

const PAUSE_STATUSES = [
  MaintenanceStatus.ON_HOLD,
  MaintenanceStatus.WAITING_PARTS,
  MaintenanceStatus.WAITING_CUSTOMER
]

/** Convierte una fecha del servidor al valor de un `datetime-local` (hora local). */
const toLocalInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Barra de siguiente paso: etapas del ticket y un solo botón principal según el estado. */
const MaintenanceTicketNextStep = ({
  ticket,
  details
}: MaintenanceTicketNextStepProps) => {
  const {
    isMobile,
    isTechnician,
    editMode,
    canEditTicket,
    canManageTechnicians,
    canInvoice,
    isCustomerApprovalLocked,
    hasCustomerSignature,
    technicians,
    technicalReport,
    technicalReportCompletion,
    updateTicketMutation,
    refetchTicket,
    refetchTimeline,
    showToast,
    handleInvoice,
    setCostsDialogOpen,
    setSignaturesDialogOpen,
    setTechnicalReportDialogOpen
  } = details

  const [assignOpen, setAssignOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [intakeCondition, setIntakeCondition] = useState('')
  const [intakeAccessories, setIntakeAccessories] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [pauseAnchor, setPauseAnchor] = useState<HTMLElement | null>(null)

  const next = useMemo(
    () =>
      getNextStep({
        status: ticket.status,
        hasTechnician: Boolean(
          ticket.assignedTechnicianId || ticket.assignedTechnician
        ),
        scheduledDate: ticket.scheduledDate,
        canAssign: !isTechnician && canManageTechnicians,
        canOperate: canEditTicket,
        canInvoice,
        signaturesEnabled: maintenanceSignaturesEnabled,
        hasCustomerSignature,
        reportSaved: Boolean(technicalReport?.updatedAt),
        reportPercent: technicalReportCompletion,
        isInvoiced: Boolean(ticket.isInvoiced)
      }),
    [
      ticket,
      isTechnician,
      canManageTechnicians,
      canEditTicket,
      canInvoice,
      hasCustomerSignature,
      technicalReport?.updatedAt,
      technicalReportCompletion
    ]
  )

  if (!next || editMode) return null

  const update = async (data: MaintenanceUpdateRequest, success: string) => {
    try {
      await updateTicketMutation.mutateAsync({ id: ticket.id, data })
      await refetchTicket()
      await refetchTimeline()
      showToast(success, 'success')
      return true
    } catch (error: unknown) {
      logger.error('Error en el siguiente paso del ticket:', error)
      showToast(
        getApiErrorReason(error) || 'No se pudo actualizar el ticket',
        'error'
      )
      return false
    }
  }

  const openReport = () => {
    if (isCustomerApprovalLocked) {
      showToast(
        'El reporte técnico ya no puede editarse después de la firma del cliente',
        'warning'
      )
      return
    }
    setTechnicalReportDialogOpen(true)
  }

  const runAction = async (action: NextStepAction) => {
    switch (action) {
      case 'assign':
        setTechnicianId(ticket.assignedTechnicianId || '')
        setAssignOpen(true)
        return
      case 'schedule':
        setScheduledAt(toLocalInputValue(ticket.scheduledDate))
        setScheduleOpen(true)
        return
      case 'start':
        setIntakeCondition(ticket.intakePhysicalCondition ?? '')
        setIntakeAccessories(ticket.receivedAccessories ?? '')
        setStartOpen(true)
        return
      case 'resume':
        await update(
          { status: MaintenanceStatus.IN_PROGRESS },
          'Servicio reanudado'
        )
        return
      case 'complete':
        setCostsDialogOpen(true)
        return
      case 'report':
        openReport()
        return
      case 'sign':
        setSignaturesDialogOpen(true)
        return
      case 'invoice': {
        const { isConfirmed } = await confirmDialog({
          title: '¿Marcar como facturado?',
          text: `El ticket ${ticket.ticketCode} quedará registrado como facturado.`,
          confirmLabel: 'Marcar como facturado'
        })
        if (!isConfirmed) return
        try {
          await handleInvoice()
        } catch {
          // handleInvoice ya avisó el error
        }
        return
      }
    }
  }

  const submitAssign = async () => {
    if (!technicianId) return
    const ok = await update(
      {
        assignedTechnician: technicianId,
        status:
          ticket.status === MaintenanceStatus.PENDING
            ? MaintenanceStatus.ASSIGNED
            : ticket.status
      },
      'Técnico asignado'
    )
    if (ok) setAssignOpen(false)
  }

  const submitStart = async (withIntake: boolean) => {
    const ok = await update(
      {
        status: MaintenanceStatus.IN_PROGRESS,
        ...(withIntake
          ? {
              intakePhysicalCondition: intakeCondition.trim() || null,
              receivedAccessories: intakeAccessories.trim() || null
            }
          : {})
      },
      'Servicio iniciado'
    )
    if (ok) setStartOpen(false)
  }

  const submitSchedule = async () => {
    if (!scheduledAt) return
    const ok = await update(
      { scheduledDate: new Date(scheduledAt).toISOString() },
      'Visita programada'
    )
    if (ok) setScheduleOpen(false)
  }

  const pause = async (status: MaintenanceStatus) => {
    setPauseAnchor(null)
    await update(
      { status },
      `Servicio en estado "${MAINTENANCE_STATUS_LABELS[status]}"`
    )
  }

  const busy = updateTicketMutation.isLoading
  const primaryButton = next.primary && (
    <Button
      variant='contained'
      disabled={busy}
      onClick={() => runAction(next.primary!.action)}
      sx={{
        minHeight: { xs: 52, sm: 44 },
        width: { xs: '100%', sm: 'auto' },
        fontWeight: 700,
        fontSize: { xs: '1rem', sm: '0.875rem' },
        textTransform: 'none',
        bgcolor: brand.main,
        color: neutral.text,
        '&:hover': { bgcolor: brand.hover, color: brand.onMain }
      }}
    >
      {next.primary.label}
    </Button>
  )

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: { xs: 2, sm: 3 },
          borderRadius: '14px',
          border: `1px solid ${neutral.border}`,
          boxShadow: `0 1px 3px ${withAlpha(neutral.text, 0.08)}`,
          backgroundColor: neutral.surface
        }}
      >
        <Typography
          variant='caption'
          sx={{
            display: { xs: 'block', sm: 'none' },
            mb: 1,
            fontWeight: 700,
            color: neutral.textBody
          }}
        >
          {next.currentIndex >= next.stages.length
            ? 'Todos los pasos listos'
            : `Paso ${next.currentIndex + 1} de ${next.stages.length}: ${next.stages[next.currentIndex].label}`}
        </Typography>
        <Box
          component='ol'
          aria-label='Etapas del ticket'
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            mb: 2,
            display: 'flex',
            gap: 0.75,
            overflowX: { xs: 'visible', sm: 'auto' }
          }}
        >
          {next.stages.map((stage, index) => {
            const current = index === next.currentIndex
            return (
              <Box
                component='li'
                key={stage.label}
                aria-current={current ? 'step' : undefined}
                sx={{
                  flex: { xs: '1 1 0', sm: '1 0 auto' },
                  minWidth: { xs: 0, sm: 92 },
                  display: 'grid',
                  gap: 0.75,
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    stage.done || current ? neutral.text : neutral.textMuted
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor:
                      stage.done || current ? brand.main : neutral.border,
                    boxShadow: current ? `0 0 0 3px ${brand.soft}` : 'none'
                  }}
                />
                <Box
                  component='span'
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  {stage.label}
                </Box>
                <Box component='span' sx={visuallyHidden}>
                  {stage.done ? ' (hecho)' : current ? ' (en curso)' : ''}
                </Box>
              </Box>
            )
          })}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            p: 2,
            borderRadius: '12px',
            border: `1px solid ${brand.main}`,
            bgcolor: brand.soft
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant='overline'
              sx={{ color: brand.ink, fontWeight: 700, lineHeight: 1.4 }}
            >
              Siguiente paso
            </Typography>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              {next.title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {next.description}
            </Typography>
            {next.blockedReason && (
              <Typography
                variant='body2'
                sx={{ mt: 0.5, color: neutral.textBody, fontWeight: 600 }}
              >
                {next.blockedReason}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              gap: 1,
              flexWrap: 'wrap'
            }}
          >
            {primaryButton}
            {next.canPause && (
              <Button
                variant='outlined'
                disabled={busy}
                endIcon={<ExpandMore />}
                onClick={(e) => setPauseAnchor(e.currentTarget)}
                sx={{ minHeight: 44, textTransform: 'none' }}
              >
                Pausar
              </Button>
            )}
            {next.secondary && (
              <Button
                variant='text'
                disabled={busy}
                onClick={() => runAction(next.secondary!.action)}
                sx={{ minHeight: 44, textTransform: 'none' }}
              >
                {next.secondary.label}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Celular: el botón principal queda fijo abajo para alcanzarlo con el pulgar */}
      {isMobile && (next.primary || next.canPause) && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: `calc(${MOBILE_TABS_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
            zIndex: (theme) => theme.zIndex.appBar,
            display: 'flex',
            gap: 1,
            p: 1.5,
            bgcolor: neutral.surface,
            borderTop: `1px solid ${neutral.border}`
          }}
        >
          {primaryButton}
          {next.canPause && (
            <Button
              variant='outlined'
              disabled={busy}
              onClick={(e) => setPauseAnchor(e.currentTarget)}
              sx={{ minHeight: 52, textTransform: 'none', flexShrink: 0 }}
            >
              Pausar
            </Button>
          )}
        </Box>
      )}
      {isMobile && next.secondary && (
        <Button
          fullWidth
          variant='text'
          disabled={busy}
          onClick={() => runAction(next.secondary!.action)}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          {next.secondary.label}
        </Button>
      )}

      <Menu
        anchorEl={pauseAnchor}
        open={Boolean(pauseAnchor)}
        onClose={() => setPauseAnchor(null)}
      >
        {PAUSE_STATUSES.map((status) => (
          <MenuItem key={status} onClick={() => pause(status)}>
            {MAINTENANCE_STATUS_LABELS[status]}
          </MenuItem>
        ))}
      </Menu>

      <FormDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title='Asignar técnico'
        subtitle={`Ticket ${ticket.ticketCode}`}
        submitLabel='Asignar técnico'
        onSubmit={submitAssign}
        loading={busy}
        submitDisabled={!technicianId}
      >
        <TextField
          select
          fullWidth
          size='small'
          id='next-step-technician'
          label='Técnico'
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
        >
          {(technicians || [])
            .filter((tech) => tech.status === 'active')
            .map((tech) => (
              <MenuItem key={tech.id} value={String(tech.id)}>
                {tech.name}
                {typeof tech.workload === 'number' &&
                typeof tech.maxWorkload === 'number'
                  ? ` · carga ${tech.workload}/${tech.maxWorkload}`
                  : ''}
              </MenuItem>
            ))}
        </TextField>
      </FormDialog>

      <FormDialog
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title='Iniciar servicio'
        subtitle={`Ticket ${ticket.ticketCode}`}
        submitLabel='Iniciar servicio'
        onSubmit={() => submitStart(true)}
        loading={busy}
        extraActions={
          <Button
            color='inherit'
            disabled={busy}
            onClick={() => submitStart(false)}
            sx={{ textTransform: 'none' }}
          >
            Omitir
          </Button>
        }
      >
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Anota cómo recibes el equipo. Es opcional, pero queda en la orden de
          servicio.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          size='small'
          label='Condición inicial del equipo'
          placeholder='Rayones, golpes, faltantes o condición general'
          value={intakeCondition}
          onChange={(e) => setIntakeCondition(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          size='small'
          label='Accesorios disponibles'
          placeholder='Cables, sensores, adaptadores, batería u otros'
          value={intakeAccessories}
          onChange={(e) => setIntakeAccessories(e.target.value)}
        />
      </FormDialog>

      <FormDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title='Programar visita'
        subtitle={`Ticket ${ticket.ticketCode}`}
        submitLabel='Programar visita'
        onSubmit={submitSchedule}
        loading={busy}
        submitDisabled={!scheduledAt}
      >
        <TextField
          fullWidth
          size='small'
          id='next-step-scheduled-date'
          type='datetime-local'
          label='Fecha y hora'
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </FormDialog>
    </>
  )
}

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
} as const

export default MaintenanceTicketNextStep
