/** Datos de la plantilla de certificado que llegan desde el Excel. */
export interface CertificateTemplateData {
  location: string
  city: string
  solicitante: string
  activoFijo: string
  calibrationDate: string
  sede: string
  serie: string
  instrumento: string
}

/** Equipo recién creado desde el modal, ya en el formato del selector. */
export interface CreatedDeviceOption {
  id: number
  name: string
  certificateTemplate: CertificateTemplateData
}

/** Cliente recién creado desde el modal, ya en el formato del selector. */
export interface CreatedCustomerOption {
  id: number
  nombre: string
  sede: string[]
}

export interface AnalyzeExcelComponentProps {
  hideUpload?: boolean
  fileNames?: string[]
  selectedFile?: string | null
  isFile: boolean
  /** Controles a la derecha del encabezado de la página. */
  headerActions?: React.ReactNode
  setFileNames?: React.Dispatch<React.SetStateAction<string[]>>
  wbPasswords: string[]
}
