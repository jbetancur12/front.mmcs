import { useEffect, useMemo, useState } from 'react'

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  Modal
} from '@mui/material'

import { useNavigate, useParams } from 'react-router-dom'
import { InspectionHistory } from './types'
import { format } from 'date-fns'
import {
  ArrowBack,
  CheckCircle,
  Error,
  Summarize,
  Visibility,
  Warning
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import InspectionSummary from './InspectionSummary'
import useAxiosPrivate from '@utils/use-axios-private'

const fetchInspections = async (
  vehicleId: number
): Promise<InspectionHistory[]> => {
  const axiosPrivate = useAxiosPrivate()
  const { data } = await axiosPrivate.get(
    `/vehicles/${vehicleId}/inspections`,
    {}
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
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/fleet')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a flota
      </Button>

      <LmsPageHeader
        title='Reportes de Inspección'
        subtitle='Inspecciones preoperacionales registradas para este vehículo'
        icon={<Summarize />}
      />
      {loading ? (
        <Typography variant='body1'>Cargando...</Typography>
      ) : (
        <>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            {...purchaseTableStyle}
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
          </Paper>
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
    </Container>
  )
}

export default InspectionsTable
