import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography
} from '@mui/material'

import { CloudUpload, Visibility, VisibilityOff } from '@mui/icons-material'
import toast, { Toaster } from 'react-hot-toast'
import { bigToast } from '../Components/ExcelManipulation/Utils.js'
import PDFViewer from '../Components/PDFViewer.js'
import { userStore } from '../store/userStore.js'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private.js'

interface Traceability {
  id: number
  name: string
  filePath: string
  createdAt: string
}

const initialState = {
  name: '',
  file: null as File | null
}

const Traceability = () => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const [traceabilities, setTraceabilities] = useState<Traceability[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [formData, setFormData] = useState(initialState)
  const [searchTerm, setSearchTerm] = useState('')
  const [visiblePDFs, setVisiblePDFs] = useState<{ [key: number]: boolean }>({})
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [updateId, setUpdateId] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axiosPrivate.get(`/traceabilities`, {})
        setTraceabilities(response.data)
      } catch (error) {
        console.error('Error al cargar los perfiles:', error)
      }
    }

    fetchProfiles()
  }, [])

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setFormData({
          ...formData,
          file
        })
      }
    }
  }

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setUpdateFile(file)
      }
    }
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('file', formData.file as Blob)

    try {
      const response = await axiosPrivate.post(
        `/traceabilities`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      toast.success('Trazabilidad creada con éxito')
      setTraceabilities([...traceabilities, response.data])
      handleCloseModal()
    } catch (error) {
      console.error('Error al crear la trazabilidad:', error)
    }
  }

  const handleUpdate = async (id: number) => {
    setUpdateId(id)
  }

  const handleUpdateSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!updateFile || updateId === null) {
      toast.error('Por favor selecciona un archivo PDF para actualizar.')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('file', updateFile)

    try {
      const response = await axiosPrivate.put(
        `/traceabilities/${updateId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      bigToast('PDF actualizado con éxito', 'success')
      setTraceabilities(
        traceabilities.map((traceability) =>
          traceability.id === updateId ? response.data : traceability
        )
      )
      setUpdateId(null)
      setUpdateFile(null)
    } catch (error) {
      console.error('Error al actualizar el PDF:', error)
      bigToast('Error al actualizar el PDF', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar esta trazabilidad?`)) {
      return
    }
    try {
      const response = await axiosPrivate.delete(`/traceabilities/${id}`, {})

      if (response.status >= 200 && response.status < 300) {
        bigToast('Trazabilidad eliminada con éxito', 'success')
        setTraceabilities(
          traceabilities.filter((traceability) => traceability.id !== id)
        )
      }
    } catch (error) {
      console.error('Error al eliminar la trazabilidad:', error)
      bigToast('Error al eliminar la trazabilidad', 'error')
    }
  }

  const togglePDFVisibility = (id: number) => {
    setVisiblePDFs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredTraceabilities = traceabilities.filter((traceability) =>
    traceability.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Toaster />
      <Typography variant='h6' gutterBottom>
        Trazabilidades
      </Typography>
      <TextField
        label='Buscar Trazabilidad'
        variant='outlined'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      {$userStore.rol.some((role) => ['admin'].includes(role)) && (
        <Button variant='contained' color='primary' onClick={handleOpenModal}>
          Crear Trazabilidad
        </Button>
      )}
      <List>
        {filteredTraceabilities.map((traceability) => (
          <div key={traceability.id}>
            <ListItem
              disablePadding
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={() => togglePDFVisibility(traceability.id)}
                >
                  {visiblePDFs[traceability.id] ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
                <ListItemText primary={traceability.name} />
              </Box>
              <div className='flex gap-4'>
                {$userStore.rol.some((role) => ['admin'].includes(role)) && (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => handleUpdate(traceability.id)}
                  >
                    Actualizar PDF
                  </Button>
                )}
                {$userStore.rol.some((role) => ['admin'].includes(role)) && (
                  <Button
                    variant='contained'
                    color='error'
                    onClick={() => handleDelete(traceability.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </ListItem>
            {visiblePDFs[traceability.id] && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <PDFViewer
                  path={traceability.filePath}
                  bucket='traceabilities'
                  view='preview'
                />
              </Box>
            )}
            <Divider />
          </div>
        ))}
      </List>
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Crear Nueva Trazabilidad</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Nombre'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 4 }}
          />
          <Button variant='outlined' sx={{ mb: 4 }}>
            <input
              type='file'
              accept='.pdf'
              id='file'
              name='file'
              onChange={handleFileChange}
              className='hidden'
            />
            <label htmlFor='file' className='flex items-center cursor-pointer'>
              <CloudUpload sx={{ mr: 1 }} />
              <span>Subir PDF</span>
            </label>
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color='primary' variant='contained'>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
      {updateId !== null && (
        <Dialog open={updateId !== null} onClose={() => setUpdateId(null)}>
          <DialogTitle>Actualizar PDF de Trazabilidad</DialogTitle>
          <DialogContent>
            <Button variant='outlined' sx={{ mb: 4 }}>
              <input
                type='file'
                accept='.pdf'
                id='updateFile'
                name='updateFile'
                onChange={handleUpdateFileChange}
                className='hidden'
              />
              <label
                htmlFor='updateFile'
                className='flex items-center cursor-pointer'
              >
                <CloudUpload sx={{ mr: 1 }} />
                <span>Subir nuevo PDF</span>
              </label>
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateId(null)} color='primary'>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              color='primary'
              variant='contained'
            >
              Actualizar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  )
}

export default Traceability
