import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import TableViewIcon from '@mui/icons-material/TableView'
import { CALIBRATION_SERVICE_STATUS_LABELS } from '../../../constants/calibrationServices'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import {
  APPROVAL_OPTIONS,
  FILTER_ALL,
  FILTER_UNASSIGNED,
  primaryButtonSx,
  SCOPE_OPTIONS,
  secondaryButtonSx,
  SLA_OPTIONS,
  softCardSx,
  STATUS_OPTIONS,
  TECHNICAL_STATUS_OPTIONS,
  ui
} from './calibrationServicesListConstants'
import {
  CalibrationServicesMetrologistOption,
  CalibrationServicesViewMode
} from './calibrationServicesListTypes'
import { CalibrationServicesListFilters } from './useCalibrationServicesListFilters'

interface CalibrationServicesFiltersCardProps {
  filters: CalibrationServicesListFilters
  isTechnicalOnlyView: boolean
  isAnalystOnlyView: boolean
  visibleCount: number
  myLoadCount: number
  currentUserHasAssignedLoad: boolean
  metrologistOptions: CalibrationServicesMetrologistOption[]
}

/** Tarjeta de filtros operativos: atajos, selector de vista, chips activos y filtros detallados. */
const CalibrationServicesFiltersCard = ({
  filters,
  isTechnicalOnlyView,
  isAnalystOnlyView,
  visibleCount,
  myLoadCount,
  currentUserHasAssignedLoad,
  metrologistOptions
}: CalibrationServicesFiltersCardProps) => {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    approvalFilter,
    setApprovalFilter,
    scopeFilter,
    setScopeFilter,
    slaFilter,
    setSlaFilter,
    siteFilter,
    setSiteFilter,
    metrologistFilter,
    setMetrologistFilter,
    hasAdjustmentsFilter,
    setHasAdjustmentsFilter,
    areFiltersOpen,
    setAreFiltersOpen,
    viewMode,
    setViewMode,
    showOnlyMyLoad,
    setShowOnlyMyLoad,
    hasCutsReadyForInvoicing,
    hasCutsInvoiced,
    billingStatusFilter,
    setBillingStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    activeFiltersCount,
    clearFilters
  } = filters

  return (
    <Card elevation={0} sx={{ ...softCardSx, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
              <Typography variant='h6' fontWeight={700} sx={{ color: ui.text, lineHeight: 1.2 }}>
                Filtros operativos
              </Typography>
              {activeFiltersCount > 0 ? (
                <Chip
                  size='small'
                  color='primary'
                  variant='outlined'
                  label={`${activeFiltersCount} activo${activeFiltersCount === 1 ? '' : 's'}`}
                />
              ) : null}
            </Stack>
            <Typography variant='body2' sx={{ mt: 0.5, color: ui.muted, lineHeight: 1.5 }}>
              Busca por código, cliente u ODS, o filtra por estado, semáforo, metrólogo y sede.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant={showOnlyMyLoad ? 'contained' : 'outlined'}
              color={showOnlyMyLoad ? 'success' : 'inherit'}
              onClick={() => setShowOnlyMyLoad((currentValue) => !currentValue)}
              disabled={!currentUserHasAssignedLoad}
              sx={
                showOnlyMyLoad
                  ? {
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      minHeight: 44
                    }
                  : secondaryButtonSx
              }
            >
              {showOnlyMyLoad ? `Mi carga (${visibleCount})` : `Mi carga${myLoadCount > 0 ? ` (${myLoadCount})` : ''}`}
            </Button>
            <Button
              variant={hasCutsReadyForInvoicing ? 'contained' : 'outlined'}
              color={hasCutsReadyForInvoicing ? 'info' : 'inherit'}
              onClick={() => setStatusFilter((prev) => ((prev as string) === 'ready_for_invoicing' ? FILTER_ALL : ('ready_for_invoicing' as any)))}
              sx={hasCutsReadyForInvoicing ? { borderRadius: '12px', textTransform: 'none', fontWeight: 700, minHeight: 44 } : secondaryButtonSx}
            >
              {hasCutsReadyForInvoicing ? `Por facturar (${visibleCount})` : 'Por facturar'}
            </Button>
            <Button
              variant={hasCutsInvoiced ? 'contained' : 'outlined'}
              color={hasCutsInvoiced ? 'success' : 'inherit'}
              onClick={() => setStatusFilter((prev) => ((prev as string) === 'invoiced' ? FILTER_ALL : ('invoiced' as any)))}
              sx={hasCutsInvoiced ? { borderRadius: '12px', textTransform: 'none', fontWeight: 700, minHeight: 44 } : secondaryButtonSx}
            >
              {hasCutsInvoiced ? `Facturados (${visibleCount})` : 'Facturados'}
            </Button>
            <ToggleButtonGroup
              size='small'
              exclusive
              value={viewMode}
              onChange={(_event, nextViewMode: CalibrationServicesViewMode | null) => {
                if (nextViewMode) {
                  setViewMode(nextViewMode)
                }
              }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '12px',
                p: 0.4,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                '& .MuiToggleButton-root': {
                  border: 0,
                  borderRadius: '10px',
                  px: 1.5,
                  py: 0.85,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: ui.textSecondary,
                  gap: 0.75
                },
                '& .Mui-selected': {
                  backgroundColor: '#E0F7F4',
                  color: '#00695C'
                }
              }}
            >
              <ToggleButton value='list'>
                <ViewListOutlinedIcon fontSize='small' />
                Lista
              </ToggleButton>
              <ToggleButton value='table'>
                <TableViewIcon fontSize='small' />
                Tabla
              </ToggleButton>
              <ToggleButton value='kanban'>
                <ViewKanbanOutlinedIcon fontSize='small' />
                Kanban
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant='outlined'
              color='inherit'
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              sx={secondaryButtonSx}
            >
              Limpiar filtros
            </Button>
            <Button
              variant='contained'
              startIcon={<FilterListOutlinedIcon />}
              endIcon={
                areFiltersOpen ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />
              }
              onClick={() => setAreFiltersOpen((currentValue) => !currentValue)}
              sx={primaryButtonSx}
            >
              {areFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </Stack>
        </Stack>

        {activeFiltersCount > 0 ? (
          <Stack direction='row' spacing={1} sx={{ mt: 2, mb: 0, flexWrap: 'wrap' }}>
            {search.trim() ? (
              <Chip size='small' label={`Buscar: "${search}"`} onDelete={() => setSearch('')} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
            ) : null}
            {statusFilter !== FILTER_ALL ? (
              <Chip size='small' label={`Estado: ${CALIBRATION_SERVICE_STATUS_LABELS[statusFilter] || STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label || statusFilter}`} onDelete={() => setStatusFilter(FILTER_ALL)} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
            ) : null}
            {showOnlyMyLoad ? (
              <Chip size='small' label='Mi carga' onDelete={() => setShowOnlyMyLoad(false)} variant='outlined' color='success' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
            ) : null}
            {hasAdjustmentsFilter !== FILTER_ALL ? (
              <Chip size='small' label={`Novedades: ${hasAdjustmentsFilter === 'true' ? 'Con' : 'Sin'}`} onDelete={() => setHasAdjustmentsFilter(FILTER_ALL)} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
            ) : null}
          </Stack>
        ) : null}

        <Collapse in={areFiltersOpen} timeout='auto' unmountOnExit>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Buscar servicio o cliente'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Código, cliente, ODS, contacto...'
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Estado'
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as CalibrationServiceStatus | typeof FILTER_ALL
                  )
                }
              >
                {(isTechnicalOnlyView
                  ? TECHNICAL_STATUS_OPTIONS
                  : STATUS_OPTIONS
                ).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {!isTechnicalOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Respuesta cliente'
                  value={approvalFilter}
                  onChange={(event) =>
                    setApprovalFilter(
                      event.target.value as
                        | CalibrationServiceApprovalStatus
                        | typeof FILTER_ALL
                    )
                  }
                >
                  {APPROVAL_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            {!isTechnicalOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Metrólogo asignado'
                  value={metrologistFilter}
                  onChange={(event) => setMetrologistFilter(event.target.value)}
                >
                  <MenuItem value={FILTER_ALL}>Todos los metrólogos</MenuItem>
                  <MenuItem value={FILTER_UNASSIGNED}>Sin asignar</MenuItem>
                  {metrologistOptions.map((metrologist) => (
                    <MenuItem key={metrologist.id} value={metrologist.id}>
                      {metrologist.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Alcance'
                value={scopeFilter}
                onChange={(event) =>
                  setScopeFilter(
                    event.target.value as
                      | CalibrationServiceScopeType
                      | typeof FILTER_ALL
                  )
                }
              >
                {SCOPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Semáforo'
                value={slaFilter}
                onChange={(event) =>
                  setSlaFilter(
                    event.target.value as
                      | CalibrationServiceSlaIndicatorColor
                      | typeof FILTER_ALL
                  )
                }
              >
                {SLA_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Novedades'
                value={hasAdjustmentsFilter}
                onChange={(event) => setHasAdjustmentsFilter(event.target.value)}
              >
                <MenuItem value={FILTER_ALL}>Todas</MenuItem>
                <MenuItem value='true'>Con novedades</MenuItem>
                <MenuItem value='false'>Sin novedades</MenuItem>
              </TextField>
            </Grid>
            {isAnalystOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Facturación'
                  value={billingStatusFilter ?? FILTER_ALL}
                  onChange={(event) =>
                    setBillingStatusFilter(
                      event.target.value === FILTER_ALL
                        ? undefined
                        : event.target.value
                    )
                  }
                >
                  <MenuItem value={FILTER_ALL}>Todas</MenuItem>
                  <MenuItem value='enviado'>Enviado a facturar</MenuItem>
                  <MenuItem value='no_enviado'>No enviado</MenuItem>
                </TextField>
              </Grid>
            ) : null}
            {isAnalystOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Pago'
                  value={paymentStatusFilter ?? FILTER_ALL}
                  onChange={(event) =>
                    setPaymentStatusFilter(
                      event.target.value === FILTER_ALL
                        ? undefined
                        : event.target.value
                    )
                  }
                >
                  <MenuItem value={FILTER_ALL}>Todos</MenuItem>
                  <MenuItem value='pagado'>Pagado</MenuItem>
                  <MenuItem value='pendiente'>Pendiente</MenuItem>
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Sede o ubicación'
                value={siteFilter}
                onChange={(event) => setSiteFilter(event.target.value)}
                placeholder='Filtra por sede, ciudad o departamento'
              />
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default CalibrationServicesFiltersCard
