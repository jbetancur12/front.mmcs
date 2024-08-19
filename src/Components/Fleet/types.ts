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
  licensePlate: string
  make: string
  model: string
  year: number
  currentMileage: number
  fuelType: string
  status: string
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
