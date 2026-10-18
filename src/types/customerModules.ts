export type ModuleAudience = 'internal' | 'client' | 'both'

export interface LicensableModule {
  id: number
  name: string
  label: string
  description?: string
  audience: ModuleAudience
}

export interface ModuleUpdater {
  id: number
  nombre: string
}

/** Estado de un módulo para un cliente; null = nunca asignado (deshabilitado). */
export interface CustomerModuleCell {
  isActive: boolean
  updatedAt: string
  updatedBy: ModuleUpdater | null
}

export interface CustomerModulesRow {
  id: number
  nombre: string
  identificacion: string | null
  ciudad: string | null
  isActive: boolean | null
  modules: Record<number, CustomerModuleCell | null>
}

export interface CustomerModulesMatrix {
  modules: LicensableModule[]
  customers: CustomerModulesRow[]
  /** Clientes con módulos internos activos por herencia (no dan acceso, solo se señalan). */
  legacyInternal: { customerId: number; modules: string[] }[]
}

export interface BulkCustomerModulesInput {
  customerIds: number[]
  moduleId: number
  isActive: boolean
}

export interface BulkCustomerModulesResult {
  updated: number
  created: number
  unchanged: number
}
