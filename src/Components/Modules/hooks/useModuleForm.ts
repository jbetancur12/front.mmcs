// src/modules/hooks/useModuleForm.ts
import { useState } from 'react'
import { IModule } from '../types/moduleTypes'
import useAxiosPrivate from '@utils/use-axios-private'

export const useModuleForm = () => {
  const axiosPrivate = useAxiosPrivate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (moduleData: Omit<IModule, 'id'>) => {
    try {
      setLoading(true)
      setError(null)

      await axiosPrivate.post('/modules', moduleData)
      return true
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Error al crear el módulo'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { handleSubmit, loading, error }
}
