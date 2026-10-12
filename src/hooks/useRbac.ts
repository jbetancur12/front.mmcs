import { useQuery } from 'react-query'
import { axiosPrivate } from '../utils/api'
import {
  RbacAuditParams,
  RbacAuditResponse,
  RbacMatrix
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
      (await axiosPrivate.get<RbacAuditResponse>('/rbac/audit', { params })).data,
    { keepPreviousData: true }
  )
