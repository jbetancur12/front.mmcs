import { getRoleLabelEs, ROLES } from 'src/constants/roles'

import { Role } from './types'

export const getRoleChipLabel = (role: Role) => {
  const label = getRoleLabelEs(role.name)
  if (label !== role.name) {
    return label
  }

  const compactDescription = role.description?.split(' - ')[0]?.trim()
  return compactDescription || role.name
}

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'El email es requerido'
  if (!emailRegex.test(email)) return 'Formato de email inválido'
  return ''
}

export const validateName = (name: string) => {
  if (!name) return 'El nombre es requerido'
  if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres'
  return ''
}

export const validateRoles = (roles: Role[]) => {
  if (!roles || roles.length === 0) return 'Debe seleccionar al menos un rol'
  return ''
}

export const validatePhone = (phone: string, roles: Role[]) => {
  const isMetrologist = roles?.some((role) => role.name === ROLES.METROLOGIST)
  if (isMetrologist && !phone)
    return 'El teléfono es obligatorio para metrólogos'
  if (phone && !/^[0-9+\-\s().]+$/.test(phone)) {
    return 'Usa solo números y símbolos + - ( ) .'
  }
  return ''
}

// Validation helper function
export const validateRequired = (value: string) => !!value.length
