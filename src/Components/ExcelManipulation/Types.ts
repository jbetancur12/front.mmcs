export interface ResourceOption {
  value: string
  label: string
}

export interface RepositoryData {
  id: number
  name: string
  path: string
}

export interface ResourceOptionCustomer extends ResourceOption {
  city: string
  department: string
  address: string
}

export interface AnalyzeExcelComponentProps {
  dataReceived?: any[]
  hideUpload?: boolean
  fileNames?: string[]
  selectedFile?: string | null
  isFile: boolean
  setFileNames?: React.Dispatch<React.SetStateAction<string[]>>
  wbPasswords: string[]
}

export interface ResourceOptionDevice extends ResourceOption {
  repositoryPath: string
  magnitude: string
  unit: string
}

export interface ComponentsCertificateProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  formData: any
  setFormData: (data: any) => void
  error: boolean
}
