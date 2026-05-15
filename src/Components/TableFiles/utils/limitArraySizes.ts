import { certificateTypeStore } from '@stores/certificateTypeStore'
import { customerStore } from '@stores/customerStore'
import { deviceStore } from '@stores/deviceStore'

export const limitArraySize = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  certificateTypeStore.set(arr)
}

export const limitArraySizeDevice = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  deviceStore.set(arr)
}

export const limitArraySizeCustomer = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  customerStore.set(arr)
}
