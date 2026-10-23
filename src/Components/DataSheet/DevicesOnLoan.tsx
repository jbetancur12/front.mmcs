import { useDevicesOnLoan } from '@hooks/dataSheets/useDataSheets'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import { formatDateOnly } from '@utils/dateOnly'
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  LoginOutlined,
  SyncAlt,
  Inventory
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface Device {
  id: number
  equipmentName: string
  internalCode: string
  equipmentInOuts: EquipmentInOut[]
  observationsOut?: string | null // Add this to store the observation
  loanCustomer?: string | null // Cliente al que se le prestó (desde logística)
  loanService?: string | null // Servicio de calibración del préstamo
  loanDate?: string | null // Fecha de salida del préstamo
}

interface EquipmentInOut {
  id: number
  outReason: string
  outDate: string
  inDate: string
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string | null
  observationsOut: string | null
  registeredBy: string
  customer?: { id: number; nombre: string } | null
  service?: { id: number; serviceCode: string } | null
}

const DevicesOnLoan: React.FC = () => {
  const { data: devicesOnLoan, isLoading } = useDevicesOnLoan<Device>()
  const navigate = useNavigate()

  // Extract observationsOut from equipmentInOuts
  const data = useMemo<Device[]>(
    () =>
      (devicesOnLoan ?? []).map((device: Device) => ({
        ...device,
        observationsOut:
          device.equipmentInOuts.length > 0
            ? device.equipmentInOuts[0].observationsOut
            : null,
        loanCustomer: device.equipmentInOuts[0]?.customer?.nombre ?? null,
        loanService: device.equipmentInOuts[0]?.service?.serviceCode ?? null,
        loanDate: device.equipmentInOuts[0]?.outDate ?? null
      })),
    [devicesOnLoan]
  )

  const columns = useMemo<MRT_ColumnDef<Device>[]>(
    () => [
      {
        accessorKey: 'internalCode',
        header: 'Código interno',
        size: 130,
        Cell: ({ cell }: { cell: MRT_Cell<Device> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        accessorKey: 'equipmentName',
        header: 'Equipo',
        size: 220
      },
      {
        accessorKey: 'loanCustomer',
        header: 'Cliente',
        size: 200,
        Cell: ({ cell }: { cell: MRT_Cell<Device> }) =>
          cell.getValue<string | null>() || (
            <Typography variant='body2' color='text.secondary'>
              Sin registrar
            </Typography>
          )
      },
      {
        accessorKey: 'loanService',
        header: 'Servicio',
        size: 130,
        Cell: ({ cell }: { cell: MRT_Cell<Device> }) => {
          const value = cell.getValue<string | null>()
          return value ? (
            <Chip size='small' variant='outlined' label={value} />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Sin servicio
            </Typography>
          )
        }
      },
      {
        accessorKey: 'loanDate',
        header: 'Fecha de salida',
        size: 140,
        Cell: ({ cell }: { cell: MRT_Cell<Device> }) =>
          formatDateOnly(cell.getValue<string | null>()) ?? '—'
      },
      {
        accessorKey: 'observationsOut',
        header: 'Observaciones de salida',
        size: 260,
        Cell: ({ cell }: { cell: MRT_Cell<Device> }) => {
          const value = cell.getValue<string | null>()
          return value ? (
            <Tooltip title={value}>
              <Typography
                variant='body2'
                sx={{
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {value}
              </Typography>
            </Tooltip>
          ) : (
            '—'
          )
        }
      }
    ],
    []
  )

  const goToInOut = (row: Device) => navigate(`/datasheets/${row.id}/in-out`)

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Equipos en préstamo'
        subtitle='Equipos que salieron del laboratorio y aún no han regresado'
        icon={<SyncAlt />}
        actions={
          <Button
            variant='outlined'
            startIcon={<ArrowBack />}
            onClick={() => navigate('/datasheets')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#00695C',
              borderColor: '#00BFA5',
              '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
            }}
          >
            Volver
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='En préstamo'
            value={data.length}
            icon={<Inventory />}
            tone='orange'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={data}
        itemLabel={['equipo en préstamo', 'equipos en préstamo']}
        searchPlaceholder='Buscar equipos'
        enableRowActions
        state={{ isLoading }}
        initialState={{ density: 'compact' }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<SyncAlt />}
            title='No hay equipos en préstamo'
            hint='Cuando un equipo salga del laboratorio aparecerá aquí.'
          />
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Registrar entrada'>
              <IconButton
                size='small'
                aria-label={`Registrar entrada de ${row.original.internalCode}`}
                sx={{ color: '#00695C' }}
                onClick={() => goToInOut(row.original)}
              >
                <LoginOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => goToInOut(row.original),
          sx: { cursor: 'pointer' }
        })}
      />
    </Container>
  )
}

export default DevicesOnLoan
