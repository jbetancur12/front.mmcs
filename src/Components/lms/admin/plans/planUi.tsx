import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getRoleLabelEs } from 'src/constants/roles'
import type { DeadlineSource, PlanTarget } from 'src/services/lmsService'

export const PLAN_TEAL = '#00BFA5'
export const PLAN_TEAL_HOVER = '#00897B'
export const PLAN_TEAL_SOFT = '#E0F7F4'

/** Roles que se pueden elegir como destino de un plan (internos). */
export const PLAN_ROLE_OPTIONS = [
  'metrologist',
  'calibration_coordinator',
  'technical_director',
  'technician',
  'maintenance_coordinator',
  'mantenimiento',
  'comp_admin',
  'comp_requester',
  'invoicing',
  'analista_datos',
  'employee',
  'Training Manager',
  'admin'
]

export const SKIP_REASON_LABELS: Record<string, string> = {
  CLIENT_AUDIENCE: 'Curso solo para clientes',
  COURSE_NOT_FOUND: 'El curso ya no existe'
}

export const COURSE_STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado'
}

export const formatPlanDate = (value?: string | Date | null) => {
  if (!value) return 'Sin fecha límite'
  return format(new Date(value), "d 'de' MMM yyyy", { locale: es })
}

export const describeTarget = (target?: Pick<PlanTarget, 'type' | 'role' | 'user_ids'> | null) => {
  if (!target) return ''
  if (target.type === 'all') return 'Todos los empleados'
  if (target.type === 'role') return `Rol: ${getRoleLabelEs(target.role)}`
  const count = target.user_ids?.length ?? 0
  return `${count} usuario${count === 1 ? '' : 's'}`
}

/** Traduce el rol en los textos de destino que arma el backend ("Rol: metrologist"). */
export const translateTargetText = (text: string) =>
  text.startsWith('Rol: ') ? `Rol: ${getRoleLabelEs(text.slice(5))}` : text

export const describeDeadlineSource = (source?: DeadlineSource | null) => {
  if (!source) return null
  if (source.type === 'plan') return source.plan_name ? `Plan ${source.plan_name}` : 'Plan de formación'
  if (source.type === 'override') return 'Fecha personalizada'
  return 'Asignación directa'
}

export const describePlanDeadline = (deadline?: string | null, days?: number | null) => {
  const parts: string[] = []
  if (days) parts.push(`${days} días desde la asignación`)
  if (deadline) parts.push(`fecha fija ${formatPlanDate(deadline)}`)
  return parts.length > 0 ? parts.join(' · ') : 'Sin fecha límite'
}

interface PlanDialogHeaderProps {
  title: string
  subtitle?: string
  icon: React.ReactElement
  onClose: () => void
}

/** Cabecera de diálogo con el degradado esmeralda de los formularios. */
export const PlanDialogHeader: React.FC<PlanDialogHeaderProps> = ({ title, subtitle, icon, onClose }) => (
  <Box
    sx={{
      position: 'relative',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      px: 3,
      py: 2.5,
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 24 } })}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant='h6' fontWeight={700} noWrap>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant='body2' sx={{ opacity: 0.9 }} noWrap>
          {subtitle}
        </Typography>
      )}
    </Box>
    <IconButton onClick={onClose} aria-label='Cerrar' sx={{ color: 'white' }}>
      <CloseIcon />
    </IconButton>
  </Box>
)

export const primaryButtonSx = {
  bgcolor: PLAN_TEAL,
  '&:hover': { bgcolor: PLAN_TEAL_HOVER }
}

export const planDialogPaperProps = {
  sx: { borderRadius: '20px', overflow: 'hidden' }
}
