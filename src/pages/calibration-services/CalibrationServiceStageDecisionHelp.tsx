import {
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Typography
} from '@mui/material'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { MouseEvent, useMemo, useState } from 'react'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceCustomerResponseType,
  CalibrationServiceStatus
} from '../../types/calibrationService'

interface DecisionItem {
  title: string
  detail: string
  roles: string[]
  tone?: 'success' | 'warning' | 'error' | 'info' | 'default'
}

interface CalibrationServiceStageDecisionHelpProps {
  status: CalibrationServiceStatus
  approvalStatus: CalibrationServiceApprovalStatus
  customerResponseType?: CalibrationServiceCustomerResponseType | null
  hasCommercialAdjustments?: boolean
  hasCuts?: boolean
  allCutsSent?: boolean
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  super_admin: 'Super admin',
  comp_admin: 'Comp. admin',
  comp_requester: 'Comp. requester',
  comp_supervisor: 'Comp. supervisor',
  metrologist: 'Metrologo',
  invoicing: 'Facturacion'
}

const renderRoleList = (roles: string[]) =>
  roles.map((role) => roleLabels[role] || role).join(', ')

const getDecisionIcon = (title: string) => {
  if (title.toLowerCase().includes('aprueba')) {
    return <CheckCircleOutlineOutlinedIcon color='success' fontSize='small' />
  }

  if (title.toLowerCase().includes('rechaza')) {
    return <HighlightOffOutlinedIcon color='error' fontSize='small' />
  }

  if (
    title.toLowerCase().includes('modificación') ||
    title.toLowerCase().includes('novedad')
  ) {
    return <AutorenewOutlinedIcon color='warning' fontSize='small' />
  }

  if (title.toLowerCase().includes('corte')) {
    return <BuildCircleOutlinedIcon color='info' fontSize='small' />
  }

  if (title.toLowerCase().includes('factur')) {
    return <ReceiptLongOutlinedIcon color='primary' fontSize='small' />
  }

  if (title.toLowerCase().includes('documental')) {
    return <FactCheckOutlinedIcon color='primary' fontSize='small' />
  }

  return <LockOutlinedIcon color='action' fontSize='small' />
}

