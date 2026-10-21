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
  if (!email) return 'Escribe el correo.'
  if (!emailRegex.test(email))
    return 'Revisa el correo: debe tener la forma nombre@empresa.com.'
  return ''
}

export const validateName = (name: string) => {
  if (!name) return 'Escribe el nombre.'
  if (name.length < 2) return 'El nombre debe tener al menos 2 letras.'
  return ''
}

export const validateRoles = (roles: Role[]) => {
  if (!roles || roles.length === 0) return 'Elige al menos un rol.'
  return ''
}

export const validatePhone = (phone: string, roles: Role[]) => {
  const isMetrologist = roles?.some((role) => role.name === ROLES.METROLOGIST)
  if (isMetrologist && !phone)
    return 'Escribe el teléfono: es obligatorio para metrólogos.'
  if (phone && !/^[0-9+\-\s().]+$/.test(phone)) {
    return 'Usa solo números y símbolos + - ( ) .'
  }
  return ''
}

// Validation helper function
export const validateRequired = (value: string) => !!value.length
