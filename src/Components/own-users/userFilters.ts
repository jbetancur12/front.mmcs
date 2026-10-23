import { UserData } from './types'
import { getRoleChipLabel } from './userValidation'

/** Filtra usuarios por nombre, email, teléfono o rol (el nombre que se ve en pantalla, el interno o la descripción). */
export const filterUsers = (
  users: UserData[],
  globalFilter: string
): UserData[] => {
  if (!globalFilter) return users

  const searchTerm = globalFilter.toLowerCase()
  return users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      (user.phone || '').toLowerCase().includes(searchTerm) ||
      user.roles.some(
        (role) =>
          getRoleChipLabel(role).toLowerCase().includes(searchTerm) ||
          (role.description || '').toLowerCase().includes(searchTerm) ||
          role.name.toLowerCase().includes(searchTerm)
      )
  )
}
