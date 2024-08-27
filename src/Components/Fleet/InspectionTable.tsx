import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Modal,
  Stack
} from '@mui/material'
import { api } from '../../config'
import { useNavigate, useParams } from 'react-router-dom'
import { InspectionHistory } from './types'
import { format } from 'date-fns'
import {
  ArrowBack,
  CheckCircle,
  Error,
  Visibility,
  Warning
} from '@mui/icons-material'
import InspectionSummary from './InspectionSummary'

const apiUrl = api()

const fetchInspections = async (
  vehicleId: number
): Promise<InspectionHistory[]> => {
  const { data } = await axios.get(
    `${apiUrl}/vehicles/${vehicleId}/inspections`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    }
  )
  return data
}

const getConditionIcon = (condition: string) => {
  switch (condition) {
    case 'good':
      return <CheckCircle sx={{ color: 'green' }} />
    case 'fair':
      return <Warning sx={{ color: 'orange' }} />
    case 'poor':
    case 'low':
      return <Error sx={{ color: 'red' }} />
    default:
      return null
  }
}

const InspectionsTable = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspections, setInspections] = useState<InspectionHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedInspection, setSelectedInspection] =
    useState<InspectionHistory | null>(null)
  const [openModal, setOpenModal] = useState<boolean>(false)

  useEffect(() => {
    const loadInspections = async () => {
      try {
        if (id) {
          const data = await fetchInspections(Number(id))
          setInspections(data)
        }
      } catch (error) {
        console.error('Error fetching inspections:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInspections()
  }, [id])

  const columns = useMemo<MRT_ColumnDef<InspectionHistory>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 50 },
      {
        accessorKey: 'inspectionType',
        header: 'Tipo de Inspección',
        size: 150
      },
      {
        accessorKey: 'inspectionDate',
        header: 'Fecha de Inspección',
        size: 150,
        Cell: ({ row }) =>
          format(new Date(row.getValue('inspectionDate')), 'yyyy-MM-dd')
      },
      {
        accessorKey: 'trip.purpose',
        header: 'Proposito del viaje',
        size: 150
      },
      {
        accessorKey: 'summary',
        header: 'Estado General',
        size: 150,
        Cell: ({ row }) => {
          const {
            tireCondition,
            brakeCondition,
            fluidLevels,
            lightsCondition
          } = row.original

          const conditions = [
            tireCondition,
            brakeCondition,
            fluidLevels,
            lightsCondition
          ]
          const worstCondition = conditions.reduce((worst, condition) => {
            if (
              condition.toLocaleLowerCase() === 'poor' ||
              condition.toLocaleLowerCase() === 'low'
            )
              return 'poor'
            if (condition.toLocaleLowerCase() === 'fair')
              return worst === 'good' ? worst : 'fair'

            return worst
          }, 'good')

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {getConditionIcon(worstCondition)}
            </Box>
          )
        }
      }
    ],
    []
  )

  const handleInpectionVisibility = (inspection: InspectionHistory) => {
    setSelectedInspection(inspection)
    setOpenModal(true)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction='row' spacing={2} mb={2}>
        <IconButton onClick={() => navigate('/fleet')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant='h4' gutterBottom>
          Reportes de Inspección
        </Typography>
      </Stack>
      {loading ? (
        <Typography variant='body1'>Cargando...</Typography>
      ) : (
        <>
          <MaterialReactTable
            columns={columns}
            data={inspections}
            enableColumnOrdering
            enableSorting
            enablePagination={false}
            enableColumnFilters={false}
            enableEditing={true}
            initialState={{ columnVisibility: { id: false } }} // Oculta columnas no deseadas
            renderRowActions={({ row }) => (
              <Box sx={{ display: 'flex', gap: '1rem' }}>
                <Tooltip arrow placement='right' title='Ver'>
                  <IconButton
                    onClick={() => handleInpectionVisibility(row.original)}
                  >
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          />
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4
              }}
            >
              {selectedInspection && (
                <InspectionSummary inspection={selectedInspection} />
              )}
            </Box>
          </Modal>
        </>
      )}
    </Box>
  )
}

export default InspectionsTable
