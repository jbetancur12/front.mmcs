export interface IModule {
  id?: string
  name: string
  label: string
  description: string
  audience?: 'internal' | 'client' | 'both'
}

export interface ModuleFormProps {
  onSuccess?: () => void
  initialData?: IModule
  onCancel?: () => void
}
