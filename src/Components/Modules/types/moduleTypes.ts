export interface IModule {
  id?: string
  name: string
  label: string
  description: string
}

export interface ModuleFormProps {
  onSuccess?: () => void
  initialData?: IModule
  onCancel?: () => void
}
