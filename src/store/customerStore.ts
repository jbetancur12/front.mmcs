import { atom } from 'nanostores'

interface CustomerData {
  label: string
  value: string | number
}

export const customerStore = atom<CustomerData[]>([])
