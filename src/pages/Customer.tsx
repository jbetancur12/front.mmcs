import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  InputAdornment,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import CalibrationTimeline from '../Components/CalibrationTimeline'
import { ArrowBack, Clear } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery, useQueryClient } from 'react-query'
import Modules from 'src/Components/Modules'

// API URL

const minioUrl = import.meta.env.VITE_MINIO_URL

interface UserData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
}

export interface ApiResponse {
  totalFiles: number
  totalPages: number
  currentPage: number
  files: Certificate[]
  foundFields: string[]
}

type Tab =
  | 'users'
  | 'certificates'
  | 'headquarters'
  | 'calibrationTimeLine'
  | 'modules'

function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams()
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams()
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const queryClient = useQueryClient() // Initialize query client
  const [customerData, setCustomerData] = useState<UserData>({
    nombre: '',
    email: '',
    telefono: '',
    avatar: '',
    sede: []
  })

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab')
    const validTabs: Tab[] = [
      'users',
      'certificates',
      'headquarters',
      'calibrationTimeLine',
      'modules'
    ]
    return validTabs.includes(tabParam as Tab)
      ? (tabParam as Tab)
      : 'certificates'
  })

  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  const [image, setImage] = useState('/images/pngaaa.com-4811116.png')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedSede, setSelectedSede] = useState<string | null>('')

  // Fetch customer data
  useQuery<UserData>(
    ['customer-data', id],
    async () => {
      const response = await axiosPrivate.get(`/customers/${id}`)
      return response.data
    },
    {
      onSuccess: (data) => {
        setCustomerData(data)
      }
    }
  )

  // Fetch certificates data using useQuery
  const { data: apiResponse, refetch } = useQuery<ApiResponse>(
    ['certificates-data', id, searchTerm, currentPage],
    async () => {
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: { search: searchTerm, page: currentPage }
      })
      return response.data
    }
  )

  const certificatesData = apiResponse?.files || []

  // Aquí puedes usar el valor de 'id' para cargar los detalles del cliente correspondiente
  // por ejemplo, hacer una solicitud a la API o acceder a tus datos.

  const getuserInfo = async () => {
    const response = await axiosPrivate.get(`/customers/${id}`, {})
    if (response.status === 200) {
      setCustomerData(response.data)
      setImage(minioUrl + '/images/' + response.data.avatar)
    }
  }

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este certificado? Esta acción no se puede deshacer.'
    )

    if (!isConfirmed) {
      return
    }

    try {
      const response = await axiosPrivate.delete(`/files/${id}`)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Certificado eliminado con éxito', 'success')
        refetch()
        // Invalidate and refetch the certificates query to update the UI
        queryClient.invalidateQueries(['certificates-data', id])
      }
    } catch (error) {
      console.error('Error al eliminar el certificado:', error)
      bigToast('Error al eliminar el certificado', 'error')
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
    if (searchTerm) {
      setSearchParams({ query: searchTerm })
    } else {
      searchParams.delete('query')
      setSearchParams(searchParams)
    }
  }, [searchTerm])

  useEffect(() => {
    getuserInfo()
  }, [])

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (
          $userStore.rol.some((role) =>
            ['admin', 'metrologist'].includes(role)
          ) ||
          id === $userStore.customer.id + ''
        ) {
          setHasPermission(true)
        } else {
          setHasPermission(false)

          navigate(-1) // Redirige a una página de acceso denegado o similar
        }
      } catch (error) {
        navigate(-1) // Redirige en caso de error
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
    return () => {
      setLoading(true)
    }
  }, [id, $userStore.rol, $userStore.customer, navigate])

  const handleAddSede = async (newSede: string) => {
    try {
      const response = await axiosPrivate.post(`/customers/${id}/sedes`, {
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

  const handlePageChange = (direction: string) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    } else if (
      direction === 'next' &&
      apiResponse &&
      currentPage < apiResponse?.totalPages
    ) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleTabChange = (tab: Tab) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', tab)
    setSearchParams(newSearchParams)
    setActiveTab(tab)
  }

  const handleEditSede = async (oldSede: string, newSede: string) => {
    try {
      // Llama a la API para actualizar la sede (ajusta la URL y payload según tu backend)
      const response = await axiosPrivate.put(`/customers/${id}/sedes`, {
        oldSede,
        newSede
      })

      if (response.status === 200) {
        bigToast('Sede actualizada con éxito', 'success')
        // Actualiza el estado local, reemplazando la sede antigua por la nueva
        setCustomerData((prevData) => ({
          ...prevData,
          sede: prevData.sede.map((sede) => (sede === oldSede ? newSede : sede))
        }))
      }
    } catch (error) {
      console.error('Error al actualizar sede:', error)
      bigToast('Error al actualizar sede', 'error')
    }
  }

  if (loading) {
    return <Typography variant='h6'>Cargando...</Typography>
  }

  if (!hasPermission) {
    return <Typography variant='h6'>No tienes permisos suficientes</Typography>
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
              handleTabChange('certificates')
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
              handleTabChange('headquarters')
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
              handleTabChange('calibrationTimeLine')
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
        {$userStore.rol.some((role) => ['admin'].includes(role)) && (
          <>
            <li className='mr-1'>
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault()
                  handleTabChange('users')
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
            <li>
              <a
                href='#'
                onClick={(e) => {
                  e.preventDefault()
                  handleTabChange('modules')
                }}
                className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${
                  activeTab === 'modules'
                    ? 'border-l border-t border-r rounded-t'
                    : 'text-blue-500 hover:text-blue-800'
                }`}
              >
                Modulos
              </a>
            </li>
          </>
        )}
      </ul>
      {activeTab === 'certificates' && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <TextField
            sx={{ width: '90%', mb: 2 }}
            variant='outlined'
            placeholder='Buscar Equipo(s)...'
            fullWidth
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            InputProps={{
              endAdornment: searchTerm && (
                <InputAdornment position='end'>
                  <IconButton
                    aria-label='clear search'
                    onClick={() => setSearchTerm('')}
                    edge='end'
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Typography variant='subtitle2' gutterBottom>
            Total Equipos: {apiResponse?.totalFiles}
          </Typography>
          {apiResponse && searchTerm && apiResponse?.totalFiles > 0 && (
            <Typography variant='subtitle2' gutterBottom>
              Resultados por : {apiResponse?.foundFields.join(', ')}
            </Typography>
          )}
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
            <>
              {certificatesData.map((certificate: Certificate) => (
                <CertificateListItem
                  key={certificate.id}
                  certificate={certificate}
                  onDelete={handleDelete}
                  sedes={customerData.sede}
                />
              ))}
              <div className='flex justify-between items-center p-4'>
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50'
                >
                  Anterior
                </button>
                <div className='text-center'>
                  <p className='text-lg font-semibold'>
                    Página {currentPage} de {apiResponse?.totalPages}
                  </p>
                </div>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === apiResponse?.totalPages}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50'
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </Paper>
      )}
      {activeTab === 'users' && <TableUsersCustomer />}
      {activeTab === 'headquarters' && (
        <Headquarters
          setSelectedSede={setSelectedSede}
          selectedSede={selectedSede}
          sedes={customerData.sede}
          onDelete={handleDelete}
          onAddSede={handleAddSede}
          onEditSede={handleEditSede}
        />
      )}
      {activeTab === 'calibrationTimeLine' && (
        <CalibrationTimeline customerId={id} />
      )}
      {activeTab === 'modules' && <Modules customerId={id} />}
    </div>
  )
}

export default UserProfile
