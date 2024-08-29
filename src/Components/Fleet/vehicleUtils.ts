import axios from 'axios'
import { FieldConfig } from './GenericFormModal'
import { api } from '../../config'
import { Vehicle } from './types'

export const apiUrl = api() // Ajusta la URL según tu configuración

export const fetchVehicles = async () => {
  const { data } = await axios.get(`${apiUrl}/vehicles`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
  return data
}

export const addVehicle = async (vehicle: Vehicle) => {
  console.log(vehicle)
  const formData = new FormData()
  formData.append('picture', vehicle.pictureUrl as File)
  formData.append('vin', vehicle.vin)
  formData.append('licensePlate', vehicle.licensePlate)
  formData.append('make', vehicle.make)
  formData.append('model', vehicle.model)
  formData.append('year', vehicle.year + '')
  formData.append('currentMileage', vehicle.currentMileage + '')
  formData.append('fuelType', vehicle.fuelType)
  formData.append('status', vehicle.status)
  formData.append('purchaseDate', vehicle.purchaseDate)
  formData.append('transitLicense', vehicle.transitLicense)
  formData.append('displacement', vehicle.displacement + '')
  formData.append('color', vehicle.color)
  formData.append('serviceType', vehicle.serviceType.toLocaleLowerCase())
  formData.append('vehicleClass', vehicle.vehicleClass)
  formData.append('bodyType', vehicle.bodyType)
  formData.append('capacity', vehicle.capacity + '')
  formData.append('engineNumber', vehicle.engineNumber)
  formData.append('chasisNumber', vehicle.chasisNumber)
  formData.append('power', vehicle.power + '')
  formData.append('declarationImportation', vehicle.declarationImportation)
  formData.append('doors', vehicle.doors + '')
  formData.append('trafficAuthority', vehicle.trafficAuthority)
  formData.append('importationDate', vehicle.importationDate)
  formData.append('registrationDate', vehicle.registrationDate)
  formData.append('expeditionDate', vehicle.expeditionDate)

  await axios.post(`${apiUrl}/vehicles`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const vehicleFields: FieldConfig[] = [
  { accessorKey: 'pictureUrl', header: 'Imagen', type: 'image' },

  {
    accessorKey: 'licensePlate',
    header: 'Placa',
    type: 'text'
  },
  { accessorKey: 'purchaseDate', header: 'Fecha de Compra', type: 'text' },
  { accessorKey: 'make', header: 'Marca', type: 'text' },
  { accessorKey: 'model', header: 'Modelo', type: 'text' },
  { accessorKey: 'year', header: 'Año', type: 'number' },
  { accessorKey: 'currentMileage', header: 'Kilómetros', type: 'number' },
  {
    accessorKey: 'fuelType',
    header: 'Tipo de Combustible',
    type: 'select',
    options: ['Gasolina', 'Diesel', 'Electrico']
  },
  {
    accessorKey: 'transitLicense',
    header: 'Lincencia de Transito',
    type: 'text'
  },
  { accessorKey: 'displacement', header: 'Cilindraje', type: 'number' },
  { accessorKey: 'color', header: 'Color', type: 'text' },
  { accessorKey: 'serviceType', header: 'Tipo de Servicio', type: 'text' },
  { accessorKey: 'vehicleClass', header: 'Clase', type: 'text' },
  { accessorKey: 'bodyType', header: 'Carroceria', type: 'text' },
  { accessorKey: 'capacity', header: 'Capacidad', type: 'number' },
  { accessorKey: 'vin', header: 'Vin', type: 'text' },
  { accessorKey: 'engineNumber', header: 'Número de Motor', type: 'text' },
  { accessorKey: 'chasisNumber', header: 'Número de Chasis', type: 'text' },
  { accessorKey: 'power', header: 'Potencia', type: 'number' },
  {
    accessorKey: 'declarationImportation',
    header: 'Declaración de Importación',
    type: 'text'
  },
  { accessorKey: 'doors', header: 'Puertas', type: 'number' },
  {
    accessorKey: 'trafficAuthority',
    header: 'Autoridad de Tráfico',
    type: 'text'
  },
  {
    accessorKey: 'importationDate',
    header: 'Fecha de Importación',
    type: 'text'
  },
  {
    accessorKey: 'registrationDate',
    header: 'Fecha de Registro',
    type: 'text'
  },
  {
    accessorKey: 'expeditionDate',
    header: 'Fecha de Expedición',
    type: 'text'
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    type: 'select',
    options: ['Disponible', 'En Servicio', 'En Mantenimiento']
  }
]
