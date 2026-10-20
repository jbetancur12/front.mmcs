import {
  CalibrationServiceItemPayload,
  CalibrationServicePayload
} from '../../../types/calibrationService'
import { CATALOG_PRICE_SOURCE_OPTIONS } from './calibrationServiceWorkspaceConstants'

export type FormItem = CalibrationServiceItemPayload & { localId: string }
export type FormState = Omit<CalibrationServicePayload, 'items'> & { items: FormItem[] }

export type CatalogPriceSource = (typeof CATALOG_PRICE_SOURCE_OPTIONS)[number]['value']

// Lo que falta para poder guardar (borrador) o enviar la cotización, y en qué paso se corrige
export interface Requirement {
  key: string
  label: string
  section: number
  forDraft: boolean
  pending: boolean
}

export type CustomerDialogMode = 'customer' | 'site'

export type SaveTargetStatus = 'draft' | 'pending_approval'

/** Ítem elegido en el selector de catálogo. */
export interface CatalogPickedItem {
  productId: number
  productVariantId: number
  itemName: string
  intervalText: string | null | undefined
  serviceType: string
  unitPrice: number
  catalogPriceSource: string
}
