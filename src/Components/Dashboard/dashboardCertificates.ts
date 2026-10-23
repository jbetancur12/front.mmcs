export interface Certificado {
  id: number
  city: string
  location: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  device: {
    id: number
    name: string
  }
}

export interface Customer {
  id: number
  nombre: string
  identificacion: string
  direccion: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  certificados: Certificado[]
}

/** Cliente con los conteos de sus certificados, calculados una sola vez. */
export interface CustomerSummary extends Customer {
  total: number
  expired: number
  upcoming: number
}

export type DueFilter = 'expired' | 'upcoming' | null

const DAY_MS = 24 * 60 * 60 * 1000

/** Vencido: ya pasó la fecha. Próximo: vence en los siguientes 30 días. */
export const summarizeCustomers = (
  customers: Customer[],
  now = new Date()
): CustomerSummary[] => {
  const limit = new Date(now.getTime() + 30 * DAY_MS)
  return customers.map((customer) => {
    let expired = 0
    let upcoming = 0
    for (const cert of customer.certificados ?? []) {
      const next = new Date(cert.nextCalibrationDate)
      if (next < now) expired++
      else if (next <= limit) upcoming++
    }
    return {
      ...customer,
      total: customer.certificados?.length ?? 0,
      expired,
      upcoming
    }
  })
}

/** Los más urgentes primero: más vencidos y, a igualdad, más próximos. */
export const byUrgency = (a: CustomerSummary, b: CustomerSummary) =>
  b.expired - a.expired || b.upcoming - a.upcoming

export const applyDueFilter = (
  customers: CustomerSummary[],
  filter: DueFilter
) =>
  filter === 'expired'
    ? customers.filter((customer) => customer.expired > 0)
    : filter === 'upcoming'
      ? customers.filter((customer) => customer.upcoming > 0)
      : customers
