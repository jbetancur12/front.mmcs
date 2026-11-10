import { MaintenanceStatus } from '../../../types/maintenance'

/**
 * Reglas de la barra de siguiente paso del ticket: dado el estado del ticket y lo que puede
 * hacer la persona, dice qué etapas van hechas y cuál es el único botón principal.
 */

export type NextStepAction =
  | 'assign'
  | 'schedule'
  | 'start'
  | 'complete'
  | 'resume'
  | 'report'
  | 'sign'
  | 'invoice'

export interface NextStepInput {
  status: MaintenanceStatus
  hasTechnician: boolean
  scheduledDate?: string | null
  /** Puede asignar y programar (capacidad de listar técnicos y alcance total). */
  canAssign: boolean
  /** Puede operar este ticket (no es técnico, o es el técnico asignado). */
  canOperate: boolean
  canInvoice: boolean
  signaturesEnabled: boolean
  hasCustomerSignature: boolean
  reportSaved: boolean
  reportPercent: number
  isInvoiced: boolean
}

export interface NextStepStage {
  label: string
  done: boolean
}

export interface NextStepResult {
  stages: NextStepStage[]
  /** Índice de la etapa en curso; igual al total cuando todo está hecho. */
  currentIndex: number
  title: string
  description: string
  primary?: { action: NextStepAction; label: string }
  secondary?: { action: NextStepAction; label: string }
  /** Se puede pausar el servicio (solo En progreso). */
  canPause: boolean
  /** Por qué no hay botón principal para esta persona. */
  blockedReason?: string
}

const WORKING = [
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.ON_HOLD,
  MaintenanceStatus.WAITING_PARTS,
  MaintenanceStatus.WAITING_CUSTOMER
]

export const getNextStep = (input: NextStepInput): NextStepResult | null => {
  const { status } = input
  if (status === MaintenanceStatus.CANCELLED) return null

  const completed = status === MaintenanceStatus.COMPLETED
  const started = completed || WORKING.includes(status)

  const stages: NextStepStage[] = [
    // Si el servicio ya empezó, asignar y programar quedan atrás aunque no hayan quedado registrados
    { label: 'Asignar', done: input.hasTechnician || started },
    { label: 'Programar', done: Boolean(input.scheduledDate) || started },
    { label: 'En servicio', done: started },
    { label: 'Cerrar', done: completed },
    { label: 'Reporte', done: completed && input.reportSaved }
  ]
  if (input.signaturesEnabled) {
    stages.push({
      label: 'Firma',
      done: completed && input.hasCustomerSignature
    })
  }
  stages.push({ label: 'Facturar', done: input.isInvoiced })

  const firstPending = stages.findIndex((stage) => !stage.done)
  const currentIndex = firstPending === -1 ? stages.length : firstPending

  const base = { stages, currentIndex, canPause: false }
  const blocked = (
    title: string,
    description: string,
    reason: string
  ): NextStepResult => ({
    ...base,
    title,
    description,
    blockedReason: reason
  })

  if (status === MaintenanceStatus.PENDING) {
    if (input.canAssign) {
      return {
        ...base,
        title: 'Asignar técnico',
        description: 'El ticket aún no tiene técnico.',
        primary: { action: 'assign', label: 'Asignar técnico' }
      }
    }
    return blocked(
      'Asignar técnico',
      'El ticket aún no tiene técnico.',
      'Coordinación debe asignar un técnico.'
    )
  }

  if (status === MaintenanceStatus.ASSIGNED) {
    const needsDate = !input.scheduledDate && input.canAssign
    if (needsDate) {
      return {
        ...base,
        title: 'Programar visita',
        description: 'Falta la fecha programada.',
        primary: { action: 'schedule', label: 'Programar visita' },
        secondary: input.canOperate
          ? { action: 'start', label: 'Iniciar sin programar' }
          : undefined
      }
    }
    if (input.canOperate) {
      return {
        ...base,
        title: 'Iniciar servicio',
        description: 'Cuando llegues al equipo, inicia el servicio.',
        primary: { action: 'start', label: 'Iniciar servicio' }
      }
    }
    return blocked(
      'Iniciar servicio',
      'Está asignado y espera que el técnico lo inicie.',
      'Solo el técnico asignado o coordinación pueden iniciarlo.'
    )
  }

  if (status === MaintenanceStatus.IN_PROGRESS) {
    if (input.canOperate) {
      return {
        ...base,
        canPause: true,
        title: 'Completar servicio',
        description:
          'Registra el trabajo realizado, el tiempo, los costos y la firma del técnico.',
        primary: { action: 'complete', label: 'Completar servicio' }
      }
    }
    return blocked(
      'Servicio en curso',
      'El técnico está atendiendo el equipo.',
      'Solo el técnico asignado o coordinación pueden completarlo.'
    )
  }

  if (WORKING.includes(status)) {
    if (input.canOperate) {
      return {
        ...base,
        title: 'Reanudar servicio',
        description:
          'El servicio está pausado. Reanúdalo cuando se pueda seguir.',
        primary: { action: 'resume', label: 'Reanudar servicio' }
      }
    }
    return blocked(
      'Servicio pausado',
      'El servicio está pausado.',
      'Solo el técnico asignado o coordinación pueden reanudarlo.'
    )
  }

  // Completado
  if (!input.reportSaved) {
    return input.canOperate
      ? {
          ...base,
          title: 'Diligenciar reporte técnico',
          description: 'Aún no se ha guardado el reporte técnico.',
          primary: { action: 'report', label: 'Diligenciar reporte' }
        }
      : blocked(
          'Diligenciar reporte técnico',
          'Aún no se ha guardado el reporte técnico.',
          'Solo el técnico asignado o coordinación pueden diligenciarlo.'
        )
  }

  if (input.signaturesEnabled && !input.hasCustomerSignature) {
    return input.canOperate
      ? {
          ...base,
          title: 'Registrar firma del cliente',
          description: `El reporte está al ${input.reportPercent} %. Falta la conformidad del cliente.`,
          primary: { action: 'sign', label: 'Registrar firma' }
        }
      : blocked(
          'Registrar firma del cliente',
          'Falta la conformidad del cliente.',
          'Solo el técnico asignado o coordinación pueden registrarla.'
        )
  }

  if (!input.isInvoiced) {
    return input.canInvoice
      ? {
          ...base,
          title: 'Marcar como facturado',
          description: 'El servicio está listo para facturar.',
          primary: { action: 'invoice', label: 'Marcar facturado' }
        }
      : blocked(
          'Pendiente de facturar',
          'El servicio está listo para facturar.',
          'Facturación debe marcarlo como facturado.'
        )
  }

  return {
    ...base,
    title: 'Ticket al día',
    description: 'El servicio está cerrado, firmado y facturado.'
  }
}
