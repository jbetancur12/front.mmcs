import { atom } from 'nanostores'
import { Vehicle } from '../Components/Fleet/types'

export const vehicleStore = atom<Vehicle>({
  id: 0,
  vin: '',
  purchaseDate: '',
  licensePlate: '',
  make: '',
  model: '',
  year: 0,
  currentMileage: 0,
  fuelType: '',
  status: '',
  upcomingReminders: []
})
