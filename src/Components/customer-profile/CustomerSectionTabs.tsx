import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import React from 'react'

import CalibrationTimeline from '../CalibrationTimeline'
import Headquarters from '../Headquarters'
import Modules from '../Modules'
import TableUsersCustomer from '../TableUsersCustomer'

interface HeadquartersTabProps {
  selectedSede: string | null
  setSelectedSede: (sede: string | null) => void
  sedes: string[]
  handleDelete: (certificateId: number) => Promise<void>
  handleDeleteSede: (sede: string) => Promise<void>
  handleAddSede: (sede: string) => Promise<void>
  handleEditSede: (oldSede: string, newSede: string) => Promise<void>
}

export const HeadquartersTab = ({
  selectedSede,
  setSelectedSede,
  sedes,
  handleDelete,
  handleDeleteSede,
  handleAddSede,
  handleEditSede
}: HeadquartersTabProps) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Sedes del Cliente
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Gestiona las diferentes sedes y ubicaciones del cliente.
    </Typography>

    <Headquarters
      setSelectedSede={setSelectedSede}
      selectedSede={selectedSede}
      sedes={sedes}
      onDelete={handleDelete}
      onDeleteSede={handleDeleteSede}
      onAddSede={handleAddSede}
      onEditSede={handleEditSede}
    />
  </Box>
)

export const ScheduleTab = ({ id }: { id?: string }) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Programación de Calibraciones
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Visualiza y gestiona el cronograma de calibraciones.
    </Typography>

    {id && <CalibrationTimeline customerId={id} />}
  </Box>
)

export const UsersTab = ({
  canListCustomerUsers
}: {
  canListCustomerUsers: boolean
}) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Usuarios del Cliente
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Administra los usuarios asociados a este cliente.
    </Typography>

    {!canListCustomerUsers ? (
      <Alert severity='warning' sx={{ mt: 3 }}>
        Tu rol no tiene acceso a esta sección.
      </Alert>
    ) : (
      <Box sx={{ mt: 3 }}>
        <React.Suspense
          fallback={
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Cargando usuarios...</Typography>
            </Box>
          }
        >
          <TableUsersCustomer />
        </React.Suspense>
      </Box>
    )}
  </Box>
)

export const ModulesTab = ({
  canViewModules,
  id
}: {
  canViewModules: boolean
  id?: string
}) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Módulos del Cliente
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Configura los módulos y funcionalidades disponibles.
    </Typography>

    {!canViewModules ? (
      <Alert severity='warning' sx={{ mt: 3 }}>
        Tu rol no tiene acceso a esta sección.
      </Alert>
    ) : !id ? (
      <Alert severity='error' sx={{ mt: 3 }}>
        Error: ID de cliente no disponible
      </Alert>
    ) : (
      <Box sx={{ mt: 3 }}>
        <React.Suspense
          fallback={
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Cargando módulos...</Typography>
            </Box>
          }
        >
          <Modules customerId={id} />
        </React.Suspense>
      </Box>
    )}
  </Box>
)
