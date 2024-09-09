import { useNavigate, useParams } from 'react-router-dom'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
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

const fieldLabels: { [key: string]: string } = {
  compania: 'Compañía',
  equipo: 'Equipo',
  city: 'Ciudad',
  location: 'Ubicación',
  sede: 'Sede',
  activoFijo: 'Activo Fijo',
  serie: 'Serie',
  ultimaFechaCalibracion: 'Última Fecha de Calibración',
  proximaFechaCalibracion: 'Próxima Fecha de Calibración'
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
        const response = await axiosPrivate.put(
          `/files/${id}`,
          {
            [field]: newValue
          },
          {}
        )

        if (response.status === 200) {
          MySwal.fire(
            'Actualizado',
            `El campo ${fieldLabel} ha sido actualizado exitosamente`,
            'success'
          )
          // Aquí podrías recargar la información si es necesario
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

  return (
    <Paper elevation={3} className='p-4'>
      <IconButton onClick={() => navigate(-1)}>
        <ArrowBack />
      </IconButton>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='h6' gutterBottom>
          Detalles del Equipo
        </Typography>
        {$userStore.rol == 'admin' && (
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
            {$userStore.rol == 'admin' && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Compañía:</strong> {certificateData.customer.nombre}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Equipo:</strong> {certificateData.device.name}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && (
              <IconButton size='small' onClick={() => handleEdit('city')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Ciudad:</strong> {certificateData.city}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && (
              <IconButton size='small' onClick={() => handleEdit('location')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Ubicación:</strong> {certificateData.location}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && (
              <IconButton size='small' onClick={() => handleEdit('sede')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Sede:</strong> {certificateData.sede}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && (
              <IconButton size='small' onClick={() => handleEdit('activoFijo')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Activo Fijo:</strong> {certificateData.activoFijo}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && (
              <IconButton size='small' onClick={() => handleEdit('serie')}>
                <Edit fontSize='small' />
              </IconButton>
            )}
            <Typography flex={1}>
              <strong>Serie:</strong> {certificateData.serie}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && <Box ml={3.5} />}
            <Typography flex={1}>
              <strong>Última Fecha de Calibración:</strong>{' '}
              {new Date(certificateData.calibrationDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' mb={1}>
            {$userStore.rol == 'admin' && <Box ml={3.5} />}
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
