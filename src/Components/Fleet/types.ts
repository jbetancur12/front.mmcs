export interface Document {
  id?: number
  documentType: string
  documentNumber: string
  description?: string
  issuedDate?: string
  expirationDate?: string
}

export interface Vehicle {
  id?: number
  vin: string
  purchaseDate: string
  licensePlate: string
  make: string
  model: string
  year: number
  currentMileage: number
  fuelType: string
  status: string
  upcomingReminders: Reminder[]
}

// Trip.ts
export interface Trip {
  id?: number
  vehicleId: number
  startMileage: number
  endMileage?: number | null
  startDate: string
  endDate?: string | null
  purpose?: string
  driver: string
  tripStatus: string
}

export interface TripsResponse {
  trips: Trip[]
  lastTrip: Trip | null
}

// Inspection.ts
export interface Inspection {
  id: number
  tripId: number
  vehicleId?: number
  inspectionType: 'Inspección de Entrada' | 'Inspección de Salida'
  tireCondition: string
  brakeCondition: string
  fluidLevels: string
  lightsCondition: string
  comments?: string
  inspectionDate: string
  inspectorName: string
}

export interface InspectionHistory extends Inspection {
  trip: {
    purpose: string
  }
  summary: string
}

export interface MaintenanceRecord {
  id: number
  vehicleId: number
  interventionTypeId: number | string
  date: string
  mileage: number
  description: string
  cost: number
  serviceProvider: string
  interventionTypes: InterventionType[]
}

export interface InterventionType {
  id?: number
  name: string
  description: string
  requiresReminder: boolean
}

export interface Reminder {
  months: number
  mileage: number
}

export interface ReminderResponse {
  id: number
  vehicleId: number
  interventionTypeId: number
  dueDate: string
  dueMileage: number
  interventionType: InterventionType
}
