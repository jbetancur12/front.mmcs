import { Link, useNavigate, useParams } from 'react-router-dom'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'
import {
  ButtonBase,
  capitalize,
  IconButton,
  List,
  ListItem,
  Typography
} from '@mui/material'
import { useState } from 'react'
import ModalHq from './ModalHq'

import { bigToast } from './ExcelManipulation/Utils'
import { ArrowBack } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'

export interface Certificate {
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
  certificateTypeId: number
  createdAt: string
  updatedAt: string
  headquarter: string
  device: {
    id: number
    name: string
    createdAt: string
    updatedAt: string
  }
}

interface CertificateListItemProps {
  certificate: Certificate
  onDelete: (id: number) => void
  sedes: string[]
}

export const CertificateListItem: React.FC<CertificateListItemProps> = ({
  certificate,
  onDelete,
  sedes
}) => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const { id } = useParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(certificate)

  const handleModalOpen = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const onSedeClick = async (sede: string) => {
    try {
      const response = await axiosPrivate.put(
        `/files/headquarter/${certificate.id}`,
        {
          headquarter: sede
        }
      )
      if (response.status === 200) {
        bigToast(
          'Sede actualizada con éxito, Actualice la página para ver los cambios',
          'success'
        )
        setSelectedCertificate(response.data)
        handleModalClose()
      }
    } catch (error) {}
  }

  if (!selectedCertificate) return null
  return (
    <>
      <IconButton onClick={() => navigate(`/customers/${id}`)}>
        <ArrowBack />
      </IconButton>
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div>
          <Link to={`/calibraciones/certificados/${selectedCertificate.id}`}>
            <h3 className='text-lg font-semibold'>
              {selectedCertificate.device.name}
            </h3>

            <p className='text-gray-500'>Ciudad: {selectedCertificate.city}</p>
            <p className='text-gray-500'>
              Sede: {selectedCertificate.headquarter.toUpperCase()}
            </p>
            <p className='text-gray-500'>
              Ubicación: {selectedCertificate.location}
            </p>
            <p className='text-gray-500'>
              Dirección: {selectedCertificate.sede}
            </p>
            <p className='text-gray-500'>
              Activo Fijo: {selectedCertificate.activoFijo}
            </p>
            <p className='text-gray-500'>Serie: {selectedCertificate.serie}</p>
            <p className='text-gray-500'>
              Fecha de Calibración:{' '}
              {new Date(
                selectedCertificate.calibrationDate
              ).toLocaleDateString()}
            </p>
            <p className='text-gray-500'>
              Proxima Fecha de Calibración:{' '}
              {new Date(
                selectedCertificate.nextCalibrationDate
              ).toLocaleDateString()}
            </p>
          </Link>
        </div>
        {$userStore.rol === 'admin' && (
          <>
            <div className='flex items-center'>
              <button
                className='mr-4 px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600'
                onClick={handleModalOpen}
              >
                Cambiar de Sede
              </button>
              <button
                className='px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600'
                onClick={() => onDelete(certificate.id)}
              >
                Eliminar
              </button>
            </div>
            {isModalOpen && (
              <ModalHq onClose={handleModalClose} open={isModalOpen}>
                <Typography
                  id='modal-title'
                  variant='h6'
                  component='h2'
                  gutterBottom
                >
                  Lista de Sedes
                </Typography>
                <List id='modal-description'>
                  {sedes.map((sede, index) => (
                    <ButtonBase
                      key={index}
                      sx={{ width: '100%' }}
                      onClick={() => onSedeClick(sede)}
                    >
                      <ListItem
                        key={index}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'lightgreen',
                            borderRadius: '5px'
                          }
                        }}
                      >
                        {capitalize(sede)}
                      </ListItem>
                    </ButtonBase>
                  ))}
                </List>
                {/* <Button
                onClick={handleModalClose}
                variant='contained'
                color='primary'
                sx={{ mt: 2 }}
                fullWidth
              >
                Cerrar
              </Button> */}
              </ModalHq>
            )}
          </>
        )}
      </div>
    </>
  )
}
