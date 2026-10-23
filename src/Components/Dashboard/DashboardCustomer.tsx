import { useMemo, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  IconButton,
  Skeleton,
  Avatar,
  Tooltip
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Error as ErrorIcon,
  SimCardDownloadOutlined,
  TaskAltOutlined,
  VisibilityOutlined,
  Warning as WarningIcon
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import { differenceInDays, format } from 'date-fns'
import { useCertificatesNextToExpire } from 'src/hooks/dashboard/useCertificatesDue'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { FileData } from '../TableFiles'
import { useParams, useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import DataTable from '../Common/DataTable'
import EmptyState from '../Common/EmptyState'
import StatusPill, { StatusPillTone } from '../Common/StatusPill'
import { bigToast } from '../ExcelManipulation/Utils'
import LmsPageHeader from '../lms/admin/LmsPageHeader'
import LmsStatCard from '../lms/admin/LmsStatCard'

type FilterType = 'all' | 'warning' | 'expired'

const FILTER_FILE_SUFFIX: Record<FilterType, string> = {
  all: '',
  warning: '-proximos-vencer',
  expired: '-vencidos'
}

/** Estado de un certificado según los días que faltan (o pasaron) para su vencimiento. */
const getCertificateStatus = (
  cert: FileData
): {
  kind: FilterType | 'vigente'
  tone: StatusPillTone
  label: string
  daysText: string
  days: number
} => {
  const days = differenceInDays(new Date(cert.nextCalibrationDate), new Date())
  if (days < 0) {
    return {
      kind: 'expired',
      tone: 'error',
      label: 'Vencido',
      daysText: `hace ${Math.abs(days).toLocaleString('es-CO')} ${Math.abs(days) === 1 ? 'día' : 'días'}`,
      days
    }
  }
  if (days <= 30) {
    return {
      kind: 'warning',
      tone: 'warning',
      label: 'Próximo a vencer',
      daysText:
        days === 0 ? 'vence hoy' : `en ${days} ${days === 1 ? 'día' : 'días'}`,
      days
    }
  }
  return {
    kind: 'vigente',
    tone: 'success',
    label: 'Vigente',
    daysText: `en ${days.toLocaleString('es-CO')} días`,
    days
  }
}

const formatDate = (value?: string | Date | null) =>
  value ? format(new Date(value), 'dd/MM/yyyy') : '—'

/**
 * Certificados de un cliente que requieren atención: vencidos y por vencer
 * en 30 días. El personal interno entra desde el inicio; el cliente ve el
 * suyo como pantalla principal.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const customerId: number | null =
    $userStore.customer?.id || id ? $userStore.customer?.id || Number(id) : null
  const { data: tableData = [], isLoading: loading } =
    useCertificatesNextToExpire<FileData>(customerId, {
      onError: (error) => {
        console.error('Error fetching file data:', error)
        bigToast('No se pudieron cargar los certificados del cliente', 'error')
      }
    })
  // Información del cliente tomada del primer registro
  const customerInfo: any = tableData.length > 0 ? tableData[0].customer : null
  const [filterType, setFilterType] = useState<FilterType>('all')

  const counts = useMemo(() => {
    let warning = 0
    let expired = 0
    tableData.forEach((cert) => {
      const { kind } = getCertificateStatus(cert)
      if (kind === 'warning') warning++
      else if (kind === 'expired') expired++
    })
    return { all: tableData.length, warning, expired }
  }, [tableData])

  const filteredData = useMemo(
    () =>
      filterType === 'all'
        ? tableData
        : tableData.filter(
            (cert) => getCertificateStatus(cert).kind === filterType
          ),
    [tableData, filterType]
  )

  const toggleFilter = (next: FilterType) =>
    setFilterType((current) => (current === next ? 'all' : next))

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      bigToast('No hay certificados para exportar', 'info')
      return
    }

    const XLSX = await import('xlsx')

    const exportData = filteredData.map((row) => {
      const status = getCertificateStatus(row)
      return {
        Compañía: row.customer?.nombre || '',
        Equipo: row.device?.name || '',
        'Tipo de Certificado': row.certificateType?.name || '',
        Ciudad: row.city,
        Ubicación: row.location,
        Sede: row.sede,
        'Activo Fijo': row.activoFijo,
        Serie: row.serie,
        'Fecha de Calibración': row.calibrationDate
          ? format(new Date(row.calibrationDate), 'dd/MM/yyyy')
          : '',
        'Próxima Fecha de Calibración': row.nextCalibrationDate
          ? format(new Date(row.nextCalibrationDate), 'dd/MM/yyyy')
          : '',
        Estado: status.label,
        'Días Restantes': status.daysText
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' })

    const fileName = `${customerInfo?.nombre || 'Cliente'}-certificados${FILTER_FILE_SUFFIX[filterType]}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    saveAs(data, fileName)
    bigToast('Excel descargado', 'success')
  }

  const columns = useMemo<MRT_ColumnDef<FileData>[]>(
    () => [
      {
        id: 'equipo',
        header: 'Equipo',
        size: 280,
        accessorFn: (row) => row.device?.name || '',
        Cell: ({ row }) => {
          const name = row.original.device?.name || 'N/A'
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#00BFA5',
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                {name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='body2' fontWeight={600}>
                  {name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Serie {row.original.serie || '—'}
                </Typography>
              </Box>
            </Box>
          )
        }
      },
      {
        id: 'ubicacion',
        header: 'Ubicación',
        size: 260,
        accessorFn: (row) =>
          [row.city, row.location, row.sede].filter(Boolean).join(' '),
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>{row.original.city || '—'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {[row.original.location, row.original.sede]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        id: 'ultima',
        header: 'Última calibración',
        size: 150,
        accessorFn: (row) =>
          row.calibrationDate ? new Date(row.calibrationDate).getTime() : 0,
        Cell: ({ row }) => formatDate(row.original.calibrationDate)
      },
      {
        id: 'proxima',
        header: 'Próxima calibración',
        size: 170,
        // Se ordena por la fecha real, no por el texto
        accessorFn: (row) => new Date(row.nextCalibrationDate).getTime(),
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>
              {formatDate(row.original.nextCalibrationDate)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {getCertificateStatus(row.original).daysText}
            </Typography>
          </Box>
        )
      },
      {
        id: 'estado',
        header: 'Estado',
        size: 170,
        accessorFn: (row) => getCertificateStatus(row).days,
        Cell: ({ row }) => {
          const status = getCertificateStatus(row.original)
          return (
            <StatusPill size='small' tone={status.tone} label={status.label} />
          )
        }
      },
      {
        id: 'tipo',
        header: 'Tipo',
        size: 160,
        accessorFn: (row) => row.certificateType?.name || '',
        Cell: ({ cell }) => cell.getValue<string>() || '—'
      }
    ],
    []
  )

  if (loading) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Skeleton variant='circular' width={48} height={48} sx={{ mr: 2 }} />
          <Skeleton variant='text' width={400} height={40} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Skeleton
                variant='rectangular'
                height={78}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton
          variant='rectangular'
          height={400}
          sx={{ borderRadius: '16px' }}
        />
      </Container>
    )
  }

  const backButton = id ? (
    <Tooltip title='Volver'>
      <IconButton
        aria-label='Volver'
        onClick={() => navigate(-1)}
        sx={{ border: '1px solid #e5e7eb', borderRadius: '10px' }}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  ) : null

  if (tableData.length === 0) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <LmsPageHeader
          title={customerInfo?.nombre || 'Certificados'}
          subtitle='Certificados vencidos o próximos a vencer'
          icon={<BusinessIcon />}
          actions={backButton}
        />
        <EmptyState
          icon={<TaskAltOutlined />}
          title='Certificados al día'
          hint='Todos los certificados están vigentes: no hay vencidos ni próximos a vencer.'
        />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title={customerInfo?.nombre || 'Certificados'}
        subtitle='Certificados vencidos o próximos a vencer (dentro de 30 días)'
        icon={<BusinessIcon />}
        actions={
          <>
            {backButton}
            <Button
              variant='outlined'
              startIcon={<SimCardDownloadOutlined />}
              onClick={handleExportExcel}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e5e7eb',
                color: '#374151',
                bgcolor: '#fff',
                '&:hover': {
                  borderColor: '#00897B',
                  color: '#00695C',
                  bgcolor: '#E0F7F4'
                }
              }}
            >
              Exportar Excel
            </Button>
          </>
        }
      />

      {/* Los tres indicadores filtran la tabla; el activo se puede quitar con otro clic */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Todos'
            value={counts.all}
            icon={<AssignmentIcon />}
            tone='teal'
            caption={
              filterType === 'all' ? 'Mostrando todos' : 'Clic para ver todos'
            }
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Próximos a vencer'
            value={counts.warning}
            icon={<WarningIcon />}
            tone='orange'
            caption={
              filterType === 'warning' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={filterType === 'warning'}
            onClick={() => toggleFilter('warning')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Vencidos'
            value={counts.expired}
            icon={<ErrorIcon />}
            tone='red'
            caption={
              filterType === 'expired' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={filterType === 'expired'}
            onClick={() => toggleFilter('expired')}
          />
        </Grid>
      </Grid>

      <DataTable<FileData>
        columns={columns}
        data={filteredData}
        itemLabel={['certificado', 'certificados']}
        searchPlaceholder='Buscar por equipo, serie o ubicación'
        enableRowActions
        initialState={{
          // Primero lo que lleva más tiempo vencido
          sorting: [{ id: 'proxima', desc: false }],
          pagination: { pageIndex: 0, pageSize: 25 }
        }}
        muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50, 100] }}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () =>
            navigate(`/calibraciones/certificados/${row.original.id}`),
          sx: { cursor: 'pointer' }
        })}
        renderRowActions={({ row }) => (
          <Tooltip title='Ver certificado'>
            <IconButton
              size='small'
              aria-label={`Ver certificado de ${row.original.device?.name || 'equipo'}`}
              sx={{ color: '#00695C' }}
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/calibraciones/certificados/${row.original.id}`)
              }}
            >
              <VisibilityOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<TaskAltOutlined />}
            title='Ningún certificado coincide'
            hint='Prueba con otra búsqueda o quita el filtro de los indicadores.'
          />
        )}
      />
    </Container>
  )
}

export default Dashboard
