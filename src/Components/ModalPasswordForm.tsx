import React, { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import axios from 'axios'
import { api } from '../config'
import { bigToast } from './ExcelManipulation/Utils'
import { Delete, Visibility, VisibilityOff } from '@mui/icons-material'

const apiUrl = api()

interface ModalPasswordFormProps {
  open: boolean
  onClose: () => void
  wbPasswords: string[]
  setWbPasswords: React.Dispatch<React.SetStateAction<string[]>>
}

interface Password {
  password: string
}

const ModalPasswordForm: React.FC<ModalPasswordFormProps> = ({
  open,
  onClose,
  wbPasswords,
  setWbPasswords
}) => {
  const initialPasswordData = [{ password: '' }]
  const [passwords, setPasswords] = useState<Password[]>(initialPasswordData)
  const [showPassword, setShowPassword] = useState(false)

  // const [wbPasswords, setWbPasswords] = useState<string[]>([])
  const [showUpdateButton, setShowUpdateButton] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const passwordValues = passwords.map((password) => password.password)

    try {
      const response = await axios.post(
        `${apiUrl}/settings`,
        { passwords: passwordValues },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      console.log('Settings updated:', response)
      bigToast('Contraseñas creadas con éxito', 'success')
      onCloseModal()
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const onCloseModal = () => {
    setPasswords(initialPasswordData)
    onClose()
  }

  const handleAddPassword = () => {
    setPasswords([...passwords, { password: '' }])
  }

  const handleFormChange = (index: number, value: string) => {
    const newPasswords = passwords.map((password, i) =>
      i === index ? { password: value } : password
    )
    setPasswords(newPasswords)
  }

  const handleRemovePassword = (index: number) => {
    setPasswords(passwords.filter((_, i) => i !== index))
  }

  const handleRemoveFetchedPassword = (indexToRemove: number) => {
    setWbPasswords((prevPasswords) =>
      prevPasswords.filter((_, index) => index !== indexToRemove)
    )
    setShowUpdateButton(true)
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${apiUrl}/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 200) {
        const passwords = response.data
          .filter((data: any) => data.name === 'passwords')
          .flatMap((data: any) => data.values)
        setWbPasswords(passwords)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}/settings`,
        { passwords: wbPasswords },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      console.log('Settings updated:', response)
      bigToast('Contraseñas actualizadas con éxito', 'success')
      setShowUpdateButton(false)
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <Dialog open={open} onClose={onCloseModal}>
      <Paper elevation={3} sx={{ p: 2, width: 400 }}>
        <Typography variant='h5' component='div'>
          Contraseñas
        </Typography>

        <Stack spacing={2}>
          {wbPasswords.length > 0 ? (
            wbPasswords.map((password, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {showPassword ? (
                  <Typography>{password}</Typography>
                ) : (
                  <Typography>*********</Typography>
                )}
                <div>
                  {!showPassword ? (
                    <IconButton onClick={() => setShowPassword(true)}>
                      <Visibility />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => setShowPassword(false)}>
                      <VisibilityOff />
                    </IconButton>
                  )}
                  <Button
                    variant='text'
                    size='small'
                    color='error'
                    onClick={() => handleRemoveFetchedPassword(index)}
                    startIcon={<Delete />}
                  />
                </div>
              </div>
            ))
          ) : (
            <Typography variant='body2' color='error'>
              ¡No hay contraseñas!
            </Typography>
          )}
        </Stack>

        {showUpdateButton && <Button onClick={handleUpdate}>Actualizar</Button>}

        <Divider />
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <Typography variant='h6' component='p' sx={{ mb: 2 }}>
            Agregar Nueva Contraseña
          </Typography>

          {passwords.map((password, index) => (
            <div className='mb-4 flex' key={index}>
              <TextField
                name={`password${index}`}
                placeholder='Contraseña'
                value={password.password}
                onChange={(e) => handleFormChange(index, e.target.value)}
                sx={{ mr: 2, width: '100%', flex: 1 }}
              />

              <IconButton
                onClick={() => handleRemovePassword(index)}
                color='error'
                size='small'
              >
                <Delete />
              </IconButton>
            </div>
          ))}

          <Button
            variant='contained'
            color='primary'
            onClick={handleAddPassword}
            sx={{ mb: 2 }}
          >
            Agregar Contraseña
          </Button>
          <Divider style={{ marginBottom: '20px' }} />
          <Button type='submit' variant='contained' sx={{ mr: 2 }}>
            Guardar
          </Button>
          <Button variant='contained' onClick={onCloseModal} color='inherit'>
            Cancelar
          </Button>
        </form>
      </Paper>
    </Dialog>
  )
}

export default ModalPasswordForm
