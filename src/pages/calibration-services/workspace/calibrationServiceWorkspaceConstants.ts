import { CatalogPriceSource } from './calibrationServiceWorkspaceTypes'

export const REQUEST_CHANNEL_OPTIONS = ['En persona', 'Por Email', 'Por Telefono', 'Por WhatsApp']
export const PAYMENT_METHOD_OPTIONS = ['De Contado', 'A 30 Dias', 'A 60 Dias', 'A 90 Dias', '50% / 50%']
export const DELIVERY_TIME_OPTIONS = ['8 Dias Habiles', '15 Dias Habiles', '20 Dias Habiles', '30 Dias Habiles']
export const VALIDITY_DAY_OPTIONS = [8, 15, 30, 60, 90]
export const CATALOG_PRICE_SOURCE_OPTIONS = [
  { value: 'medicalPrice', label: 'Valor médica' },
  { value: 'industrialPrice', label: 'Valor industrial' },
  { value: 'thirdPartyPrice', label: 'Valor subcontratados' }
] as const

export const DISCOUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Valor fijo' },
  { value: 'percentage', label: 'Porcentaje' }
]

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const sectionCardSx = {
  borderRadius: '16px',
  mb: 3,
  border: '1px solid #e5e7eb',
  bgcolor: '#fff',
  boxShadow: 'none'
} as const

export const tealButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  py: 1.1,
  bgcolor: '#00BFA5',
  '&:hover': { bgcolor: '#00ACC1' },
  '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
} as const

export const tealOutlineSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  py: 1.1,
  color: '#00897B',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const SUGGESTED_CATALOG_PRICE_SOURCE: CatalogPriceSource = 'medicalPrice'
