import React, { useState } from 'react'
import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MaintenanceRecord, InterventionType } from './types'

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import AddMaintenanceRecordModal from './AddMaintenanceRecordModal'
import { format } from 'date-fns'
import { ArrowBack, Plumbing } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'

const fetchMaintenanceRecords = async (
  vehicleId: number
): Promise<MaintenanceRecord[]> => {
  const axiosPrivate = useAxiosPrivate()
  const { data } = await axiosPrivate.get(
    `/maintenanceRecord?vehicleId=${vehicleId}`,
    {}
  )
  return data
}

const fetchInterventionTypes = async (): Promise<InterventionType[]> => {
  const axiosPrivate = useAxiosPrivate()
  const { data } = await axiosPrivate.get(`/interventionType`, {})
  return data
}

const MaintenanceRecords: React.FC = () => {
  const navigate = useNavigate()

  const { id } = useParams<{ id: string }>()

  const { data: records, refetch } = useQuery<MaintenanceRecord[]>(
    ['maintenanceRecords', id],
    () => fetchMaintenanceRecords(Number(id)),
    { enabled: !!id }
  )

  const { data: interventionTypes } = useQuery<InterventionType[]>(
    'interventionType',
    fetchInterventionTypes
  )

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<MaintenanceRecord>[] = [
    {
      accessorKey: 'date',
      header: 'Fecha',
      size: 150,
      Cell: ({ row }) => format(new Date(row.getValue('date')), 'yyyy-MM-dd')
    },
    { accessorKey: 'description', header: 'Descripción', size: 300 },
    { accessorKey: 'cost', header: 'Costo', size: 100 }
    // {
    //   accessorKey: 'interventionType.name',
    //   header: 'Tipo de Intervención',
    //   size: 200
    // }
  ]

  const handleSave = () => {
    // Refetch the maintenance records to update the table
    refetch()
    setIsAddModalOpen(false)
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Stack direction='row' spacing={2} mb={2}>
        <IconButton onClick={() => navigate('/fleet')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant='h4' gutterBottom>
          Historial de Mantenimiento
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          justifyContent: 'space-between'
        }}
      >
        <Button
          variant='contained'
          color='primary'
          onClick={() => setIsAddModalOpen(true)}
        >
          Agregar Intervencion
        </Button>

        <Button>
          <IconButton onClick={() => navigate('/fleet/interventions')}>
            <Plumbing />
          </IconButton>
        </Button>
      </Box>

      <MaterialReactTable columns={columns} data={records || []} />

      {isAddModalOpen && interventionTypes && (
        <AddMaintenanceRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSave}
          interventionTypes={interventionTypes}
          vehicleId={Number(id)}
        />
      )}
    </Box>
  )
}

export default MaintenanceRecords
