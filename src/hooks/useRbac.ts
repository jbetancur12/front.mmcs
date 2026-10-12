import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '../utils/api'
import {
  RbacAuditParams,
  RbacAuditResponse,
  RbacMatrix,
  RbacRole
} from '../types/rbac'

export const rbacKeys = {
  all: ['rbac'] as const,
  matrix: ['rbac', 'matrix'] as const,
  audit: (params: RbacAuditParams) => ['rbac', 'audit', params] as const
}

/** Matriz capacidades x roles. Se refresca al volver a la pestaña: es una pantalla de administración. */
export const useRbacMatrix = () =>
  useQuery<RbacMatrix>(
    rbacKeys.matrix,
    async () => (await axiosPrivate.get<RbacMatrix>('/rbac/matrix')).data,
    { staleTime: 0, refetchOnWindowFocus: true }
  )

/** Historial de cambios, paginado en el servidor. */
export const useRbacAudit = (params: RbacAuditParams) =>
  useQuery<RbacAuditResponse>(
    rbacKeys.audit(params),
    async () =>
      (await axiosPrivate.get<RbacAuditResponse>('/rbac/audit', { params }))
        .data,
    { keepPreviousData: true }
  )

export interface UpdateRolePermissionsInput {
  roleId: number
  grant: string[]
  revoke: string[]
}

export interface UpdateRolePermissionsResult {
  roleId: number
  roleName: string
  granted: string[]
  revoked: string[]
}

/**
 * Otorga y/o quita capacidades a un rol. No invalida solo: quien guarda varios roles a la vez
 * refresca una sola vez al final (ver useRefreshRbac).
 */
export const useUpdateRolePermissions = () =>
  useMutation<UpdateRolePermissionsResult, unknown, UpdateRolePermissionsInput>(
    async ({ roleId, grant, revoke }) =>
      (
        await axiosPrivate.put<UpdateRolePermissionsResult>(
          `/rbac/roles/${roleId}/permissions`,
          { grant, revoke }
        )
      ).data
  )

/** Refresca la matriz y la auditoría (después de cualquier escritura). */
export const useRefreshRbac = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(rbacKeys.all)
}

export const useCreateRole = () => {
  const refresh = useRefreshRbac()
  return useMutation<
    RbacRole,
    unknown,
    { name: string; description?: string }
  >(
    async (input) => (await axiosPrivate.post<RbacRole>('/rbac/roles', input)).data,
    { onSuccess: () => refresh() }
  )
}

export const useUpdateRole = () => {
  const refresh = useRefreshRbac()
  return useMutation<
    RbacRole,
    unknown,
    { roleId: number; description?: string; isActive?: boolean }
  >(
    async ({ roleId, ...body }) =>
      (await axiosPrivate.patch<RbacRole>(`/rbac/roles/${roleId}`, body)).data,
    { onSuccess: () => refresh() }
  )
}
