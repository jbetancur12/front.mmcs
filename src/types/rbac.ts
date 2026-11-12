/** Tipos del panel "Roles y permisos" (api.mmcs: GET /rbac/matrix y /rbac/audit). */

export interface RbacRole {
  id: number
  name: string
  description: string | null
  /** El panel no puede renombrar ni desactivar los roles de sistema */
  isSystem: boolean
  isActive: boolean
  /** Usuarios activos con este rol: sirve para medir el impacto de un cambio */
  userCount: number
}

export interface RbacPermission {
  key: string
  module: string
  description: string | null
  /** Solo super_admin puede otorgarla o quitarla */
  isSensitive: boolean
  /**
   * Capacidades que necesita para servir de algo (api.mmcs: constants/permissionRequirements.js). Es una
   * guía: el panel avisa si un rol la tiene sin ellas, pero no lo impide.
   */
  requires?: string[]
}

export interface RbacGrant {
  roleId: number
  permissionKey: string
}

export interface RbacMatrix {
  roles: RbacRole[]
  permissions: RbacPermission[]
  grants: RbacGrant[]
}

export type RbacAuditAction =
  | 'grant'
  | 'revoke'
  | 'role_create'
  | 'role_update'
  | 'role_activate'
  | 'role_deactivate'
  /** Se le dieron o quitaron roles a una persona: before/after = { userId, email, roles } */
  | 'user_roles_change'
  /** Alguien empezó o terminó de suplantar a otra persona: after = { userId, email, roles } de la suplantada */
  | 'impersonation_start'
  | 'impersonation_end'

export interface RbacAuditItem {
  id: number
  createdAt: string
  action: RbacAuditAction
  actor: { id: number; nombre: string; email: string } | null
  roleId: number | null
  roleName: string | null
  permissionKey: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string | null
}

export interface RbacAuditResponse {
  total: number
  page: number
  limit: number
  items: RbacAuditItem[]
}

export interface RbacAuditParams {
  page: number
  limit: number
  roleId?: number
  permissionKey?: string
  action?: RbacAuditAction
}
