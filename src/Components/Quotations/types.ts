import { statusOptions } from './constants'

// types.ts
export interface Product {
  name: string
  price: number
  quantity: number
  visits?: number
}

export interface Customer {
  id: number
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  value: string
}

export interface QuoteFormData {
  id?: number
  customer: Customer | null
  quoteType: 'equipos' | 'mantenimiento'
  products: Product[]
  discountRatio: number
  taxRatio: number
  observations: string
  comments: string[]
  otherFields: {
    paymentMethod: string
    generalConditions: string
    paymentConditions: string
    deliveryConditions: string
  }
  status: {
    status: StatusKey // Usar el tipo StatusKey aquí
    user: string
    date: Date
    comments: string
  }[]
}

export interface OptionType {
  value: string
  label: string
  price: number
}

export interface PaymentConditionsOptions {
  [key: string]: string
}

export type StatusKey = 'created' | 'sent' | 'accepted' | 'rejected'

export const isStatusKey = (value: any): value is StatusKey => {
  return Object.keys(statusOptions).includes(value)
}

// Agregar tipo para la función de cambio
export type HandleProductChangeType = (
  index: number,
  field: string,
  value: string | number | OptionType,
  quoteType: 'equipos' | 'mantenimiento'
) => void
