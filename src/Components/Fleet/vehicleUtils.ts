import useAxiosPrivate from '@utils/use-axios-private'
import { FieldConfig } from './GenericFormModal'

import { Vehicle } from './types'
import { useMutation, useQuery } from 'react-query'

interface VehicleQueryParams {
  customerId?: number | null
}

export const useVehicles = (queryParams: VehicleQueryParams = {}) => {
  const axiosPrivate = useAxiosPrivate()

  return useQuery(['vehicles', queryParams], async () => {
    const { data } = await axiosPrivate.get('/vehicles', {
      params: queryParams
    })
    return data
  })
}

export const useAddVehicle = () => {
  const axiosPrivate = useAxiosPrivate()

  return useMutation(async (vehicle: Vehicle) => {
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
    formData.append('customerId', vehicle.customerId + '')

    await axiosPrivate.post('/vehicles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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
