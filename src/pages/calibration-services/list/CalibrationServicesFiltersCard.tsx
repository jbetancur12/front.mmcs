import React from 'react'
import {
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import TableViewIcon from '@mui/icons-material/TableView'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor
} from '../../../types/calibrationService'
import {
  APPROVAL_OPTIONS,
  FILTER_ALL,
  FILTER_UNASSIGNED,
  SCOPE_OPTIONS,
  secondaryButtonSx,
  SLA_FILTER_ALERT,
  SLA_OPTIONS
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
  myLoadCount: number
  currentUserHasAssignedLoad: boolean
  metrologistOptions: CalibrationServicesMetrologistOption[]
}

const TEAL_INK = '#00695C'

/** Atajo de filtro: se activa y desactiva con un clic. */
const QuickFilter: React.FC<{
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}> = ({ label, active, onClick, disabled }) => (
  <Chip
    label={label}
    clickable
    disabled={disabled}
    onClick={onClick}
    aria-pressed={active}
    variant='outlined'
    sx={{
      height: 36,
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: 14,
      borderColor: active ? TEAL_INK : '#e5e7eb',
      bgcolor: active ? '#E0F7F4' : '#fff',
      color: active ? TEAL_INK : '#374151',
      '&&:hover': { bgcolor: active ? '#E0F7F4' : '#f3f4f6' }
    }}
  />
)

/**
 * Barra de filtros de la bandeja: buscador siempre visible, atajos de un
 * clic, "Más filtros" para lo avanzado y el selector de vista. El estado
 * del servicio se elige en el embudo de etapas, no aquí.
 */
