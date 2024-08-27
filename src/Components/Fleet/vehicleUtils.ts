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
  await axios.post(`${apiUrl}/vehicles`, vehicle, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
}

export const vehicleFields: FieldConfig[] = [
  { accessorKey: 'vin', header: 'Número de Identificación', type: 'text' },
  {
    accessorKey: 'licensePlate',
    header: 'Número de Identificación',
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
    accessorKey: 'status',
    header: 'Estado',
    type: 'select',
    options: ['Disponible', 'En Servicio', 'En Mantenimiento']
  }
]
