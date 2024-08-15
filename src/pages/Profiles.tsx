import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { api } from '../config'
import * as minioExports from 'minio'
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Delete } from '@mui/icons-material'
import ModalProfile from '../Components/ModalProfile'
import { bigToast } from '../Components/ExcelManipulation/Utils'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'

export interface Profile {
  id: number
  name: string
  photo: string
  phone: string
  email: string
  description: string
  imageProfile: string
}

const apiUrl = api()

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const Profiles: React.FC = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [openModal, setOpenModal] = useState(false)

  const getBucket = async (data: any) => {
    const profilePromises = data.map((item: any) => {
      return new Promise((resolve, reject) => {
        minioClient.getObject(
          'images',
          item.avatarUrl,
          (err: Error | null, dataStream: any) => {
            if (err) {
              console.error(err)
              reject(err)
            } else {
              resolve({ ...item, imageProfile: dataStream.url })
            }
          }
        )
      })
    })

    try {
      const profiles = await Promise.all(profilePromises)
      return profiles
    } catch (error) {
      console.error(error)
      return []
    }
  }
  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${apiUrl}/profiles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.data.length > 0) {
        const pro = await getBucket(response.data)
        setProfiles(pro)
      }
    } catch (error) {
      console.error('Error al cargar los perfiles:', error)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleEliminar = async (id: number) => {
    if (!confirm(`Esta seguro que desea eliminarel perfil ?`)) {
      return
    }
    const response = await axios.delete(`${apiUrl}/profiles/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })

    if (response.status === 204) {
      bigToast('Perfil eliminado con éxito', 'success')
      fetchProfiles()
    }
  }

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleOpenProfile = (id: any) => {
    navigate(`/profiles/${id}`)
  }

  return (
    <div>
      <ModalProfile open={openModal} onClose={() => setOpenModal(false)} />

      <Typography variant='h2' align='center' gutterBottom>
        Listado de Metrologos
      </Typography>
      <div className=' '>
        {$userStore.rol === 'admin' && (
          <Button
            variant='contained'
            onClick={handleOpenModal}
            sx={{
              mb: 2
            }}
          >
            Crear Perfil
          </Button>
        )}

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>

                {$userStore.rol === 'admin' && <TableCell></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((profile) => (
                // <ListItem
                //   key={profile.id}
                //   className='border border-gray-200 rounded-lg mb-4 p-4 shadow-md'
                // >
                //   <Link
                //     to={`${profile.id}`}
                //     className='text-blue-500 hover:underline'
                //   >
                //     <Typography variant='h4'>{profile.name}</Typography>
                //   </Link>
                // </ListItem>

                <TableRow key={profile.id}>
                  <TableCell
                    component='th'
                    scope='row'
                    onClick={() => handleOpenProfile(profile.id)}
                    sx={{
                      '&:hover': {
                        cursor: 'pointer',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={profile.imageProfile}
                        alt='imagen'
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          marginRight: '10px'
                        }}
                      />
                      {profile.name}
                    </div>
                  </TableCell>
                  <TableCell>{profile.phone}</TableCell>
                  <TableCell>{profile.email}</TableCell>

                  {$userStore && $userStore.rol === 'admin' && (
                    <TableCell>
                      <IconButton onClick={() => handleEliminar(profile.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  )
}

export default Profiles
