import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import axios from 'axios'
import { useMutation, useQuery } from 'react-query'
import { api } from '../config'
import { notify } from 'src/utils/notify'
import {
  AddOutlined,
  DeleteOutline,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import FormDialog, { FormDialogSection } from './Common/FormDialog'

import { logger } from 'src/utils/logger'
import { brand, neutral } from 'src/theme/designTokens'
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

const FULL_WIDTH = { gridColumn: '1 / -1' }

const ModalPasswordForm: React.FC<ModalPasswordFormProps> = ({
  open,
  onClose,
  wbPasswords,
  setWbPasswords
}) => {
  const initialPasswordData = [{ password: '' }]
  const [passwords, setPasswords] = useState<Password[]>(initialPasswordData)
  const [showPassword, setShowPassword] = useState(false)
  const [showUpdateButton, setShowUpdateButton] = useState(false)

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    }
  })

  const { data: settingsPasswords } = useQuery<string[]>(
    ['settings', 'passwords'],
    async () => {
      const response = await axios.get(`${apiUrl}/settings`, authHeaders())
      return response.data
        .filter((data: { name: string }) => data.name === 'passwords')
        .flatMap((data: { values: string[] }) => data.values)
    },
    {
      // Siempre fresco al montar, sin recargas al enfocar (no pisa ediciones locales)
      staleTime: 0,
      refetchOnWindowFocus: false,
      onError: (error) => {
        logger.error('Error fetching settings:', error)
      }
    }
  )

  const createPasswords = useMutation(
    (passwordValues: string[]) =>
      axios.post(
        `${apiUrl}/settings`,
        { passwords: passwordValues },
        authHeaders()
      ),
    { retry: false }
  )

  const updatePasswords = useMutation(
    (passwordsToSave: string[]) =>
      axios.put(
        `${apiUrl}/settings`,
        { passwords: passwordsToSave },
        authHeaders()
      ),
    { retry: false }
  )

  const handleSubmit = async () => {
    const passwordValues = passwords.map((password) => password.password)

    try {
      await createPasswords.mutateAsync(passwordValues)

      notify.success('Contraseñas creadas con éxito')
      onCloseModal()
    } catch (error) {
      logger.error('Error updating settings:', error)
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

  const handleUpdate = async () => {
    try {
      await updatePasswords.mutateAsync(wbPasswords)

      notify.success('Contraseñas actualizadas con éxito')
      setShowUpdateButton(false)
    } catch (error) {
      logger.error('Error updating settings:', error)
    }
  }

  // Las contraseñas cargadas viven en el estado del padre (se editan localmente)
  useEffect(() => {
    if (settingsPasswords) {
      setWbPasswords(settingsPasswords)
    }
  }, [settingsPasswords, setWbPasswords])

  return (
    <FormDialog
      open={open}
      onClose={onCloseModal}
      title='Contraseñas de los libros'
      subtitle='Se prueban en orden al abrir un Excel protegido'
      submitLabel='Guardar contraseñas'
      onSubmit={handleSubmit}
      loading={createPasswords.isLoading}
      submitDisabled={passwords.every((password) => !password.password)}
    >
      <FormDialogSection title='Guardadas'>
        <Box sx={FULL_WIDTH}>
          {wbPasswords.length > 0 ? (
            <>
              {wbPasswords.map((password, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    borderBottom: `1px solid ${neutral.border}`
                  }}
                >
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {showPassword ? password : '••••••••'}
                  </Typography>
                  <Tooltip title='Quitar'>
                    <IconButton
                      size='small'
                      color='error'
                      aria-label='Quitar contraseña'
                      onClick={() => handleRemoveFetchedPassword(index)}
                    >
                      <DeleteOutline fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              <Button
                size='small'
                startIcon={showPassword ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowPassword((value) => !value)}
                sx={{ mt: 1, color: brand.ink }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Button>
            </>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Aún no hay contraseñas guardadas.
            </Typography>
          )}
        </Box>
        {showUpdateButton ? (
          <Alert
            severity='warning'
            variant='outlined'
            sx={FULL_WIDTH}
            action={
              <Button
                color='inherit'
                size='small'
                onClick={handleUpdate}
                disabled={updatePasswords.isLoading}
              >
                Guardar cambios
              </Button>
            }
          >
            Quitaste contraseñas de la lista. Guarda los cambios para
            aplicarlos.
          </Alert>
        ) : null}
      </FormDialogSection>

      <FormDialogSection title='Agregar'>
        {passwords.map((password, index) => (
          <TextField
            key={index}
            label={`Contraseña ${index + 1}`}
            type={showPassword ? 'text' : 'password'}
            value={password.password}
            onChange={(e) => handleFormChange(index, e.target.value)}
            fullWidth
            sx={FULL_WIDTH}
            InputProps={{
              endAdornment:
                passwords.length > 1 ? (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      color='error'
                      aria-label='Quitar este campo'
                      onClick={() => handleRemovePassword(index)}
                    >
                      <DeleteOutline fontSize='small' />
                    </IconButton>
                  </InputAdornment>
                ) : undefined
            }}
          />
        ))}
        <Box sx={FULL_WIDTH}>
          <Button
            size='small'
            startIcon={<AddOutlined />}
            onClick={handleAddPassword}
            sx={{ color: brand.ink }}
          >
            Agregar otra
          </Button>
        </Box>
      </FormDialogSection>
    </FormDialog>
  )
}

export default ModalPasswordForm
