import { useEffect, useMemo, useState } from 'react'
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import { Add, Delete, Lock, PictureAsPdf, Visibility } from '@mui/icons-material'
import {
  techErrorMessage,
  techPaths,
  useAnswerReview,
  useDeleteReport,
  usePendingReviews,
  useProgram,
  useQuarterly,
  useReports,
  useSaveProgram
} from '@hooks/useTechManagement'
import { CommitteeMember, SurveillanceProgram, SurveillanceReport } from 'src/types/techManagement'
import {
  ACTIVITY_TYPE_LABELS,
  confirmAction,
  DEADLINE_STATUS,
  EVENT_TYPE_LABELS,
  formatDate,
  INDEPENDENCE_NOTE,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  REPORT_STATUS,
  SEVERITY_LABELS,
  StatusChip,
  TEAL,
  tableStyleProps
} from './techUi'
import { useTechAccess } from './useTechAccess'
import ReportFormDialog from './ReportFormDialog'
import ReportDetailDialog from './ReportDetailDialog'

type Section = 'reportes' | 'revisiones' | 'programa' | 'trimestral'

const cardSx = { borderRadius: '16px', border: '1px solid #e5e7eb' }

// ---------- Reportes

const ReportsSection = ({ customerId, canWrite }: { customerId: string; canWrite: boolean }) => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<SurveillanceReport | null | undefined>(undefined)
  const [viewing, setViewing] = useState<number | null>(null)
  const { data, isLoading, isFetching, isError } = useReports(customerId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: search || undefined,
    status: status || undefined
  })
  const remove = useDeleteReport(customerId)

  const handleDelete = async (report: SurveillanceReport) => {
    if (!(await confirmAction(`¿Eliminar el borrador ${report.code}?`, undefined, 'Eliminar'))) return
    try {
      await remove.mutateAsync(report.id)
      notifySuccess('Reporte eliminado')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo eliminar el reporte'))
    }
  }

  const columns = useMemo<MRT_ColumnDef<SurveillanceReport>[]>(
    () => [
      { header: 'Código', id: 'code', size: 120, Cell: ({ row }) => <Typography fontWeight={600} fontSize={14} noWrap>{row.original.code}</Typography> },
      { header: 'Detectado', id: 'detectedAt', size: 110, accessorFn: (row) => formatDate(row.detectedAt) },
      {
        header: 'Equipo',
        id: 'equipment',
        size: 180,
        accessorFn: (row) => (row.equipment ? [row.equipment.name, row.equipment.serie].filter(Boolean).join(' · ') : '—')
      },
      { header: 'Tipo', id: 'eventType', size: 110, accessorFn: (row) => (row.eventType ? EVENT_TYPE_LABELS[row.eventType] : 'Por clasificar') },
      { header: 'Gravedad', id: 'severity', size: 110, accessorFn: (row) => (row.severity ? SEVERITY_LABELS[row.severity] : '—') },
      { header: 'Plazo INVIMA', id: 'reportDeadline', size: 110, accessorFn: (row) => formatDate(row.reportDeadline) },
      {
        header: 'Semáforo',
        id: 'deadlineStatus',
        size: 130,
        Cell: ({ row }) => (row.original.deadlineStatus ? <StatusChip {...DEADLINE_STATUS[row.original.deadlineStatus]} /> : null)
      },
      { header: 'Estado', id: 'status', size: 150, Cell: ({ row }) => <StatusChip {...REPORT_STATUS[row.original.status]} /> }
    ],
    []
  )

  return (
    <>
      <MaterialReactTable
        columns={columns}
        data={data?.items ?? []}
        localization={MRT_Localization_ES}
        getRowId={(row, index) => (row?.id != null ? String(row.id) : `cargando-${index}`)}
        manualPagination
        manualFiltering
        rowCount={data?.total ?? 0}
        onPaginationChange={setPagination}
        onGlobalFilterChange={(value: string | undefined) => {
          setSearch(value || '')
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        state={{
          isLoading,
          showProgressBars: isFetching,
          pagination,
          globalFilter: search,
          showAlertBanner: isError,
          columnPinning: { right: ['mrt-row-actions'] }
        }}
        initialState={{ showGlobalFilter: true, density: 'comfortable' }}
        muiToolbarAlertBannerProps={isError ? { color: 'error', children: 'No se pudieron cargar los reportes.' } : undefined}
        enablePinning
        enableColumnFilters={false}
        enableSorting={false}
        enableColumnActions={false}
        enableRowActions
        positionActionsColumn='last'
        displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 100 } }}
        {...tableStyleProps}
        renderTopToolbarCustomActions={() => (
          <Box display='flex' gap={1} flexWrap='wrap' alignItems='center'>
            <TextField select size='small' label='Estado' value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value=''>Todos</MenuItem>
              {Object.entries(REPORT_STATUS).map(([value, meta]) => (
                <MenuItem key={value} value={value}>
                  {meta.label}
                </MenuItem>
              ))}
            </TextField>
            {canWrite && (
              <Button variant='contained' size='small' startIcon={<Add />} onClick={() => setEditing(null)} sx={primaryButtonSx}>
                Nuevo reporte
              </Button>
            )}
          </Box>
        )}
        renderRowActions={({ row }) => (
          <Box display='flex' gap={0.5}>
            <Tooltip title='Ver detalle, análisis y acciones'>
              <IconButton size='small' sx={{ color: TEAL }} onClick={() => setViewing(row.original.id)}>
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            {canWrite && row.original.status === 'borrador' && (
              <Tooltip title='Eliminar borrador'>
                <IconButton size='small' color='error' onClick={() => handleDelete(row.original)}>
                  <Delete fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
        renderEmptyRowsFallback={() => (
          <Box py={6} textAlign='center' color='text.secondary'>
            <Typography>No hay reportes de tecnovigilancia.</Typography>
          </Box>
        )}
      />
      <ReportFormDialog customerId={customerId} open={editing !== undefined} report={editing} onClose={() => setEditing(undefined)} />
      <ReportDetailDialog
        customerId={customerId}
        reportId={viewing}
        canWrite={canWrite}
        onEdit={(report) => {
          setViewing(null)
          setEditing(report)
        }}
        onClose={() => setViewing(null)}
      />
    </>
  )
}

// ---------- Puente servicio -> tecnovigilancia

const ReviewsSection = ({ customerId, canWrite }: { customerId: string; canWrite: boolean }) => {
  const { data: reviews = [], isLoading } = usePendingReviews(customerId)
  const answer = useAnswerReview(customerId)

  const handleAnswer = async (activityId: number, affected: boolean) => {
    try {
      const result = await answer.mutateAsync({ activityId, affected })
      notifySuccess(result.report ? `Se creó el borrador ${result.report.code}` : 'Respuesta registrada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo registrar la respuesta'))
    }
  }

  if (isLoading) return <CircularProgress />
  if (reviews.length === 0) {
    return <Alert severity='success'>No hay servicios pendientes de revisión.</Alert>
  }
  return (
    <Stack spacing={2}>
      <Typography variant='body2' color='text.secondary'>
        Cada servicio no conforme o correctivo pregunta si la falla pudo afectar a un paciente o usuario. Si la respuesta es
        sí, se crea un reporte en borrador con los datos del equipo y del servicio.
      </Typography>
      {reviews.map((activity) => (
        <Card key={activity.id} elevation={0} sx={cardSx}>
          <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box flex={1} minWidth={240}>
              <Typography fontWeight={600}>
                {activity.equipment?.name} {activity.equipment?.serie && `· Serie ${activity.equipment.serie}`}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {ACTIVITY_TYPE_LABELS[activity.type]} del {formatDate(activity.executedAt)}
                {activity.result === 'no_conforme' && ' · No conforme'}
                {activity.ticket && ` · Ticket ${activity.ticket.ticketCode}`}
              </Typography>
              {(activity.ticket?.issueDescription || activity.notes) && (
                <Typography variant='body2' mt={0.5}>
                  {activity.ticket?.issueDescription || activity.notes}
                </Typography>
              )}
            </Box>
            {canWrite ? (
              <Box display='flex' gap={1} alignItems='center' flexWrap='wrap'>
                <Typography variant='body2' fontWeight={600}>
                  ¿Pudo afectar a un paciente o usuario?
                </Typography>
                <Button size='small' variant='outlined' color='error' disabled={answer.isLoading} onClick={() => handleAnswer(activity.id, true)}>
                  Sí, reportar
                </Button>
                <Button size='small' variant='outlined' disabled={answer.isLoading} onClick={() => handleAnswer(activity.id, false)}>
                  No
                </Button>
              </Box>
            ) : (
              <StatusChip label='Pendiente de la institución' color='warning' />
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

// ---------- Programa institucional

const ProgramSection = ({ customerId, canWrite }: { customerId: string; canWrite: boolean }) => {
  const { data: program, isLoading } = useProgram(customerId)
  const save = useSaveProgram(customerId)
  const [values, setValues] = useState<SurveillanceProgram>({ committee: [] })

  useEffect(() => {
    if (program) setValues({ ...program, committee: program.committee || [] })
  }, [program])

  const set = (key: keyof SurveillanceProgram, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }))
  const setMember = (index: number, key: keyof CommitteeMember, value: string) =>
    setValues((prev) => ({
      ...prev,
      committee: prev.committee.map((member, i) => (i === index ? { ...member, [key]: value } : member))
    }))

  const handleSave = async () => {
    try {
      await save.mutateAsync(values)
      notifySuccess('Programa guardado')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar el programa'))
    }
  }

  const downloadPdf = async () => {
    try {
      await techPaths.downloadFile(techPaths.programPdf(customerId), 'programa_tecnovigilancia.pdf')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo generar el PDF'))
    }
  }

  if (isLoading) return <CircularProgress />

  const text = (key: keyof SurveillanceProgram, label: string, props: Record<string, unknown> = {}) => (
    <TextField
      fullWidth
      size='small'
      label={label}
      value={(values[key] as string) || ''}
      onChange={(e) => set(key, e.target.value)}
      InputProps={{ readOnly: !canWrite }}
      {...props}
    />
  )

  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent>
        <Box display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={1} mb={2}>
          <Typography variant='h6' fontWeight={600}>
            Programa institucional de tecnovigilancia
          </Typography>
          <Button startIcon={<PictureAsPdf />} onClick={downloadPdf} sx={{ textTransform: 'none' }} disabled={!program?.id}>
            Descargar PDF
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>{text('referentName', 'Referente de tecnovigilancia')}</Grid>
          <Grid item xs={12} sm={6}>{text('referentPosition', 'Cargo')}</Grid>
          <Grid item xs={12} sm={6}>{text('referentEmail', 'Correo')}</Grid>
          <Grid item xs={12} sm={6}>{text('referentPhone', 'Teléfono')}</Grid>
          <Grid item xs={12} sm={4}>
            {text('invimaRegistrationDate', 'Inscripción en la Red Nacional', { type: 'date', InputLabelProps: { shrink: true } })}
          </Grid>
          <Grid item xs={12} sm={4}>{text('documentVersion', 'Versión del documento')}</Grid>
          <Grid item xs={12} sm={4}>
            {text('approvedAt', 'Fecha de aprobación', { type: 'date', InputLabelProps: { shrink: true } })}
          </Grid>
          <Grid item xs={12}>{text('objective', 'Objetivo', { multiline: true, minRows: 2 })}</Grid>
          <Grid item xs={12}>{text('scope', 'Alcance', { multiline: true, minRows: 2 })}</Grid>
          <Grid item xs={12}>{text('procedures', 'Procedimientos (detección, reporte, análisis, gestión)', { multiline: true, minRows: 4 })}</Grid>
        </Grid>

        <Typography variant='subtitle1' fontWeight={600} mt={3} mb={1}>
          Comité
        </Typography>
        <Stack spacing={1.5}>
          {values.committee.map((member, index) => (
            <Box key={index} display='flex' gap={1} flexWrap={{ xs: 'wrap', sm: 'nowrap' }}>
              <TextField size='small' fullWidth label='Nombre' value={member.name} onChange={(e) => setMember(index, 'name', e.target.value)} InputProps={{ readOnly: !canWrite }} />
              <TextField size='small' fullWidth label='Cargo' value={member.position} onChange={(e) => setMember(index, 'position', e.target.value)} InputProps={{ readOnly: !canWrite }} />
              <TextField size='small' fullWidth label='Rol en el comité' value={member.role} onChange={(e) => setMember(index, 'role', e.target.value)} InputProps={{ readOnly: !canWrite }} />
              {canWrite && (
                <IconButton aria-label='Quitar integrante' onClick={() => set('committee', values.committee.filter((_, i) => i !== index))}>
                  <Delete fontSize='small' />
                </IconButton>
              )}
            </Box>
          ))}
          {values.committee.length === 0 && (
            <Typography variant='body2' color='text.secondary'>
              Sin integrantes registrados.
            </Typography>
          )}
        </Stack>
        {canWrite && (
          <Box display='flex' justifyContent='space-between' mt={2} flexWrap='wrap' gap={1}>
            <Button
              size='small'
              startIcon={<Add />}
              onClick={() => set('committee', [...values.committee, { name: '', position: '', role: '' }])}
              sx={{ textTransform: 'none' }}
            >
              Agregar integrante
            </Button>
            <Button variant='contained' onClick={handleSave} disabled={save.isLoading} sx={primaryButtonSx}>
              Guardar programa
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Consolidado trimestral

const currentQuarter = () => Math.floor(new Date().getMonth() / 3) + 1

const QuarterlySection = ({ customerId }: { customerId: string }) => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState(currentQuarter())
  const { data, isLoading } = useQuarterly(customerId, year, quarter)
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index)

  const downloadPdf = async () => {
    try {
      await techPaths.downloadFile(techPaths.quarterlyPdf(customerId), `consolidado_tecnovigilancia_${year}_T${quarter}.pdf`, {
        year,
        quarter
      })
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo generar el PDF'))
    }
  }

  const rows = data ? [...data.nonSerious, ...data.serious, ...data.unclassified] : []

  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent>
        <Box display='flex' gap={1.5} flexWrap='wrap' alignItems='center' mb={2}>
          <Typography variant='h6' fontWeight={600} mr='auto'>
            Consolidado trimestral para el INVIMA
          </Typography>
          <TextField select size='small' label='Año' value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size='small' label='Trimestre' value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
            {[1, 2, 3, 4].map((value) => (
              <MenuItem key={value} value={value}>
                T{value}
              </MenuItem>
            ))}
          </TextField>
          <Button startIcon={<PictureAsPdf />} onClick={downloadPdf} sx={{ textTransform: 'none' }}>
            Descargar PDF
          </Button>
        </Box>
        {isLoading || !data ? (
          <CircularProgress />
        ) : (
          <Stack spacing={2}>
            <Alert severity={data.zeroReport ? 'info' : 'success'}>
              {data.zeroReport
                ? `Sin eventos ni incidentes entre el ${formatDate(data.from)} y el ${formatDate(data.to)}: corresponde el reporte en cero.`
                : `${data.nonSerious.length} no serio(s) para el consolidado y ${data.serious.length} serio(s) reportados aparte.`}{' '}
              Plazo para registrar el consolidado: {formatDate(data.deadline)}.
              {data.unclassified.length > 0 && ` Hay ${data.unclassified.length} reporte(s) sin clasificar la gravedad.`}
            </Alert>
            {rows.length > 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Detectado</TableCell>
                      <TableCell>Equipo</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Gravedad</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{report.code}</TableCell>
                        <TableCell>{formatDate(report.detectedAt)}</TableCell>
                        <TableCell>{report.equipment?.name || '—'}</TableCell>
                        <TableCell>{report.eventType ? EVENT_TYPE_LABELS[report.eventType] : '—'}</TableCell>
                        <TableCell>{report.severity ? SEVERITY_LABELS[report.severity] : 'Sin clasificar'}</TableCell>
                        <TableCell>
                          <StatusChip {...REPORT_STATUS[report.status]} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

/** Tecnovigilancia de la institución: reportes, revisiones del puente, programa y consolidado trimestral. */
const SurveillanceTab = ({ customerId }: { customerId: string }) => {
  const access = useTechAccess(customerId)
  const [section, setSection] = useState<Section>('reportes')
  const { data: reviews = [] } = usePendingReviews(customerId)

  return (
    <Stack spacing={3}>
      {!access.canWriteSurveillance && (
        <Alert severity='info' icon={<Lock />}>
          {INDEPENDENCE_NOTE}
          {access.isStaff && ' Las consultas del personal de Metromedics quedan en la bitácora.'}
        </Alert>
      )}
      <ToggleButtonGroup
        exclusive
        size='small'
        value={section}
        onChange={(_, value: Section | null) => value && setSection(value)}
        sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: `${TEAL} !important` } }}
      >
        <ToggleButton value='reportes'>Reportes</ToggleButton>
        <ToggleButton value='revisiones' sx={{ pr: 3 }}>
          <Badge color='warning' badgeContent={reviews.length} sx={{ '& .MuiBadge-badge': { right: -10 } }}>
            Revisiones pendientes
          </Badge>
        </ToggleButton>
        <ToggleButton value='programa'>Programa</ToggleButton>
        <ToggleButton value='trimestral'>Consolidado trimestral</ToggleButton>
      </ToggleButtonGroup>
      {section === 'reportes' && <ReportsSection customerId={customerId} canWrite={access.canWriteSurveillance} />}
      {section === 'revisiones' && <ReviewsSection customerId={customerId} canWrite={access.canWriteSurveillance} />}
      {section === 'programa' && <ProgramSection customerId={customerId} canWrite={access.canWriteSurveillance} />}
      {section === 'trimestral' && <QuarterlySection customerId={customerId} />}
    </Stack>
  )
}

export default SurveillanceTab
