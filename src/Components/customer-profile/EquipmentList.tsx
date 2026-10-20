import { Devices } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material'
import React from 'react'

import EquipmentCard from '../EquipmentCard'

import { Certificate, CertificatesApiResponse } from './types'

interface EquipmentListProps {
  apiResponse?: CertificatesApiResponse
  certificatesData: Certificate[]
  searchTerm: string
  clearSearch: () => void
  handleDelete: (certificateId: number) => Promise<void>
  sedes: string[]
  rol: string[]
  currentPage: number
  handlePageChange: (direction: 'prev' | 'next') => void
}

/** Tarjetas de equipos con estados de carga/vacío y paginación. */
const EquipmentList: React.FC<EquipmentListProps> = ({
  apiResponse,
  certificatesData,
  searchTerm,
  clearSearch,
  handleDelete,
  sedes,
  rol,
  currentPage,
  handlePageChange
}) => (
  <>
    {!apiResponse ? (
      <Box display='flex' flexDirection='column' alignItems='center' py={8}>
        <CircularProgress size={60} sx={{ color: '#10b981', mb: 2 }} />
        <Typography variant='h6' color='text.secondary' gutterBottom>
          Cargando equipos...
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Obteniendo información de los equipos del cliente
        </Typography>
      </Box>
    ) : certificatesData.length === 0 ? (
      <Card
        elevation={0}
        sx={{ border: '2px dashed #d1d5db', borderRadius: '16px' }}
      >
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <Devices sx={{ fontSize: 40, color: '#9ca3af' }} />
          </Box>
          <Typography variant='h6' color='text.secondary' gutterBottom>
            {searchTerm
              ? 'No se encontraron equipos'
              : 'No hay equipos registrados'}
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            {searchTerm
              ? 'Intenta con otros términos de búsqueda o verifica los filtros aplicados'
              : 'Este cliente aún no tiene equipos registrados en el sistema'}
          </Typography>
          {searchTerm && (
            <Button
              variant='outlined'
              onClick={clearSearch}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </CardContent>
      </Card>
    ) : (
      <>
        {/* Equipment Cards Grid */}
        <Grid container spacing={3}>
          {certificatesData.map((certificate: Certificate) => (
            <Grid item xs={12} sm={6} lg={4} key={certificate.id}>
              <EquipmentCard
                certificate={certificate}
                onDelete={handleDelete}
                sedes={sedes}
                rol={rol}
              />
            </Grid>
          ))}
        </Grid>

        {/* Modern Pagination */}
        <Box display='flex' justifyContent='center' alignItems='center' mt={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2
              }}
            >
              <Button
                variant='outlined'
                onClick={() => handlePageChange('prev')}
                disabled={currentPage === 1}
                sx={{
                  borderRadius: '8px',
                  minWidth: '100px',
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                ← Anterior
              </Button>

              <Box display='flex' alignItems='center' gap={1} px={2}>
                <Typography variant='body2' color='text.secondary'>
                  Página
                </Typography>
                <Chip
                  label={currentPage}
                  size='small'
                  sx={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: '32px'
                  }}
                />
                <Typography variant='body2' color='text.secondary'>
                  de {apiResponse?.totalPages || 1}
                </Typography>
              </Box>

              <Button
                variant='outlined'
                onClick={() => handlePageChange('next')}
                disabled={currentPage === (apiResponse?.totalPages || 1)}
                sx={{
                  borderRadius: '8px',
                  minWidth: '100px',
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                Siguiente →
              </Button>
            </CardContent>
          </Card>
        </Box>
      </>
    )}
  </>
)

export default EquipmentList
