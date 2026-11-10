/**
 * Enmascara datos de contacto en pantallas públicas (el API público ya los entrega
 * enmascarados; esto cubre el caso de que lleguen completos). Es idempotente.
 */

/** `juan.perez@empresa.com` -> `j***@empresa.com` */
export const maskEmail = (email?: string | null): string => {
  if (!email) return ''
  if (email.includes('*')) return email
  const at = email.lastIndexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}

/** `3138124282` -> `******4282` (solo se ven los últimos 4 dígitos) */
export const maskPhone = (phone?: string | null): string => {
  if (!phone) return ''
  if (phone.includes('*')) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '***'
  return `${'*'.repeat(Math.max(digits.length - 4, 3))}${digits.slice(-4)}`
}
