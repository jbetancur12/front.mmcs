// Query keys de react-query para Compras / Proveedores / Productos.
// Los prefijos coinciden con los que ya invalidan otras pantallas
// ('purchaseRequests', 'purchaseOrders', 'supplierDetails', 'personnelList',
// 'activeFiscalSettings'), así que no los cambies sin revisar esos usos.

export const purchaseKeys = {
  requests: ['purchaseRequests'] as const,
  orders: ['purchaseOrders'] as const,
  // '/personnel' filtrado como solicitantes; cuelga de 'personnelList' para que
  // la gestión de personal lo invalide al crear/editar personas.
  requesters: ['personnelList', 'requesters'] as const,
  statistics: ['purchaseStatistics'] as const,
  // FiscalParametersManagementPage invalida 'activeFiscalSettings'
  fiscalSettings: ['activeFiscalSettings'] as const
}

export const supplierKeys = {
  list: ['suppliersList'] as const,
  search: (term: string, purchaseType?: string | number | null) =>
    ['suppliersList', 'search', term, purchaseType ?? null] as const,
  details: (supplierId?: string | number) =>
    ['supplierDetails', supplierId] as const,
  evaluationStatusSummary: (supplierId?: string | number) =>
    ['supplierEvaluationStatusSummary', supplierId] as const,
  selectionCriteria: ['supplierSelection', 'criteria'] as const,
  selections: ['supplierSelection', 'list'] as const
}

export const productKeys = {
  all: ['products'] as const,
  list: ['products', 'list'] as const
}
