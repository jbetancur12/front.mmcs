import React, { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
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
  Tooltip,
  useMediaQuery,
  useTheme
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
import { useSearchParams } from 'react-router-dom'
import {
  MRT_ColumnDef,
  MRT_PaginationState,
  MRT_RowSelectionState
} from 'material-react-table'
import { downloadPrivateFile } from '@utils/downloadBlob'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import ReleaseDetailDialog from 'src/Components/ReleaseCertificates/ReleaseDetailDialog'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import CalibrationNotificationBell from 'src/pages/calibration-services/CalibrationNotificationBell'
import ReleaseRulesDialog from 'src/Components/ReleaseCertificates/ReleaseRulesDialog'
import ReleaseDriveDialog from 'src/Components/ReleaseCertificates/ReleaseDriveDialog'
import ReleaseSignatureDialog from 'src/Components/ReleaseCertificates/ReleaseSignatureDialog'
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
  useMySignature,
  useReleaseCertificates,
  useReleaseCustomerSearch,
  useReleaseUploaders,
  useSignReleaseCertificates
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { userStore } from 'src/store/userStore'
import { getApiErrorReason } from 'src/utils/apiError'
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

  const canSign = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_SIGN
  )
  const canManageDrive = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_DRIVE_MANAGE
  )
  const canManageRules = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_RULES
  )
  const canSeeBell = hasPermission(
    $userStore.permissions,
    PERMISSIONS.CALIBRATION_SERVICE_VIEW
  )
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [rulesOpen, setRulesOpen] = useState(false)
  const [driveOpen, setDriveOpen] = useState(false)
  const driveResult = new URLSearchParams(window.location.search).get('drive')
  const sign = useSignReleaseCertificates()
  const { data: mySignature } = useMySignature(canSign)
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [selection, setSelection] = useState<MRT_RowSelectionState>({})
  const [status, setStatus] = useState<ReleaseStatus | undefined>()
  const [kind, setKind] = useState<ReleaseKind | ''>('')
  const [withAnomalies, setWithAnomalies] = useState(false)
  const [withoutCustomer, setWithoutCustomer] = useState(false)
  const [customer, setCustomer] = useState<{
    id: number
    nombre: string
  } | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [uploadedBy, setUploadedBy] = useState<number | ''>('')
  const { data: customerOptions = [], isFetching: loadingCustomers } =
    useReleaseCustomerSearch(customerSearch)
  const { data: uploaders = [] } = useReleaseUploaders()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  // Los avisos de ajustes abren el certificado con ?id=
  const [searchParams, setSearchParams] = useSearchParams()
  const initialId = Number(searchParams.get('id'))
  const [viewingId, setViewingId] = useState<number | null>(
    Number.isInteger(initialId) && initialId > 0 ? initialId : null
  )

  // Google devuelve a esta pantalla con ?drive=connected o ?drive=error: se avisa y se abre la configuración.
  useEffect(() => {
    if (!driveResult) return
    if (driveResult === 'connected') {
      notify.success(
        'Cuenta de Google conectada',
        'Ahora pulsa «Probar conexión».'
      )
    } else {
      notify.error(
        'No se pudo conectar con Google',
        new URLSearchParams(window.location.search).get('reason') ?? undefined
      )
    }
    setDriveOpen(true)
    const next = new URLSearchParams(window.location.search)
    next.delete('drive')
    next.delete('reason')
    setSearchParams(next, { replace: true })
    // Solo al volver de Google.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }, [
    status,
    kind,
    withAnomalies,
    withoutCustomer,
    search,
    customer,
    uploadedBy
  ])

  const { data, isLoading, isFetching } = useReleaseCertificates({
    status,
    kind,
    search,
    withAnomalies,
    customerId: customer?.id ?? null,
    withoutCustomer,
    uploadedBy: uploadedBy === '' ? null : uploadedBy,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  })

  const columns = useMemo<MRT_ColumnDef<ReleaseCertificate>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: 'Número',
        size: isMobile ? 170 : 190,
        Cell: ({ row }) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flexWrap: 'wrap'
            }}
          >
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
            {isMobile && (
              <Box sx={{ width: '100%' }}>
                <ReleaseStatusPill status={row.original.status} />
                <Box
                  sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}
                >
                  {row.original.customer?.nombre ?? (
                    <Box
                      component='span'
                      sx={{ color: '#b45309', fontWeight: 600 }}
                    >
                      Cliente sin identificar ·{' '}
                      {row.original.customerName ?? 'sin nombre'}
                    </Box>
                  )}
                </Box>
              </Box>
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
        accessorFn: (row) => row.customer?.nombre ?? row.customerName ?? '—',
        Cell: ({ row }) =>
          row.original.customer ? (
            row.original.customer.nombre
          ) : (
            <Box>
              <Chip
                size='small'
                color='warning'
                variant='outlined'
                label='Cliente sin identificar'
              />
              <Box
                sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}
              >
                {row.original.customerName ?? 'Sin nombre en el PDF'}
              </Box>
            </Box>
          )
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
    [isMobile]
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

  const selectedIds = Object.keys(selection)
    .filter((key) => selection[key])
    .map(Number)

  const signSelected = () => {
    if (!mySignature?.configured) {
      notify.info(
        'Primero carga tu firma',
        'Se estampa en los certificados que firmas.'
      )
      setSignatureOpen(true)
      return
    }
    sign.mutate(selectedIds, {
      onSuccess: (results) => {
        const failed = results.filter((result) => !result.ok)
        if (failed.length === 0) {
          notify.success(
            results.length === 1
              ? 'Certificado firmado'
              : `${results.length} certificados firmados`
          )
        } else {
          notify.warning(
            `${results.length - failed.length} firmados, ${failed.length} no se pudieron firmar`,
            failed[0].error
          )
        }
        setSelection({})
      },
      onError: (error) =>
        notify.error('No se pudo firmar', getApiErrorReason(error) ?? undefined)
    })
  }

  const hasFilters = Boolean(
    status ||
      kind ||
      withAnomalies ||
      withoutCustomer ||
      search ||
      customer ||
      uploadedBy
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Certificados a liberar'
        subtitle='Revisión de los certificados cargados antes de pasar al equipo del cliente'
        icon={<FactCheckOutlined />}
        actions={
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            {canSeeBell && <CalibrationNotificationBell />}
            {canManageRules && (
              <Button variant='text' onClick={() => setRulesOpen(true)}>
                Reglas
              </Button>
            )}
            {canManageDrive && (
              <Button variant='text' onClick={() => setDriveOpen(true)}>
                Drive
              </Button>
            )}
            {canSign && (
              <Button variant='text' onClick={() => setSignatureOpen(true)}>
                Mi firma
              </Button>
            )}
            {canSign && selectedIds.length > 0 && (
              <Button
                variant='outlined'
                startIcon={<VerifiedOutlined />}
                disabled={sign.isLoading}
                onClick={signSelected}
              >
                Firmar{' '}
                {selectedIds.length === 1
                  ? 'el seleccionado'
                  : `${selectedIds.length} seleccionados`}
              </Button>
            )}
            {uploadButton || null}
          </Box>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATUS_CARDS.map(({ status: value, tone, icon }) => (
          <Grid item xs={6} md={4} lg key={value}>
            <LmsStatCard
              label={RELEASE_STATUS_LABELS[value]}
              value={data?.counts[value] ?? 0}
              icon={icon}
              tone={tone}
              compact={isMobile}
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
          sx={{ minWidth: 280, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
        />
        <Autocomplete
          size='small'
          options={customerOptions}
          value={customer}
          loading={loadingCustomers}
          getOptionLabel={(option) => option.nombre}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(all) => all}
          onChange={(_event, value) => setCustomer(value)}
          onInputChange={(_event, value, reason) => {
            if (reason === 'input') setCustomerSearch(value)
          }}
          noOptionsText='Escribe al menos 2 letras del cliente'
          sx={{ minWidth: 240, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Cliente'
              placeholder='Buscar cliente'
            />
          )}
        />
        <TextField
          select
          size='small'
          label='Cargado por'
          value={uploadedBy}
          onChange={(event) =>
            setUploadedBy(
              event.target.value === '' ? '' : Number(event.target.value)
            )
          }
          sx={{ minWidth: 180, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
        >
          <MenuItem value=''>Todos</MenuItem>
          {uploaders.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.nombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size='small'
          label='Tipo'
          value={kind}
          onChange={(event) => setKind(event.target.value as ReleaseKind | '')}
          sx={{ minWidth: 160, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
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
        <FormControlLabel
          control={
            <Switch
              checked={status === 'descartado'}
              onChange={(event) =>
                setStatus(event.target.checked ? 'descartado' : undefined)
              }
            />
          }
          label={`Ver descartados (${data?.counts.descartado ?? 0})`}
        />
        <FormControlLabel
          control={
            <Switch
              checked={withoutCustomer}
              onChange={(event) => setWithoutCustomer(event.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#b45309' },
                '& .MuiSwitch-track': {
                  bgcolor: withoutCustomer ? '#f59e0b' : undefined
                }
              }}
            />
          }
          label='Solo sin cliente identificado'
        />
        {hasFilters && (
          <Button
            onClick={() => {
              setStatus(undefined)
              setKind('')
              setWithAnomalies(false)
              setWithoutCustomer(false)
              setSearchInput('')
              setCustomer(null)
              setCustomerSearch('')
              setUploadedBy('')
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
          enableRowSelection={(row) =>
            canSign &&
            !isMobile &&
            row.original.status === 'verificado' &&
            row.original.kind === 'principal'
          }
          getRowId={(row) => String(row.id)}
          onRowSelectionChange={setSelection}
          manualPagination
          rowCount={data?.total ?? 0}
          onPaginationChange={setPagination}
          state={{
            pagination,
            showProgressBars: isFetching,
            rowSelection: selection,
            // En celular solo lo esencial: número, estado y cliente
            columnVisibility: isMobile
              ? {
                  status: false,
                  customer: false,
                  kind: false,
                  instrument: false,
                  serie: false,
                  calibrationDate: false,
                  uploader: false,
                  createdAt: false
                }
              : {}
          }}
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

      <ReleaseRulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
      <ReleaseDriveDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
      />
      <ReleaseSignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
      />
      <ReleaseUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <ReleaseDetailDialog
        certificateId={viewingId}
        onClose={() => {
          setViewingId(null)
          if (searchParams.has('id')) setSearchParams({}, { replace: true })
        }}
      />
    </Container>
  )
}

export default ReleaseCertificates
