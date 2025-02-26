import { useNavigate, useParams } from 'react-router-dom'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import CertificatesList from '../Components/CertificatesList'
import UpdateCertificateModal from '../Components/UpdateCertificateModal'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'
import { ArrowBack, Edit } from '@mui/icons-material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import useAxiosPrivate from '@utils/use-axios-private'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { createRoot } from 'react-dom/client'
import { addYears, format } from 'date-fns'

const fieldLabels: { [key: string]: string } = {
  compania: 'Compañía',
  equipo: 'Equipo',
  city: 'Ciudad',
  location: 'Ubicación',
  sede: 'Sede',
  activoFijo: 'Activo Fijo',
  serie: 'Serie',
  calibrationDate: 'Última Fecha de Calibración',
  nextCalibrationDate: 'Próxima Fecha de Calibración'
}

interface DeviceDetailsProps {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  device: any
  customer: any
  certificateTypeId: number
  createdAt: string
  updatedAt: string
}

function Certificates() {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const MySwal = withReactContent(Swal)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [certificateData, setCertificateData] =
    useState<DeviceDetailsProps | null>(null)

  const getCertificateInfo = async () => {
    const response = await axiosPrivate.get(`/files/${id}`, {})
    if (response.status === 200) {
      setCertificateData(response.data)
    }
  }

  useEffect(() => {
    getCertificateInfo()
  }, [id])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleEdit = async (field: string) => {
    const fieldLabel = fieldLabels[field] || field

    if (field === 'calibrationDate' || field === 'nextCalibrationDate') {
      // Si el campo es una fecha, usamos DatePicker
      let selectedDate: Date | null = null

      const result = await MySwal.fire({
        title: 'Actualizar Información',
        html: `
          <div id="datepicker-container"></div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const container = document.getElementById('datepicker-container')
          if (container) {
            const PickerComponent = () => {
              const [value, setValue] = useState<Date | null>(null)
              return (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={value}
                    onChange={(newValue) => {
                      setValue(newValue)
                      selectedDate = newValue
                    }}
                    slots={{ textField: TextField }}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        fullWidth: true
                      },
                      popper: {
                        // Deshabilita el portal para que el popper se renderice
                        // dentro del mismo árbol DOM del modal
                        disablePortal: false,
                        style: { zIndex: 100000 }
                      }
                    }}
                  />
                </LocalizationProvider>
              )
            }

            const root = createRoot(container)
            root.render(<PickerComponent />)
          }
        },
        preConfirm: () => {
          if (!selectedDate) {
            Swal.showValidationMessage('Debes seleccionar una fecha')
            return false
          }
          return selectedDate
        }
      })

      if (result.isConfirmed) {
        const newValue = result.value // Formatear fecha YYYY-MM-DD
        if (newValue) {
          const payload: any = { [field]: newValue }
          if (field === 'calibrationDate') {
            const nextCalibrationDate = format(
              addYears(new Date(newValue), 1),
              'yyyy-MM-dd'
            )
            payload.nextCalibrationDate = nextCalibrationDate
          }
          try {
            const response = await axiosPrivate.put(`/files/${id}`, payload)

            if (response.status === 200) {
              MySwal.fire(
                'Actualizado',
                `El campo ${fieldLabel} ha sido actualizado exitosamente`,
                'success'
              )
              getCertificateInfo()
            }
          } catch (error) {
            MySwal.fire(
              'Error',
              `No se pudo actualizar el campo ${fieldLabel}`,
              'error'
            )
          }
        }
      }
    } else {
      // Para otros campos, usar un input de texto normal
      const result = await MySwal.fire({
        title: 'Actualizar Información',
        text: `Ingresa el nuevo valor para ${fieldLabel}`,
        input: 'text',
        inputPlaceholder: `Nuevo valor para ${fieldLabel}`,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        const newValue = result.value

        try {
          const response = await axiosPrivate.put(`/files/${id}`, {
            [field]: newValue
          })

          if (response.status === 200) {
            MySwal.fire(
              'Actualizado',
              `El campo ${fieldLabel} ha sido actualizado exitosamente`,
              'success'
            )
            getCertificateInfo()
          }
        } catch (error) {
          MySwal.fire(
            'Error',
            `No se pudo actualizar el campo ${fieldLabel}`,
            'error'
          )
        }
      }
    }
  }

  return (
    <Paper elevation={3} className='p-4'>
      <IconButton onClick={() => navigate(-1)}>
        <ArrowBack />
      </IconButton>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='h6' gutterBottom>
          Detalles del Equipo
        </Typography>
        {$userStore.rol.some((role) =>
          ['admin', 'metrologist'].includes(role)
        ) && (
          <Stack direction='row' spacing={2} mb={2}>
            <Button
              variant='contained'
              color='primary'
              onClick={handleOpenModal}
            >
              Actualizar Certificado
            </Button>
          </Stack>
        )}
      </Box>
      <Divider className='mb-4' />
      {certificateData && (
        <>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Compañía:</strong> {certificateData.customer.nombre}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Equipo:</strong> {certificateData.device.name}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton size='small' onClick={() => handleEdit('city')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Ciudad:</strong> {certificateData.city}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton size='small' onClick={() => handleEdit('location')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Ubicación:</strong> {certificateData.location}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton size='small' onClick={() => handleEdit('sede')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Sede:</strong> {certificateData.sede}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton size='small' onClick={() => handleEdit('activoFijo')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Activo Fijo:</strong> {certificateData.activoFijo}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton size='small' onClick={() => handleEdit('serie')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Serie:</strong> {certificateData.serie}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && (
              <IconButton
                size='small'
                onClick={() => handleEdit('calibrationDate')}
              >
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Última Fecha de Calibración:</strong>{' '}
              {new Date(certificateData.calibrationDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol.some((role) =>
              ['admin', 'metrologist'].includes(role)
            ) && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Próxima Fecha de Calibración:</strong>{' '}
              {new Date(
                certificateData.nextCalibrationDate
              ).toLocaleDateString()}
            </Typography>
          </Box>
        </>
      )}
      <Divider className='mb-4' />
      <UpdateCertificateModal
        open={isModalOpen}
        onClose={handleCloseModal}
        id={id}
      />
      <CertificatesList />
    </Paper>
  )
}

export default Certificates
