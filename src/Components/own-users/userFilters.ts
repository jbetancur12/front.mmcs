import { UserData } from './types'

/** Filtra usuarios por nombre, email, teléfono o rol (nombre o descripción). */
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
          role.description.toLowerCase().includes(searchTerm) ||
          role.name.toLowerCase().includes(searchTerm)
      )
  )
}
