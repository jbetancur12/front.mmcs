import { axiosPrivate } from './api'

import { logger } from 'src/utils/logger'

/** Opción mínima que consumen los selectores con búsqueda. */
export interface ResourceOption {
  value: number
  label: string
}

export interface CustomerOption extends ResourceOption {
  sede: string
}

/**
 * Busca en el servidor y mapea cada resultado a una opción del selector.
 * El debounce vive aquí para que todas las pantallas se comporten igual.
 */
export const loadOptions = async <T,>(
  inputValue: string,
  resource: string,
  mapFunction: (item: T) => ResourceOption
): Promise<ResourceOption[]> => {
  return new Promise((resolve, reject) => {
    const endpoint = `/${resource}`
    const fetchData = async () => {
      try {
        const response = await axiosPrivate.get(endpoint, {
          params: { q: inputValue }
        })
        const data = response.data as T[]
        resolve(data.map((item) => mapFunction(item)))
      } catch (error) {
        logger.error('Error al cargar opciones:', error)
        reject(error)
      }
    }

    setTimeout(fetchData, 1000)
  })
}

type RawOption = Record<string, unknown>

const readProperty = (option: RawOption, property: string): unknown =>
  option[property]

export const genericMapOptions = <T extends object>(
  option: T,
  valueProperty: string,
  labelProperty: string,
  extraMappings?: Record<string, string>
): ResourceOption & Record<string, unknown> => {
  const source = option as RawOption
  const base: ResourceOption & Record<string, unknown> = {
    value: readProperty(source, valueProperty) as number,
    label: readProperty(source, labelProperty) as string
  }

  if (extraMappings) {
    Object.keys(extraMappings).forEach((key) => {
      base[key] = readProperty(source, extraMappings[key])
    })
  }

  return base
}

export const mapOptions = <T extends object>(
  option: T,
  valueProperty: string,
  labelProperty: string
): ResourceOption => {
  const source = option as RawOption
  return {
    value: readProperty(source, valueProperty) as number,
    label: readProperty(source, labelProperty) as string
  }
}

export const mapOptionsCustomer = <T extends object>(
  option: T,
  valueProperty: string,
  labelProperty: string,
  sedeProperty: string
): CustomerOption => {
  const source = option as RawOption
  return {
    value: readProperty(source, valueProperty) as number,
    label: readProperty(source, labelProperty) as string,
    sede: readProperty(source, sedeProperty) as string
  }
}

export const capitalize = (str: string) => {
  if (typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
