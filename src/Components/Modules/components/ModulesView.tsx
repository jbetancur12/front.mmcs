// src/modules/components/ModulesView.tsx
import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Button, CircularProgress, Box, Container, Grid, Paper, Typography } from '@mui/material'
import { Add, Apps } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
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
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Módulos'
        subtitle='Módulos de la plataforma que se pueden asignar a cada empresa'
        icon={<Apps />}
        actions={
          <Button variant='contained' startIcon={<Add />} onClick={() => setOpenModal(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
            Crear módulo
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Módulos' value={modules.length} icon={<Apps />} tone='teal' />
        </Grid>
      </Grid>

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
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <DataGrid
            rows={modules}
            columns={columns}
            getRowId={(row) => row.name}
            autoHeight
            sx={{
              border: 0,
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', fontWeight: 600 },
              '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(0, 191, 165, 0.04)' }
            }}
          />
        </Paper>
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
    </Container>
  )
}

export default ModulesView
