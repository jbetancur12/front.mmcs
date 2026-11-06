import { CatalogPriceSource } from './calibrationServiceWorkspaceTypes'
import { brand, neutral } from 'src/theme/designTokens'

export const REQUEST_CHANNEL_OPTIONS = [
  'En persona',
  'Por Email',
  'Por Telefono',
  'Por WhatsApp'
]
export const PAYMENT_METHOD_OPTIONS = [
  'De Contado',
  'A 30 Dias',
  'A 60 Dias',
  'A 90 Dias',
  '50% / 50%'
]
export const DELIVERY_TIME_OPTIONS = [
  '8 Dias Habiles',
  '15 Dias Habiles',
  '20 Dias Habiles',
  '30 Dias Habiles'
]
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
  border: `1px solid ${neutral.border}`,
  bgcolor: neutral.surface,
  boxShadow: 'none'
} as const

export const tealButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  py: 1.1,
  bgcolor: brand.main,
  '&:hover': { bgcolor: brand.hover },
  '&.Mui-disabled': { bgcolor: neutral.border, color: neutral.textFaint }
} as const

export const tealOutlineSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  py: 1.1,
  color: brand.hover,
  borderColor: brand.main,
  '&:hover': { borderColor: brand.hover, bgcolor: brand.soft }
} as const

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const SUGGESTED_CATALOG_PRICE_SOURCE: CatalogPriceSource = 'medicalPrice'
