import { EMAIL_REGEX } from './calibrationServiceWorkspaceConstants'
import { WORKSPACE_SECTIONS } from './calibrationServiceWorkspaceSections'
import { FormState, Requirement } from './calibrationServiceWorkspaceTypes'
import { getItemTotals, toNumber } from './calibrationServiceWorkspaceUtils'

interface WorkspaceSummaryParams {
  formState: FormState
  hasRequestEvidence: boolean
}

/** Totales de la cotización y lo que falta para guardar el borrador o enviarla. */
export const getWorkspaceSummary = ({ formState, hasRequestEvidence }: WorkspaceSummaryParams) => {
  const subtotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).subtotal, 0)
  const taxTotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).taxTotal, 0)
  const discountTotal = formState.hasDiscount
    ? formState.discountType === 'percentage'
      ? subtotal * (toNumber(formState.discountValue) / 100)
      : toNumber(formState.discountValue)
    : 0
  const grandTotal = subtotal + taxTotal - discountTotal
  const validItemsCount = formState.items.filter((i) => i.itemName.trim()).length

  const filledItems = formState.items.filter((item) => item.itemName.trim() || item.instrumentName?.trim())
  const itemsNeedingPoints = filledItems.filter(
    (item) =>
      item.otherFields?.hasCalibrationPoints !== false &&
      (!item.otherFields?.calibrationPointCount || !item.otherFields?.measurementRange)
  )
  const contactEmail = formState.contactEmail?.trim() || ''
  const requirements: Requirement[] = [
    { key: 'customer', label: 'Elegir el cliente', section: 0, forDraft: true, pending: !formState.customerId },
    { key: 'site', label: 'Elegir la sede', section: 0, forDraft: true, pending: formState.scopeType === 'site' && !formState.customerSite?.trim() },
    { key: 'channel', label: 'Indicar la vía de solicitud', section: 0, forDraft: true, pending: !formState.requestChannel?.trim() },
    { key: 'evidence', label: 'Adjuntar la evidencia de solicitud', section: 0, forDraft: true, pending: !hasRequestEvidence },
    { key: 'email', label: 'Corregir el email de contacto', section: 1, forDraft: true, pending: Boolean(contactEmail) && !EMAIL_REGEX.test(contactEmail) },
    {
      key: 'items',
      label: filledItems.length ? 'Completar nombre y cantidad de los ítems' : 'Agregar al menos un ítem',
      section: 3,
      forDraft: true,
      pending: !filledItems.length || filledItems.some((item) => !item.itemName.trim() || !(Number(item.quantity) > 0))
    },
    { key: 'points', label: 'Completar puntos y rango de medición de los ítems', section: 3, forDraft: false, pending: itemsNeedingPoints.length > 0 },
    { key: 'payment', label: 'Elegir la forma de pago', section: 4, forDraft: false, pending: !formState.paymentMethod },
    { key: 'instrument', label: 'Definir el tiempo de entrega de equipos', section: 4, forDraft: false, pending: !formState.instrumentDeliveryTime },
    { key: 'certificate', label: 'Definir el tiempo de entrega de certificados', section: 4, forDraft: false, pending: !formState.certificateDeliveryTime },
    { key: 'discount', label: 'Completar el tipo y valor del descuento', section: 4, forDraft: false, pending: Boolean(formState.hasDiscount) && (!formState.discountType || !(Number(formState.discountValue) > 0)) }
  ]
  const pendingRequirements = requirements.filter((requirement) => requirement.pending)
  const pendingForDraft = pendingRequirements.filter((requirement) => requirement.forDraft)
  const pendingBySection = WORKSPACE_SECTIONS.map((_, index) => pendingRequirements.filter((requirement) => requirement.section === index).length)

  return {
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    validItemsCount,
    itemsNeedingPoints,
    pendingRequirements,
    pendingForDraft,
    pendingBySection
  }
}

export type CalibrationServiceWorkspaceSummary = ReturnType<typeof getWorkspaceSummary>
