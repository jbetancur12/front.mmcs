import { api } from '../config'
import { userStore, type UserData } from '../store/userStore'
import { axiosPrivate } from './api'
import { notify } from './notify'

interface RoleLike {
  name: string
}

/** Respuesta de /auth/validateToken convertida a lo que guarda `userStore`. */
export const formatSessionUser = (data: Record<string, unknown>): UserData => {
  const rol = data.rol
  const roles = data.roles
  const resolvedRoles: string[] = Array.isArray(rol)
    ? (rol as string[])
    : Array.isArray(roles)
      ? (roles as Array<RoleLike | string>).map((role) =>
          typeof role === 'string' ? role : role.name
        )
      : []

  return {
    ...(data as unknown as UserData),
    rol: resolvedRoles,
    lmsOnly: Boolean(data.lmsOnly)
  }
}

const signature = (user: UserData) =>
  JSON.stringify([
    [...(user.rol ?? [])].sort(),
    [...(user.permissions ?? [])].sort()
  ])

let inFlight: Promise<void> | null = null

const run = async () => {
  try {
    const before = userStore.get()
    const response = await axiosPrivate.get(`${api()}/auth/validateToken`)
    const next = formatSessionUser(response.data)
    userStore.set(next)

    if (before.email && signature(before) !== signature(next)) {
      notify.info('Tus permisos se actualizaron')
    }
  } catch {
    // Sin respuesta (o sesión cerrada) no hay nada que actualizar: RequireAuth vuelve a validar en la siguiente navegación
  }
}

/**
 * Vuelve a pedir al API quién es el usuario y qué puede hacer, y actualiza menús y permisos. Se usa cuando
 * cambian sus roles: el API responde 401 ROLES_CHANGED al token viejo, `use-axios-private` lo renueva (con los
 * roles nuevos) y repite la petición; si la petición que falla es esta, el interceptor se encarga de todo.
 * Varias llamadas a la vez comparten una sola petición.
 */
export const syncUserAccess = (): Promise<void> => {
  if (!inFlight) {
    inFlight = run().finally(() => {
      inFlight = null
    })
  }
  return inFlight
}
