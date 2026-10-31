import { useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Container, Grid } from '@mui/material'
import {
  AccountBalanceWalletOutlined,
  CloudOutlined,
  DownloadOutlined,
  OpenInNewOutlined,
  Refresh as RefreshIcon,
  TrendingUpOutlined,
  VerifiedOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import {
  downloadPlatformInvoice,
  type PlatformBillingEntry,
  type PlatformInvoice,
  usePlatformBillingOverview
} from 'src/hooks/usePlatformBilling'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

const BILLING_URL = 'https://cloud.digitalocean.com/account/billing'

const STATUS_LABELS: Record<string, string> = {
  active: 'Al día',
  warning: 'Advertencia de pago',
  locked: 'Bloqueada'
}

const TYPE_LABELS: Record<string, string> = {
  Invoice: 'Factura',
  Payment: 'Pago',
  Credit: 'Crédito',
  Refund: 'Reembolso'
}

const money = (value?: string | null) => {
  const amount = Number(value)
  if (value === null || value === undefined || Number.isNaN(amount)) return '—'
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CO') : '—'

const handleDownload = async (uuid: string) => {
  try {
    await downloadPlatformInvoice(uuid)
  } catch (err) {
    notify.error(
      'No se pudo descargar la factura',
      getApiErrorReason(err) ?? undefined
    )
  }
}

const invoiceColumns: MRT_ColumnDef<PlatformInvoice>[] = [
  { accessorKey: 'period', header: 'Periodo' },
  {
    accessorKey: 'amount',
    header: 'Monto',
    Cell: ({ cell }) => money(cell.getValue<string>())
  },
  {
    id: 'pdf',
    header: 'PDF',
    enableSorting: false,
    Cell: ({ row }) => (
      <Button
        size='small'
        startIcon={<DownloadOutlined />}
        onClick={() => handleDownload(row.original.uuid)}
        sx={{ textTransform: 'none' }}
      >
        Descargar
      </Button>
    )
  }
]

const historyColumns: MRT_ColumnDef<PlatformBillingEntry>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
    Cell: ({ cell }) => formatDate(cell.getValue<string>())
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    Cell: ({ cell }) => (
      <Chip
        size='small'
        variant='outlined'
        label={TYPE_LABELS[cell.getValue<string>()] ?? cell.getValue<string>()}
      />
    )
  },
  { accessorKey: 'description', header: 'Descripción' },
  {
    accessorKey: 'amount',
    header: 'Monto',
    Cell: ({ cell }) => money(cell.getValue<string>())
  }
]

const PlatformBillingPage = () => {
  const { data, isLoading, isFetching, error, refresh } =
    usePlatformBillingOverview()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
    } catch (err) {
      notify.error('No se pudo actualizar', getApiErrorReason(err) ?? undefined)
    } finally {
      setRefreshing(false)
    }
  }

  const invoices = useMemo(() => data?.invoices ?? [], [data])
  const history = useMemo(() => data?.history ?? [], [data])
  const hasProblem = Boolean(data?.hasProblem)
  const statusLabel = data?.status
    ? STATUS_LABELS[data.status] ?? data.status
    : '—'

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Facturación de la nube'
        subtitle='Estado de pago, facturas y movimientos de DigitalOcean'
        icon={<CloudOutlined />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing || isFetching}
              sx={{ textTransform: 'none' }}
            >
              Actualizar
            </Button>
            <Button
              variant='contained'
              endIcon={<OpenInNewOutlined />}
              href={BILLING_URL}
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                textTransform: 'none',
                bgcolor: '#00BFA5',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Abrir DigitalOcean
            </Button>
          </>
        }
      />

      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {getApiErrorReason(error)}
        </Alert>
      ) : null}

      {data && !data.configured ? (
        <Alert severity='info' sx={{ mb: 3 }}>
          Falta configurar el token de DigitalOcean (DO_API_TOKEN) en el
          servidor.
        </Alert>
      ) : null}

      {hasProblem && data?.message ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {data.message}
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Estado de la cuenta'
            value={statusLabel}
            icon={<VerifiedOutlined />}
            tone={hasProblem ? 'red' : 'green'}
            compact
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Saldo'
            value={money(data?.accountBalance)}
            icon={<AccountBalanceWalletOutlined />}
            tone='blue'
            compact
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Consumo del mes'
            value={money(data?.monthToDateUsage)}
            icon={<TrendingUpOutlined />}
            tone='teal'
            compact
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Factura en curso'
            value={money(data?.invoicePreview?.amount)}
            caption={data?.invoicePreview?.period}
            icon={<CloudOutlined />}
            tone='orange'
            compact
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          itemLabel={['factura', 'facturas']}
          searchPlaceholder='Buscar facturas'
          initialState={{ density: 'compact' }}
          state={{ isLoading, showProgressBars: isFetching }}
        />
      </Box>

      <DataTable
        columns={historyColumns}
        data={history}
        itemLabel={['movimiento', 'movimientos']}
        searchPlaceholder='Buscar movimientos'
        initialState={{
          density: 'compact',
          sorting: [{ id: 'date', desc: true }]
        }}
        state={{ isLoading, showProgressBars: isFetching }}
      />
    </Container>
  )
}

export default PlatformBillingPage
