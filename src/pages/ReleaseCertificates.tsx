import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip
} from '@mui/material'
import {
  AssignmentTurnedInOutlined,
  CloudUploadOutlined,
  FactCheckOutlined,
  FileDownloadOutlined,
  PendingActionsOutlined,
  VerifiedOutlined,
  VisibilityOutlined,
  WarningAmberRounded
} from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { MRT_ColumnDef, MRT_PaginationState } from 'material-react-table'
import { downloadPrivateFile } from '@utils/downloadBlob'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import ReleaseDetailDialog from 'src/Components/ReleaseCertificates/ReleaseDetailDialog'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import ReleaseUploadDialog from 'src/Components/ReleaseCertificates/ReleaseUploadDialog'
import {
  RELEASE_KIND_LABELS,
  RELEASE_STATUS_LABELS,
  ReleaseCertificate,
  ReleaseKind,
  ReleaseStatus
} from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'
import {
  releaseFileUrl,
  useReleaseCertificates
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { userStore } from 'src/store/userStore'
import { notify } from 'src/utils/notify'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 350

const STATUS_CARDS: {
  status: ReleaseStatus
  tone: 'orange' | 'red' | 'teal' | 'blue' | 'green'
  icon: React.ReactElement
}[] = [
  {
    status: 'pendiente_revision',
    tone: 'orange',
    icon: <PendingActionsOutlined />
  },
  { status: 'requiere_ajustes', tone: 'red', icon: <WarningAmberRounded /> },
  { status: 'verificado', tone: 'teal', icon: <FactCheckOutlined /> },
  { status: 'firmado', tone: 'blue', icon: <VerifiedOutlined /> },
  { status: 'liberado', tone: 'green', icon: <AssignmentTurnedInOutlined /> }
]

const formatDate = (value: string | null) =>
  value ? value.split('-').reverse().join('/') : '—'

const ReleaseCertificates: React.FC = () => {
  const $userStore = useStore(userStore)
  const canUpload = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD
  )

  const [status, setStatus] = useState<ReleaseStatus | undefined>()
  const [kind, setKind] = useState<ReleaseKind | ''>('')
  const [withAnomalies, setWithAnomalies] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewingId, setViewingId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(timer)
  }, [searchInput])

  // Cualquier filtro nuevo vuelve a la primera página.
  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [status, kind, withAnomalies, search])

  const { data, isLoading, isFetching } = useReleaseCertificates({
    status,
    kind,
    search,
    withAnomalies,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  })

  const columns = useMemo<MRT_ColumnDef<ReleaseCertificate>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: 'Número',
        size: 190,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {row.original.documentNumber ?? 'Sin número'}
            {row.original.anomalies.length > 0 && (
              <Tooltip
                title={row.original.anomalies.map((a) => a.message).join('. ')}
              >
                <WarningAmberRounded
                  fontSize='small'
                  sx={{ color: '#d97706' }}
                  aria-label={`${row.original.anomalies.length} por revisar`}
                />
              </Tooltip>
            )}
          </Box>
        )
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 190,
        Cell: ({ cell }) => (
          <ReleaseStatusPill status={cell.getValue<ReleaseStatus>()} />
        )
      },
      {
        accessorKey: 'kind',
        header: 'Tipo',
        size: 110,
        Cell: ({ cell }) => (
          <Chip
            size='small'
            label={RELEASE_KIND_LABELS[cell.getValue<ReleaseKind>()]}
          />
        )
      },
      {
        id: 'customer',
        header: 'Cliente',
        size: 240,
        accessorFn: (row) => row.customer?.nombre ?? row.customerName ?? '—'
      },
      { accessorKey: 'instrument', header: 'Instrumento', size: 210 },
      { accessorKey: 'serie', header: 'Serie', size: 150 },
      {
        accessorKey: 'calibrationDate',
        header: 'Calibración',
        size: 120,
        Cell: ({ cell }) => formatDate(cell.getValue<string | null>())
      },
      {
        id: 'uploader',
        header: 'Cargado por',
        size: 160,
        accessorFn: (row) => row.uploader?.nombre ?? '—'
      },
      {
        accessorKey: 'createdAt',
        header: 'Cargado',
        size: 130,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString('es-CO')
      }
    ],
    []
  )

  const uploadButton = canUpload && (
    <Button
      variant='contained'
      startIcon={<CloudUploadOutlined />}
      onClick={() => setUploadOpen(true)}
      sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00ACC1' } }}
    >
      Cargar certificado
    </Button>
  )

  const hasFilters = Boolean(status || kind || withAnomalies || search)

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Certificados a liberar'
        subtitle='Revisión de los certificados cargados antes de pasar al equipo del cliente'
        icon={<FactCheckOutlined />}
        actions={uploadButton || undefined}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATUS_CARDS.map(({ status: value, tone, icon }) => (
          <Grid item xs={6} md={4} lg key={value}>
            <LmsStatCard
              label={RELEASE_STATUS_LABELS[value]}
              value={data?.counts[value] ?? 0}
              icon={icon}
              tone={tone}
              active={status === value}
              onClick={() => setStatus(status === value ? undefined : value)}
            />
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 2
        }}
      >
        <TextField
          size='small'
          label='Buscar'
          placeholder='Número, cliente, instrumento o serie'
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          sx={{ minWidth: 280 }}
        />
        <TextField
          select
          size='small'
          label='Tipo'
          value={kind}
          onChange={(event) => setKind(event.target.value as ReleaseKind | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value=''>Todos</MenuItem>
          {(Object.keys(RELEASE_KIND_LABELS) as ReleaseKind[]).map((value) => (
            <MenuItem key={value} value={value}>
              {RELEASE_KIND_LABELS[value]}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={withAnomalies}
              onChange={(event) => setWithAnomalies(event.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#00897B' },
                '& .MuiSwitch-track': {
                  bgcolor: withAnomalies ? '#00BFA5' : undefined
                }
              }}
            />
          }
          label='Solo con rarezas por revisar'
        />
        {hasFilters && (
          <Button
            onClick={() => {
              setStatus(undefined)
              setKind('')
              setWithAnomalies(false)
              setSearchInput('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </Box>

      {!isLoading && data?.total === 0 && !hasFilters ? (
        <EmptyState
          icon={<CloudUploadOutlined />}
          title='Aún no hay certificados cargados'
          hint={
            canUpload
              ? 'Suelta los PDF con el botón Cargar certificado y el sistema los lee.'
              : 'Cuando se cargue uno aparecerá aquí.'
          }
          action={uploadButton || undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          itemLabel={['certificado', 'certificados']}
          enableGlobalFilter={false}
          manualPagination
          rowCount={data?.total ?? 0}
          onPaginationChange={setPagination}
          state={{ pagination, isLoading, showProgressBars: isFetching }}
          muiTablePaginationProps={{ rowsPerPageOptions: [25, 50, 100] }}
          enableRowActions
          positionActionsColumn='last'
          displayColumnDefOptions={{
            'mrt-row-actions': { header: 'Acciones', size: 110 }
          }}
          muiTableBodyRowProps={({ row }) => ({
            onDoubleClick: () => setViewingId(row.original.id),
            sx: { cursor: 'pointer' }
          })}
          renderRowActions={({ row }) => {
            const certificate = row.original
            const label =
              certificate.documentNumber ?? `certificado ${certificate.id}`
            return (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title='Revisar'>
                  <IconButton
                    aria-label={`Revisar ${label}`}
                    sx={{ color: '#00695C' }}
                    onClick={() => setViewingId(certificate.id)}
                  >
                    <VisibilityOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Descargar PDF'>
                  <IconButton
                    aria-label={`Descargar PDF de ${label}`}
                    onClick={() =>
                      downloadPrivateFile(
                        releaseFileUrl(certificate.id),
                        `${label}.pdf`
                      ).catch(() => notify.error('No se pudo descargar el PDF'))
                    }
                  >
                    <FileDownloadOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }}
        />
      )}

      <ReleaseUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <ReleaseDetailDialog
        certificateId={viewingId}
        onClose={() => setViewingId(null)}
      />
    </Container>
  )
}

export default ReleaseCertificates
