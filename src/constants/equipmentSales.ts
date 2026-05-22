export const EQUIPMENT_SALES_ALLOWED_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const EQUIPMENT_SALES_EDIT_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const EQUIPMENT_SALES_INVOICE_ROLES = [
  'admin',
  'super_admin',
  'invoicing'
] as const

export const EQUIPMENT_SALES_PRODUCT_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const EQUIPMENT_QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  ready_for_invoicing: 'Lista para facturar',
  rejected: 'Rechazada',
  invoiced: 'Facturada',
  cancelled: 'Cancelada'
}

export const EQUIPMENT_QUOTATION_STATUS_COLORS: Record<string, string> = {
  draft: '#9e9e9e',
  sent: '#2196f3',
  accepted: '#4caf50',
  ready_for_invoicing: '#ff9800',
  rejected: '#f44336',
  invoiced: '#1565c0',
  cancelled: '#757575'
}
