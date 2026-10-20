import * as yup from 'yup'

import { MenuOption } from './types'

// Validation Schema
export const validationSchema = yup.object({
  picture: yup.mixed().required('La imagen es obligatoria'),
  internalCode: yup
    .string()
    .required('Código interno es obligatorio')
    .default('Automatico'),
  equipmentName: yup.string().required('Nombre del equipo es obligatorio'),
  brand: yup.string().required('Marca es obligatoria'),
  model: yup.string().required('Modelo es obligatorio'),
  serialNumber: yup.string().required('Número de serie es obligatorio'),
  supplier: yup.string().required('Proveedor es obligatorio'),
  manual: yup.boolean().required('Este campo es obligatorio'),
  magnitude: yup.string().required('Magnitud es obligatoria'),
  units: yup.string().required('Unidades son obligatorias'),
  receivedDate: yup.date().required('Fecha de recepción es obligatoria'),
  inServiceDate: yup.date().required('Fecha en servicio es obligatoria'),
  location: yup.string().required('Ubicación es obligatoria'),
  serviceType: yup.string().required('Tipo de servicio es obligatorio'),
  equipmentStatus: yup.string().required('Estado del equipo es obligatorio'),
  operationRange: yup.string().required('Rango de operación es obligatorio'),
  accuracy: yup.string().required('Exactitud es obligatoria'),
  resolution: yup.string().required('Resolución es obligatoria'),
  softwareFirmware: yup.string().required('Software/Firmware es obligatorio'),
  storageTemperature: yup
    .string()
    .required('Temperatura de almacenamiento es obligatoria'),
  storageHumidity: yup
    .string()
    .required('Humedad de almacenamiento es obligatoria'),
  operationTemperature: yup
    .string()
    .required('Temperatura de operación es obligatoria'),
  operationHumidity: yup
    .string()
    .required('Humedad de operación es obligatoria'),
  storageOperationComment: yup
    .string()
    .required('Comentario de almacenamiento/operación es obligatorio'),
  transportConditionsComment: yup
    .string()
    .required('Comentario de condiciones de transporte es obligatorio'),
  insuredValue: yup.number().required('Valor asegurado es obligatorio'),
  maintenanceProvider: yup
    .string()
    .required('Proveedor de mantenimiento es obligatorio'),
  maintenanceCycle: yup
    .number()
    .required('Ciclo de mantenimiento es obligatorio'),
  calibrationProvider: yup
    .string()
    .required('Proveedor de calibración es obligatorio'),
  calibrationCycle: yup.number().required('Ciclo de calibración es obligatorio')
})

export const initialDataSheetFormValues = {
  picture: null as File | null,
  internalCode: 'Automático', // Este valor es solo para visualización y no será enviado al backend
  equipmentName: '',
  brand: '',
  model: '',
  serialNumber: '',
  supplier: '',
  manual: false,
  magnitude: '',
  units: '',
  receivedDate: '',
  inServiceDate: '',
  location: '',
  serviceType: '',
  equipmentStatus: '',
  operationRange: '',
  accuracy: '',
  resolution: '',
  softwareFirmware: '',
  storageTemperature: '',
  storageHumidity: '',
  operationTemperature: '',
  operationHumidity: '',
  storageOperationComment: '',
  transportConditionsComment: '',
  insuredValue: '',
  maintenanceProvider: '',
  maintenanceCycle: '',
  calibrationProvider: '',
  calibrationCycle: '',
  status: 'available'
}

export type DataSheetFormValues = typeof initialDataSheetFormValues

export const menuOptions: MenuOption[] = [
  {
    value: 'Patrón Acreditación',
    text: 'Patrón Acreditación',
    route: 'patron-acreditacion'
  },
  {
    value: 'Patrón Trazabilidad',
    text: 'Patrón Trazabilidad',
    route: 'patron-trazabilidad'
  },
  {
    value: 'Patrón Primario',
    text: 'Patrón Primario',
    route: 'patron-primario'
  },
  {
    value: 'Patrón Secundario',
    text: 'Patrón Secundario',
    route: 'patron-secundario'
  },
  {
    value: 'Auxiliar Acreditación',
    text: 'Auxiliar Acreditación',
    route: 'auxiliar-acreditacion'
  },
  {
    value: 'Auxiliar Trazabilidad',
    text: 'Auxiliar Trazabilidad',
    route: 'auxiliar-trazabilidad'
  },
  {
    value: 'Instrumento Retenido',
    text: 'Instrumento Retenido',
    route: 'instrumento-retenido'
  }
]

// Opciones del select "Tipo de Servicio" en el formulario de creación
// (incluye "Equipo de Prestamo", que no aparece en los menús de la tabla).
export const createServiceTypeOptions: string[] = [
  'Patrón Acreditación',
  'Patrón Trazabilidad',
  'Patrón Primario',
  'Patrón Secundario',
  'Auxiliar Acreditación',
  'Auxiliar Trazabilidad',
  'Instrumento Retenido',
  'Equipo de Prestamo'
]

export const initialColumnVisibility = {
  id: false,
  pictureUrl: false,
  supplier: false,
  manual: false,
  magnitude: false,
  units: false,
  receivedDate: false,
  inServiceDate: false,
  location: false,
  serviceType: false,
  equipmentStatus: false,
  operationRange: false,
  accuracy: false,
  resolution: false,
  softwareFirmware: false,
  storageTemperature: false,
  storageHumidity: false,
  operationTemperature: false,
  operationHumidity: false,
  storageOperationComment: false,
  transportConditionsComment: false,
  insuredValue: false,
  maintenanceProvider: false,
  // maintenanceCycle: false,
  calibrationProvider: false
  // calibrationCycle: false
}

export const COLUMN_FILTERS_STORAGE_KEY = 'columnFiltersHV'