const CalibrationServicesFiltersCard = ({
  filters,
  isTechnicalOnlyView,
  isAnalystOnlyView,
  myLoadCount,
  currentUserHasAssignedLoad,
  metrologistOptions
}: CalibrationServicesFiltersCardProps) => {
  const {
    search,
    setSearch,
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
    cutTaskFilter,
    setCutTaskFilter,
    hasCutsInvoiced,
    billingStatusFilter,
    setBillingStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    activeFiltersCount,
    clearFilters
  } = filters

  const isAtRisk = (slaFilter as string) === SLA_FILTER_ALERT
  // Filtros que viven dentro de "Más filtros"
  const advancedCount = [
    !isTechnicalOnlyView && approvalFilter !== FILTER_ALL,
    metrologistFilter !== FILTER_ALL,
    scopeFilter !== FILTER_ALL,
    slaFilter !== FILTER_ALL && !isAtRisk,
    hasAdjustmentsFilter !== FILTER_ALL,
    Boolean(billingStatusFilter),
    Boolean(paymentStatusFilter),
    siteFilter.trim()
  ].filter(Boolean).length

  const toggleStatusShortcut = (value: 'invoiced') =>
    setStatusFilter((previous) =>
      (previous as string) === value
        ? FILTER_ALL
        : (value as unknown as typeof previous)
    )

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', lg: 'center' }}
      >
        <TextField
          size='small'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Buscar por código, cliente u ODS'
          inputProps={{ 'aria-label': 'Buscar servicios' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlinedIcon fontSize='small' />
              </InputAdornment>
            )
          }}
          sx={{
            minWidth: { lg: 300 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
              borderRadius: '10px'
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: '#00897B',
                borderWidth: 2
              }
          }}
        />

        <Stack
          direction='row'
          spacing={1}
          useFlexGap
          flexWrap='wrap'
          sx={{ flex: 1 }}
          role='group'
          aria-label='Atajos de filtro'
        >
          {currentUserHasAssignedLoad ? (
            <QuickFilter
              label={`Mi carga (${myLoadCount})`}
              active={showOnlyMyLoad}
              onClick={() => setShowOnlyMyLoad((value) => !value)}
            />
          ) : null}
          <QuickFilter
            label='En riesgo'
            active={isAtRisk}
            onClick={() =>
              setSlaFilter(
                isAtRisk
                  ? FILTER_ALL
                  : (SLA_FILTER_ALERT as CalibrationServiceSlaIndicatorColor)
              )
            }
          />
          {!isTechnicalOnlyView ? (
            <>
              <QuickFilter
                label='Por facturar'
                active={cutTaskFilter === 'ready_to_invoice'}
                onClick={() =>
                  setCutTaskFilter(
                    cutTaskFilter === 'ready_to_invoice' ? '' : 'ready_to_invoice'
                  )
                }
              />
              <QuickFilter
                label='Sin pago'
                active={cutTaskFilter === 'unpaid'}
                onClick={() =>
                  setCutTaskFilter(cutTaskFilter === 'unpaid' ? '' : 'unpaid')
                }
              />
              <QuickFilter
                label='Por cobrar (crédito)'
                active={cutTaskFilter === 'receivable'}
                onClick={() =>
                  setCutTaskFilter(
                    cutTaskFilter === 'receivable' ? '' : 'receivable'
                  )
                }
              />
              <QuickFilter
                label='Facturados'
                active={hasCutsInvoiced}
                onClick={() => toggleStatusShortcut('invoiced')}
              />
            </>
          ) : null}
          <Badge
            badgeContent={advancedCount}
            invisible={advancedCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: TEAL_INK,
                color: '#fff',
                fontWeight: 700
              }
            }}
          >
            <Button
              variant='outlined'
              startIcon={<TuneOutlinedIcon />}
              onClick={() => setAreFiltersOpen((value) => !value)}
              aria-expanded={areFiltersOpen}
              aria-controls='calibration-services-advanced-filters'
              sx={{ ...secondaryButtonSx, minHeight: 36 }}
            >
              {areFiltersOpen ? 'Menos filtros' : 'Más filtros'}
            </Button>
          </Badge>
          {activeFiltersCount > 0 ? (
            <Button
              onClick={clearFilters}
              sx={{
                minHeight: 36,
                color: TEAL_INK,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </Stack>

        <ToggleButtonGroup
          size='small'
          exclusive
          value={viewMode}
          aria-label='Vista'
          onChange={(
            _event,
            nextViewMode: CalibrationServicesViewMode | null
          ) => {
            if (nextViewMode) {
              setViewMode(nextViewMode)
            }
          }}
          sx={{
            alignSelf: { xs: 'flex-start', lg: 'center' },
            bgcolor: '#fff',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              color: '#374151',
              gap: 0.75,
              px: 1.5,
              borderColor: '#e5e7eb'
            },
            '& .Mui-selected, & .Mui-selected:hover': {
              bgcolor: '#E0F7F4 !important',
              color: `${TEAL_INK} !important`
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
      </Stack>

      <Collapse in={areFiltersOpen} timeout='auto' unmountOnExit>
        <Box
          id='calibration-services-advanced-filters'
          sx={{
            mt: 1.5,
            p: 2,
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            bgcolor: '#fff',
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: '#00897B'
              },
            '& .MuiInputLabel-root.Mui-focused': { color: TEAL_INK }
          }}
        >
          <Grid container spacing={2}>
            {!isTechnicalOnlyView ? (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Respuesta del cliente'
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size='small'
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size='small'
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size='small'
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size='small'
                label='Novedades'
                value={hasAdjustmentsFilter}
                onChange={(event) =>
                  setHasAdjustmentsFilter(event.target.value)
                }
              >
                <MenuItem value={FILTER_ALL}>Todas</MenuItem>
                <MenuItem value='true'>Con novedades</MenuItem>
                <MenuItem value='false'>Sin novedades</MenuItem>
              </TextField>
            </Grid>
            {isAnalystOnlyView ? (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size='small'
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size='small'
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
                  <MenuItem value='pagado'>Sin pagos pendientes</MenuItem>
                  <MenuItem value='pendiente'>Contado sin pago</MenuItem>
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size='small'
                label='Sede o ubicación'
                value={siteFilter}
                onChange={(event) => setSiteFilter(event.target.value)}
                placeholder='Sede, ciudad o departamento'
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  )
}

export default CalibrationServicesFiltersCard
