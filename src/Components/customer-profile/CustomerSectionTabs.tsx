import SignalLoader from 'src/Components/Common/SignalLoader'
import { Alert, Box, Typography } from '@mui/material'
import React from 'react'

import CalibrationTimeline from '../CalibrationTimeline'
import Headquarters from '../Headquarters'
import Modules from '../Modules'
import TableUsersCustomer from '../TableUsersCustomer'

interface HeadquartersTabProps {
  customerId?: string
  selectedSede: string | null
  setSelectedSede: (sede: string | null) => void
  sedes: string[]
  handleDelete: (certificateId: number) => Promise<void>
  handleDeleteSede: (sede: string) => Promise<void>
  handleAddSede: (sede: string) => Promise<void>
  handleEditSede: (oldSede: string, newSede: string) => Promise<void>
}

export const HeadquartersTab = ({
  customerId,
  selectedSede,
  setSelectedSede,
  sedes,
  handleDelete,
  handleDeleteSede,
  handleAddSede,
  handleEditSede
}: HeadquartersTabProps) => (
  <Box>
    <Headquarters
      customerId={customerId}
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
    {id && <CalibrationTimeline customerId={id} />}
  </Box>
)

export const UsersTab = ({
  canListCustomerUsers
}: {
  canListCustomerUsers: boolean
}) => (
  <Box>
    {!canListCustomerUsers ? (
      <Alert severity='warning' sx={{ mt: 3 }}>
        Tu rol no tiene acceso a esta sección.
      </Alert>
    ) : (
      <Box sx={{ mt: 3 }}>
        <React.Suspense
          fallback={
            <Box display='flex' justifyContent='center' py={4}>
              <SignalLoader message='Cargando usuarios...' />
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
    <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
      Módulos
    </Typography>
    <Typography variant='body2' color='text.secondary'>
      Activa o desactiva lo que este cliente puede usar.
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
              <SignalLoader message='Cargando módulos...' />
            </Box>
          }
        >
          <Modules customerId={id} />
        </React.Suspense>
      </Box>
    )}
  </Box>
)
