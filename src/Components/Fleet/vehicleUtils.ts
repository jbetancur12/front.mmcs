import axios from 'axios'
import { FieldConfig } from './GenericFormModal'
import { api } from '../../config'

export const apiUrl = api() // Ajusta la URL según tu configuración

export interface Vehicle {
  id?: number
  licensePlate: string
  make: string
  model: string
  year: number
  currentMileage: number
  fuelType: string
  status: string
}

export const fetchVehicles = async () => {
  const { data } = await axios.get(`${apiUrl}/vehicles`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
  return data
}

export const vehicleFields: FieldConfig[] = [
  {
    accessorKey: 'licensePlate',
    header: 'Número de Identificación',
    type: 'text'
  },
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
  { accessorKey: 'status', header: 'Estado', type: 'text' }
]