const buildDecisionItems = ({
  status,
  approvalStatus,
  customerResponseType,
  hasCommercialAdjustments,
  hasCuts,
  allCutsSent
}: CalibrationServiceStageDecisionHelpProps): DecisionItem[] => {
  if (status === 'draft') {
    return [
      {
        title: 'Enviar cotización',
        detail:
          'Cuando el borrador ya esté listo, se envía al cliente y el flujo pasa a respuesta comercial.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'info'
      }
    ]
  }

  if (status === 'pending_approval' || approvalStatus === 'pending') {
    return [
      {
        title: 'Cliente aprueba',
        detail: 'La cotización queda aprobada y habilita emisión de ODS.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'success'
      },
      {
        title: 'Cliente rechaza',
        detail: 'El servicio queda rechazado y no continúa a ODS.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'error'
      },
      {
        title: 'Cliente solicita modificación',
        detail:
          'La cotización vuelve a borrador para ajustes, reenviando la propuesta sin perder historial.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'warning'
      }
    ]
  }

  if (status === 'rejected' || customerResponseType === 'rejected') {
    return [
      {
        title: 'Estado final comercial',
        detail:
          'El caso quedó rechazado por el cliente. Solo mantiene trazabilidad y consulta histórica.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'default'
      }
    ]
  }

  if (status === 'approved') {
    return [
      {
        title: 'Emitir ODS',
        detail: 'Convierte la aprobación del cliente en orden operativa del servicio.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'],
        tone: 'info'
      }
    ]
  }

  if (status === 'ods_issued' || status === 'pending_programming') {
    return [
      {
        title: 'Programar servicio',
        detail:
          'Define fecha compromiso, fecha programada y responsable operativo para pasar a ejecución.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor'],
        tone: 'info'
      }
    ]
  }

  if (status === 'scheduled') {
    return [
      {
        title: 'Iniciar ejecución',
        detail: 'Da inicio al trabajo técnico y habilita avance por ítem.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'metrologist'],
        tone: 'success'
      }
    ]
  }

  if (status === 'in_execution') {
    return [
      {
        title: 'Seguir ejecución normal',
        detail: 'Actualizar avance por ítem y completar técnicamente el servicio.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'metrologist'],
        tone: 'success'
      },
      {
        title: 'Registrar novedad',
        detail:
          'Si cambió cantidad, apareció un ítem adicional o hubo diferencia con lo cotizado, se reporta aquí.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'metrologist'],
        tone: 'warning'
      }
    ]
  }

  if (status === 'technically_completed') {
    const items: DecisionItem[] = [
      {
        title: hasCuts ? 'Gestionar cortes existentes' : 'Crear corte',
        detail: hasCuts
          ? 'Con el cierre técnico ya hecho, define si el corte pasa a listo para facturar o si necesitas otro corte.'
          : 'Si todo salió junto, crea un corte final. Si solo salió una parte, crea un corte parcial.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'metrologist'],
        tone: 'info'
      },
      {
        title: 'Registrar novedades posteriores',
        detail:
          'Aún puedes registrar y revisar novedades antes de facturar, especialmente si afectan cantidades o precio.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'metrologist'],
        tone: 'warning'
      }
    ]

    if (hasCommercialAdjustments) {
      items.push({
        title: 'Resolver novedades económicas',
        detail:
          'Antes de dejar cortes listos para facturar, las novedades con impacto económico deben quedar revisadas.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor', 'invoicing'],
        tone: 'warning'
      })
    }

    if (allCutsSent) {
      items.push({
        title: 'Cerrar servicio',
        detail: 'Si todos los cortes ya fueron enviados, el servicio queda listo para cierre final.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'invoicing'],
        tone: 'success'
      })
    }

    return items
  }

  if (status === 'closed') {
    return [
      {
        title: 'Flujo completado',
        detail:
          'El servicio ya cerró su flujo técnico, administrativo y documental. Solo queda disponible la consulta histórica.',
        roles: ['admin', 'super_admin', 'comp_admin', 'comp_supervisor', 'invoicing'],
        tone: 'default'
      }
    ]
  }

  return [
    {
      title: 'Consultar flujo',
      detail: 'Revisa la pestaña Guía para ver el mapa completo del proceso y sus desvíos.',
      roles: ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor', 'metrologist', 'invoicing'],
      tone: 'info'
    }
  ]
}

const CalibrationServiceStageDecisionHelp = (
  props: CalibrationServiceStageDecisionHelpProps
) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const decisionItems = useMemo(() => buildDecisionItems(props), [props])

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size='small'
        color='primary'
        onClick={handleOpen}
        title='Ver decisiones y desvíos posibles de esta etapa'
      >
        <HelpOutlineOutlinedIcon fontSize='small' />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 430, maxWidth: 'calc(100vw - 32px)', p: 2 } }}
      >
        <Typography variant='subtitle1' fontWeight={700} gutterBottom>
          Decisiones posibles en esta etapa
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          Antes de seguir a la siguiente fase, aquí ves qué caminos puede tomar el
          servicio y quién está habilitado para ejecutarlos.
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <List dense disablePadding>
          {decisionItems.map((item, index) => (
            <ListItem
              key={`${item.title}-${index}`}
              disableGutters
              sx={{ alignItems: 'flex-start', py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 34, mt: 0.25 }}>
                {getDecisionIcon(item.title)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.5 }}>
                    <Typography fontWeight={700} variant='body2'>
                      {item.title}
                    </Typography>
                    {item.tone && item.tone !== 'default' ? (
                      <Chip
                        size='small'
                        color={item.tone}
                        variant='outlined'
                        label={
                          item.tone === 'success'
                            ? 'Ruta principal'
                            : item.tone === 'warning'
                              ? 'Desvío posible'
                              : item.tone === 'error'
                                ? 'Cierre alterno'
                                : 'Acción'
                        }
                      />
                    ) : null}
                  </Stack>
                }
                secondary={
                  <Box>
                    <Typography variant='body2' color='text.secondary'>
                      {item.detail}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Roles: {renderRoleList(item.roles)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  )
}

export default CalibrationServiceStageDecisionHelp
