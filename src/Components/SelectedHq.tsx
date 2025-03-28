import { useState, useEffect } from 'react'
import { Certificate, CertificateListItem } from './CertificateListItem'
import { Divider, Typography } from '@mui/material'
import { useQuery } from 'react-query'
import { ApiResponse } from 'src/pages/Customer'
import { useParams } from 'react-router-dom'
import { axiosPrivate } from '@utils/api'

interface SelectedHqProps {
  onDelete: (id: number) => void
  sedes: string[]
  selectedSede: string | null
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  onDelete,
  sedes,
  selectedSede
}) => {
  const { id } = useParams()

  // Recuperar el estado inicial desde sessionStorage
  const [searchTerm, setSearchTerm] = useState(
    sessionStorage.getItem('searchTerm') || ''
  )
  const [currentPage, setCurrentPage] = useState(
    parseInt(sessionStorage.getItem('currentPage') || '1', 10)
  )

  // Guardar el estado en sessionStorage cuando cambie
  useEffect(() => {
    sessionStorage.setItem('searchTerm', searchTerm)
  }, [searchTerm])

  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage.toString())
  }, [currentPage])

  // // Limpiar sessionStorage cuando el componente se desmonte (opcional)
  // useEffect(() => {
  //   return () => {
  //     sessionStorage.removeItem('searchTerm');
  //     sessionStorage.removeItem('currentPage');
  //   };
  // }, []);

  const { data: apiResponse } = useQuery<ApiResponse>(
    ['certificates-data', id, searchTerm, selectedSede, currentPage],
    async () => {
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: {
          search: searchTerm,
          headquarter: selectedSede,
          page: currentPage
        }
      })
      return response.data
    }
  )

  const certificatesData = apiResponse?.files || []

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

  return (
    <div>
      <input
        type='text'
        placeholder='Buscar Equipo(s)...'
        className='w-[50%] px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mt-4'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Typography variant='subtitle2' gutterBottom>
        Total Equipos: {apiResponse?.totalFiles}
      </Typography>
      <Divider />
      <>
        {certificatesData.map((certificate: Certificate) => (
          <CertificateListItem
            key={certificate.id}
            certificate={certificate}
            onDelete={onDelete}
            sedes={sedes}
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
    </div>
  )
}

export default SelectedHq
