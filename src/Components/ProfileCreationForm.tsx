import React, { useState } from 'react'
import { TextField, Button, Container, Avatar } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import axios from 'axios'
import { api } from '../config'
import toast, { Toaster } from 'react-hot-toast'

const apiUrl = api()

const initialState = {
  name: '',
  phone: '',
  email: '',
  description: '',
  cv: null as File | null,
  avatar: null as File | null,
  avatarUrl: ''
}
interface Profile {
  onSave: () => void
}

const ProfileCreationForm: React.FC<Profile> = ({ onSave }) => {
  const [formData, setFormData] = useState(initialState)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type.includes('image')) {
        // Si es una imagen, se trata como el avatar
        setFormData({
          ...formData,
          avatar: file,
          avatarUrl: URL.createObjectURL(file)
        })
      } else if (file.type === 'application/pdf') {
        // Si es un PDF, se trata como el CV
        setFormData({
          ...formData,
          cv: file
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('phone', formData.phone)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('cv', formData.cv as Blob)
    formDataToSend.append('avatar', formData.avatar as Blob)

    try {
      const response = await axios.post(`${apiUrl}/profiles`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 200) {
        toast.success('Perfil creado con éxito')
        setFormData(initialState)
        onSave()
      } else {
        toast.error('Error al crear el perfil')
        onSave()
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error)
    }
  }

  return (
    <Container maxWidth='sm' className='mt-8'>
      <Toaster />
      {/* <Typography variant="h4" component="h1" align="center" className="mb-4">
        Crear Perfil de Usuario
      </Typography> */}
      <form onSubmit={handleSubmit}>
        <div className='flex items-center justify-center mb-4'>
          <label htmlFor='avatarInput' className='cursor-pointer'>
            <Avatar
              alt='Foto de perfil'
              src={formData.avatarUrl} // Mostramos la foto de perfil seleccionada
              sx={{ width: 100, height: 100, mb: 2 }}
            />
          </label>
          <input
            id='avatarInput'
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            className='hidden'
          />
        </div>
        <TextField
          fullWidth
          label='Nombre'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
          sx={{ mb: 4 }}
        />
        <TextField
          fullWidth
          label='Telefono'
          name='phone'
          value={formData.phone}
          onChange={handleInputChange}
          sx={{ mb: 4 }}
        />
        <TextField
          fullWidth
          label='Email'
          name='email'
          value={formData.email}
          onChange={handleInputChange}
          sx={{ mb: 4 }}
        />
        <TextField
          fullWidth
          label='Descripción de Perfil'
          name='description'
          multiline
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          sx={{ mb: 4 }}
        />
        <Button
          variant='outlined'
          sx={{ margin: '0px auto 20px', display: 'block' }}
        >
          <input
            type='file'
            accept='.pdf'
            id='cv'
            name='cv'
            onChange={handleFileChange}
            className='hidden'
          />
          <label htmlFor='cv' className='flex items-center cursor-pointer'>
            <CloudUploadIcon className='mr-2' />
            <span>Subir CV (PDF)</span>
          </label>
        </Button>
        <div className='flex justify-end mb-3'>
          <Button type='submit' variant='contained'>
            Crear Perfil
          </Button>
          <Button
            variant='contained'
            onClick={onSave}
            sx={{ marginLeft: '0.5rem', fontWeight: 'bold', color: '#DCFCE7' }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default ProfileCreationForm
