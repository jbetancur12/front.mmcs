export interface AssetLifeSheetAccessory {
  id?: number
  accessoryType: string
  brand?: string
  model?: string
  serialNumber?: string
  notes?: string
}

export interface AssetLifeSheetIntervention {
  id: number
  interventionDate: string
  interventionType: string
  title: string
  description: string
  observations?: string | null
  performedByName: string
  nextActionDate?: string | null
}

export interface AssetLifeSheet {
  id: number
  assetCode: string
  name: string
  assetCategory: string
  assetType: string
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  processor?: string | null
  ram?: string | null
  storage?: string | null
  operatingSystem?: string | null
  supplier?: string | null
  location?: string | null
  area?: string | null
  custodian?: string | null
  status: string
  receivedDate?: string | null
  inServiceDate?: string | null
  warrantyExpiresAt?: string | null
  hasManual: boolean
  hasWarranty: boolean
  maintenanceFrequency?: string | null
  imagePath?: string | null
  generalComments?: string | null
  technicalSpecifications?: string | null
  accessories: AssetLifeSheetAccessory[]
  interventions: AssetLifeSheetIntervention[]
  createdAt?: string
  updatedAt?: string
}

export interface AssetLifeSheetFormValues {
  assetCode: string
  name: string
  assetCategory: string
  assetType: string
  brand: string
  model: string
  serialNumber: string
  processor: string
  ram: string
  storage: string
  operatingSystem: string
  supplier: string
  location: string
  area: string
  custodian: string
  status: string
  receivedDate: string
  inServiceDate: string
  warrantyExpiresAt: string
  hasManual: boolean
  hasWarranty: boolean
  maintenanceFrequency: string
  generalComments: string
  technicalSpecifications: string
  accessories: AssetLifeSheetAccessory[]
}

export interface AssetInterventionFormValues {
  interventionDate: string
  interventionType: string
  title: string
  description: string
  observations: string
  performedByName: string
  nextActionDate: string
}
