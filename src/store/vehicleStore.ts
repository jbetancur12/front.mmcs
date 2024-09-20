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
  upcomingReminders: [],
  pictureUrl: null,
  transitLicense: '',
  displacement: 0,
  color: '',
  serviceType: '',
  vehicleClass: '',
  bodyType: '',
  capacity: 0,
  engineNumber: '',
  chasisNumber: '',
  power: 0,
  declarationImportation: '',
  doors: 0,
  trafficAuthority: '',
  importationDate: '',
  registrationDate: '',
  expeditionDate: '',
  customerId: 0
})
