// src/modules/components/ModulesView.tsx
import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Button, CircularProgress, Box, Typography } from '@mui/material'
import Swal from 'sweetalert2'

import ModuleForm from './ModuleForm'
import { IModule } from '../types/moduleTypes'
import useAxiosPrivate from '@utils/use-axios-private'

const ModulesView = () => {
  const axiosPrivate = useAxiosPrivate()
  const [modules, setModules] = useState<IModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState(false)

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'label', headerName: 'Label', flex: 1 },
    { field: 'description', headerName: 'Descripción', flex: 2 }
  ]

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get('/modules')
      setModules(response.data)
    } catch (err) {
      setError('Error al cargar los módulos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const handleSuccess = () => {
    setOpenModal(false)
    Swal.fire({
      title: '¡Éxito!',
      text: 'Módulo creado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    })
    fetchModules()
  }

  return (
    <Box sx={{ height: 600, width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant='h4'>Módulos</Typography>
        <Button variant='contained' onClick={() => setOpenModal(true)}>
          Crear Nuevo Módulo
        </Button>
      </Box>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={modules}
          columns={columns}
          getRowId={(row) => row.name}
          autoHeight
          sx={{
            boxShadow: 2,
            border: 2,
            borderColor: 'primary.light',
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main'
            }
          }}
        />
      )}

      {/* Modal del formulario */}
      {openModal && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              p: 4,
              borderRadius: 2,
              width: '600px',
              maxWidth: '95%'
            }}
          >
            <ModuleForm
              onSuccess={handleSuccess}
              onCancel={() => setOpenModal(false)}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default ModulesView
