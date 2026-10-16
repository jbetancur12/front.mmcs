import React, { useCallback, useState } from 'react'
import { Button, Container, Paper } from '@mui/material'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MaintenanceRecord, InterventionType } from './types'

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import AddMaintenanceRecordModal from './AddMaintenanceRecordModal'
import { format } from 'date-fns'
import { Add, ArrowBack, Build, Plumbing } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import useAxiosPrivate from '@utils/use-axios-private'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

const MaintenanceRecords: React.FC = () => {
  const canManage = useCan(PERMISSIONS.FLEET_MAINTENANCE_MANAGE)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const axiosPrivate = useAxiosPrivate()

  const fetchMaintenanceRecords = useCallback(async (): Promise<
    MaintenanceRecord[]
  > => {
    const { data } = await axiosPrivate.get(
      `/maintenanceRecord?vehicleId=${id}`
    )
    return data
  }, [axiosPrivate, id])

  const fetchInterventionTypes = useCallback(async (): Promise<
    InterventionType[]
  > => {
    const { data } = await axiosPrivate.get(`/interventionType`)
    return data
  }, [axiosPrivate])

  const { data: records, refetch } = useQuery(
    ['maintenanceRecords', id],
    fetchMaintenanceRecords,
    {
      enabled: !!id
    }
  )

  const { data: interventionTypes } = useQuery(
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
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/fleet')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a flota
      </Button>

      <LmsPageHeader
        title='Historial de Mantenimiento'
        subtitle='Intervenciones registradas para este vehículo'
        icon={<Build />}
        actions={
          <>
            <Button variant='outlined' startIcon={<Plumbing />} onClick={() => navigate('/fleet/interventions')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
              Tipos de intervención
            </Button>
            {canManage && (
              <Button variant='contained' startIcon={<Add />} onClick={() => setIsAddModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
                Agregar intervención
              </Button>
            )}
          </>
        }
      />

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable {...purchaseTableStyle} columns={columns} data={records || []} />
      </Paper>

      {isAddModalOpen && interventionTypes && (
        <AddMaintenanceRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSave}
          interventionTypes={interventionTypes}
          vehicleId={Number(id)}
        />
      )}
    </Container>
  )
}

export default MaintenanceRecords
