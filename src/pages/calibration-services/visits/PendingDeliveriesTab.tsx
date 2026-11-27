import { useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Link, Typography } from '@mui/material'
import {
  MRT_ColumnDef,
  MRT_Row,
  MRT_RowSelectionState
} from 'material-react-table'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { Link as RouterLink } from 'react-router-dom'
import SignalLoader from 'src/Components/Common/SignalLoader'
import DataTable from '../../../Components/Common/DataTable'
import { usePendingDeliveries } from '../../../hooks/useCalibrationVisits'
import { PendingDelivery } from '../../../types/calibrationVisit'
import RegisterDeliveryDialog from './RegisterDeliveryDialog'
import { formatDay } from './visitUtils'

const canRegister = (row: PendingDelivery) =>
  row.released && !row.payment.blocked

const situation = (row: PendingDelivery) => {
  if (row.payment.blocked) return 'Esperando pago'
  return row.released ? 'Por entregar' : 'Por liberar'
}

/** Certificados revisados que todavía no le llegan al cliente. */
const PendingDeliveriesTab = () => {
  const { data, isLoading, isError, refetch } = usePendingDeliveries(true)
  const [selection, setSelection] = useState<MRT_RowSelectionState>({})
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => data?.certificates || [], [data])
  const selected = rows.filter(
    (row) => selection[String(row.id)] && canRegister(row)
  )

  const columns = useMemo<MRT_ColumnDef<PendingDelivery>[]>(
    () => [
      {
        id: 'certificate',
        header: 'Certificado',
        accessorFn: (r) => `${r.documentNumber || ''} ${r.instrument || ''}`,
        Cell: ({ row }: { row: MRT_Row<PendingDelivery> }) => (
          <Box>
            <Link
              component={RouterLink}
              to={`/release-certificates?id=${row.original.id}`}
              fontWeight={600}
              underline='hover'
            >
              {row.original.documentNumber || `Certificado ${row.original.id}`}
            </Link>
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
            >
              {[row.original.instrument, row.original.serie]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        id: 'customer',
        header: 'Cliente',
        accessorFn: (r) => `${r.customerName || ''} ${r.orderCode || ''}`,
        Cell: ({ row }: { row: MRT_Row<PendingDelivery> }) => (
          <Box>
            <Typography variant='body2'>
              {row.original.customerName || 'Sin cliente'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {[
                row.original.orderCode || 'Sin orden',
                row.original.hasPortal
                  ? 'usa la plataforma'
                  : 'sin usuario en la plataforma'
              ].join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        id: 'ready',
        header: 'Revisado el',
        accessorFn: (r) => r.readyOn,
        Cell: ({ row }: { row: MRT_Row<PendingDelivery> }) =>
          formatDay(row.original.readyOn)
      },
      {
        id: 'situation',
        header: 'Situación',
        accessorFn: situation,
        Cell: ({ row }: { row: MRT_Row<PendingDelivery> }) => (
          <Box>
            <Chip
              size='small'
              color={row.original.payment.blocked ? 'warning' : 'default'}
              label={situation(row.original)}
            />
            {row.original.payment.reason && (
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                {row.original.payment.reason}
              </Typography>
            )}
          </Box>
        )
      }
    ],
    []
  )

  if (isError)
    return (
      <Alert
        severity='error'
        action={<Button onClick={() => void refetch()}>Reintentar</Button>}
      >
        No pudimos cargar las entregas.
      </Alert>
    )
  if (isLoading) return <SignalLoader />

  return (
    <>
      <Alert severity='info' sx={{ mb: 2 }}>
        Marca los certificados ya liberados que enviaste o entregaste y pulsa
        «Registrar entrega». Los que están «Por liberar» se liberan primero en
        Certificados a liberar.
      </Alert>
      <DataTable<PendingDelivery>
        columns={columns}
        data={rows}
        itemLabel={['certificado', 'certificados']}
        searchPlaceholder='Buscar certificado, cliente u orden'
        enableRowSelection={(row) => canRegister(row.original)}
        getRowId={(row) => String(row.id)}
        state={{ rowSelection: selection }}
        onRowSelectionChange={setSelection}
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            startIcon={<LocalShippingOutlinedIcon />}
            disabled={!selected.length}
            onClick={() => setOpen(true)}
          >
            {selected.length
              ? `Registrar entrega (${selected.length})`
              : 'Registrar entrega'}
          </Button>
        )}
      />
      <RegisterDeliveryDialog
        open={open}
        certificates={selected}
        onClose={() => setOpen(false)}
        onDone={() => setSelection({})}
      />
    </>
  )
}

export default PendingDeliveriesTab
