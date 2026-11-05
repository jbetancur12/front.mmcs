import { certificateTypeStore } from '@stores/certificateTypeStore'
import { customerStore } from '@stores/customerStore'
import { deviceStore } from '@stores/deviceStore'

/** Opción de los selectores: las tres tiendas comparten la misma forma. */
interface StoreOption {
  label: string
  value: string | number
}

// Mantiene como máximo dos opciones: la última elegida y la anterior.
const pushLimited = <T extends StoreOption>(arra: T[], newItem: T): T[] => {
  const isDuplicate = arra.some(
    (item) => item.value === newItem.value && item.label === newItem.label
  )
  if (isDuplicate) return arra
  return arra.length < 2 ? [...arra, newItem] : [...arra.slice(1), newItem]
}

export const limitArraySize = (arra: StoreOption[], newItem: StoreOption) => {
  certificateTypeStore.set(pushLimited(arra, newItem))
}

export const limitArraySizeDevice = (arra: StoreOption[], newItem: StoreOption) => {
  deviceStore.set(pushLimited(arra, newItem))
}

export const limitArraySizeCustomer = (arra: StoreOption[], newItem: StoreOption) => {
  customerStore.set(pushLimited(arra, newItem))
}
