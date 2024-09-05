import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TableUsersCustomer from '../Components/TableUsersCustomer'

import {
  Certificate,
  CertificateListItem
} from '../Components/CertificateListItem'
import { bigToast } from '../Components/ExcelManipulation/Utils'
import Headquarters from '../Components/Headquarters'
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Typography
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import CalibrationTimeline from '../Components/CalibrationTimeline'
import { ArrowBack } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery } from 'react-query'

// API URL

const minioUrl = import.meta.env.VITE_MINIO_URL

interface UserData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
}
interface GroupedCertificates {
  [key: string]: Certificate[]
}

type Tab = 'users' | 'certificates' | 'headquarters' | 'calibrationTimeLine'

function UserProfile() {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams()
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const [customerData, setCustomerData] = useState<UserData>({
    nombre: '',
    email: '',
    telefono: '',
    avatar: '',
    sede: []
  })

  const [activeTab, setActiveTab] = useState<Tab>('certificates')

  const [certificatesData, setCertificatesData] = useState<Certificate[]>([])

  const {
    data: certificatesDatax = [],
    isLoading,
    isFetched
  } = useQuery('certificates-data', async () => {
    const { data } = await axiosPrivate.get(`/files/customer/${id}`)
    return data
  })

  console.log(isFetched)

  const [searchTerm, setSearchTerm] = useState('')
  const [image, setImage] = useState('/images/pngaaa.com-4811116.png')
  // Aquí puedes usar el valor de 'id' para cargar los detalles del cliente correspondiente
  // por ejemplo, hacer una solicitud a la API o acceder a tus datos.

  const getuserInfo = async () => {
    const response = await axiosPrivate.get(`/customers/${id}`, {})
    if (response.status === 200) {
      setCustomerData(response.data)
      setImage(minioUrl + '/images/' + response.data.avatar)
    }
  }

  const getCertificateInfo = async () => {
    const response = await axiosPrivate.get(`/files/customer/${id}`, {})

    if (response.status === 200) {
      setCertificatesData(response.data)
    }
  }

  const groupedByHQ: GroupedCertificates =
    certificatesData.reduce<GroupedCertificates>((acc, item: Certificate) => {
      const { headquarter } = item
      if (!acc[headquarter]) {
        acc[headquarter] = []
      }
      acc[headquarter].push(item)
      return acc
    }, {})

  const filteredCertificates = certificatesData.filter((certificate) => {
    const searchFields = [
      certificate.device.name,
      certificate.location,
      certificate.sede,
      certificate.activoFijo,
      certificate.serie
    ]

    return searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este certificado? Esta acción no se puede deshacer.'
    )

    if (!isConfirmed) {
      return
    }

    try {
      const response = await axiosPrivate.delete(`/files/${id}`, {})

      if (response.status >= 200 && response.status < 300) {
        bigToast('Equipo eliminado con éxito', 'success')
        setCertificatesData(
          certificatesData.filter((certificate) => certificate.id !== id)
        )
      }
    } catch (error) {
      console.error('Error al eliminar el equipo:', error)
      bigToast('Error al eliminar el equipo', 'error')
    }
  }

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newImage = event.target.files?.[0]
    // Aquí puedes implementar la lógica para cargar la imagen al servidor y actualizarla en la base de datos
    // También puedes utilizar librerías como axios para hacer la solicitud HTTP
    if (newImage) {
      setImage(URL.createObjectURL(newImage))
      const formData = new FormData()
      formData.append('file', newImage as Blob)
      formData.append(
        'customerId',
        id !== undefined && typeof id === 'string' ? id : ''
      )

      try {
        // Enviar la imagen al backend Express
        await axiosPrivate.post(`/customers/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // Actualizar la imagen en el estado local
      } catch (error) {
        console.error('Error al enviar la imagen al backend:', error)
      }
    } else {
      setImage('/images/pngaaa.com-4811116.png')
    }
  }

  useEffect(() => {
    getuserInfo()
    getCertificateInfo()
  }, [])

  const handleAddSede = async (newSede: string) => {
    try {
      const response = await axiosPrivate.put(`/customers/${id}/sedes`, {
        nuevaSede: newSede
      })

      if (response.status === 200) {
        bigToast('Sede agregada con éxito', 'success')
        setCustomerData({
          ...customerData,
          sede: [...customerData.sede, newSede]
        })
      }
    } catch (error) {
      console.error('Error al agregar sede:', error)
    }
  }

  return (
    <div>
      <IconButton onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
        <ArrowBack />
      </IconButton>
      <div className='bg-white shadow-md rounded-lg p-8 max-w-md mx-auto mt-4'>
        <div className='text-center'>
          <div className='flex flex-col justify-center'>
            <label htmlFor='imageInput'>
              <img
                src={image} // Reemplaza con la URL de la imagen del usuario
                alt={`${customerData.nombre}`}
                className='w-24 h-24 rounded-full mx-auto cursor-pointer'
              />
            </label>
            <input
              type='file'
              id='imageInput'
              accept='image/*'
              className='hidden'
              onChange={handleImageChange}
            />
          </div>
          <h2 className='text-2xl font-semibold mt-4'>{customerData.nombre}</h2>
        </div>

        <div className='mt-6 '>
          {/* <h3 className="text-xl font-semibold">Información del usuario</h3> */}
          <ul className='mt-3'>
            <li className='flex items-center text-gray-700'>
              <svg
                className='h-5 w-5 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                height='1em'
                viewBox='0 0 512 512'
              >
                <path d='M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z' />
              </svg>
              {customerData.email}
            </li>
            <li className='flex items-center text-gray-700 mt-2'>
              <svg
                className='h-5 w-5 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                height='1em'
                viewBox='0 0 512 512'
              >
                <path d='M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z' />
              </svg>
              {customerData.telefono}
            </li>
          </ul>
        </div>
      </div>

      <ul className='flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 mt-8 '>
        <li className='-mb-px mr-1'>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('certificates')
            }}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
              activeTab === 'certificates'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
            }`}
            // aria-current={activeTab === "certificates" ? "page" : undefined}
          >
            Equipos
          </a>
        </li>
        <li className='mr-1'>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('headquarters')
            }}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
              activeTab === 'headquarters'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
            }`}
          >
            Sedes
          </a>
        </li>
        <li className='mr-1'>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('calibrationTimeLine')
            }}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
              activeTab === 'headquarters'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
            }`}
          >
            Programación
          </a>
        </li>
        {$userStore.rol === 'admin' && (
          <li className='mr-1'>
            <a
              href='#'
              onClick={(e) => {
                e.preventDefault()
                setActiveTab('users')
              }}
              className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
                activeTab === 'users'
                  ? 'border-l border-t border-r rounded-t'
                  : 'text-blue-500 hover:text-blue-800'
              }`}
            >
              Usuarios
            </a>
          </li>
        )}
      </ul>
      {activeTab === 'certificates' && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <input
            type='text'
            placeholder='Buscar Equipo(s)...'
            className='w-[50%] px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mt-4'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Typography variant='subtitle2' gutterBottom>
            Total Equipos: {filteredCertificates.length}
          </Typography>
          <Divider />
          {false ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              mt={2}
              // height='100vh'
              flexDirection='column'
            >
              <CircularProgress />
              <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
                Cargando Información...
              </Typography>
            </Box>
          ) : (
            filteredCertificates.map((certificate: Certificate) => (
              <CertificateListItem
                key={certificate.id}
                certificate={certificate}
                onDelete={handleDelete}
                sedes={customerData.sede}
              />
            ))
          )}
        </Paper>
      )}
      {activeTab === 'users' && <TableUsersCustomer />}
      {activeTab === 'headquarters' && (
        <Headquarters
          hqs={groupedByHQ}
          sedes={customerData.sede}
          onDelete={handleDelete}
          onAddSede={handleAddSede}
        />
      )}
      {activeTab === 'calibrationTimeLine' && (
        <CalibrationTimeline customerId={id} />
      )}
    </div>
  )
}

export default UserProfile
