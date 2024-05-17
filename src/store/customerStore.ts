import { atom } from 'nanostores'

interface CustomerData {
  label: string
  value: string
}

export const customerStore = atom<CustomerData[]>([])
