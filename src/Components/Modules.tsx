import React, { useEffect, useState } from 'react'
import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Module } from 'src/store/userStore'

interface CustomerModulesProps {
  customerId?: string | number
}

const Modules: React.FC<CustomerModulesProps> = ({ customerId }) => {
  const axiosPrivate = useAxiosPrivate()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axiosPrivate.get(
          `/customers/${customerId}/modules`
        )
        setModules(response.data)
      } catch (error) {
        setError('Error al obtener los módulos')
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [customerId, axiosPrivate])

  if (loading) return <CircularProgress />
  if (error) return <Typography color='error'>{error}</Typography>

  const handleModuleChange = async (moduleId: number, isActive: boolean) => {
    try {
      await axiosPrivate.put(`/customers/${customerId}/modules`, {
        moduleId,
        isActive
      })
      // Actualiza el estado local
      setModules((prevModules) =>
        prevModules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                customerModules: { ...module.customerModules, isActive }
              }
            : module
        )
      )
    } catch (error) {
      setError('Error al actualizar el módulo')
    }
  }

  return (
    <div className='p-4'>
      <Typography variant='h4' gutterBottom>
        Módulos del Cliente
      </Typography>
      {modules.length > 0 ? (
        modules.map((module) => (
          <Card key={module.id} className='mb-2'>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={module.customerModules.isActive}
                    onChange={(e) =>
                      handleModuleChange(module.id, e.target.checked)
                    }
                  />
                }
                label={module.label} // Asegúrate de que el nombre del módulo sea accesible
              />
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography>No hay módulos disponibles</Typography>
      )}
    </div>
  )
}

export default Modules
