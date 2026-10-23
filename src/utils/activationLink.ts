export interface ActivationLinkInfo {
  nombre?: string | null
  email: string
  phone?: string | null
  activationUrl: string
  /** undefined = no aplica (solo se consultó el enlace) */
  emailSent?: boolean
  emailError?: string | null
}

// Normaliza un teléfono colombiano a formato internacional para wa.me ('' si no es usable)
export const normalizeWhatsappPhone = (phone?: string | null) => {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  if (digits.length === 12 && digits.startsWith('57')) return digits
  return digits.length >= 11 ? digits : ''
}

export const buildActivationWhatsappUrl = (info: ActivationLinkInfo) => {
  const saludo = info.nombre ? `Hola ${info.nombre}, ` : 'Hola, '
  const text =
    `${saludo}ya tienes acceso a la plataforma de Metromedics. ` +
    `Activa tu cuenta y crea tu contraseña aquí: ${info.activationUrl}`
  return `https://wa.me/${normalizeWhatsappPhone(info.phone)}?text=${encodeURIComponent(text)}`
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback para contextos sin Clipboard API
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}
