import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import {
  AssignmentTurnedIn,
  Download,
  FactCheck,
  HourglassTop,
  Percent
} from '@mui/icons-material'
import { useCan } from '@utils/functions'
import { getApiErrorMessage } from '@utils/apiError'
import { downloadPrivateFile } from '@utils/downloadBlob'
import { PERMISSIONS } from 'src/constants/permissions'
import {
  useContractedServices,
  useCustomerIndicators
} from 'src/hooks/useCustomerIndicators'
import ProfileStatCard from '../Common/ProfileStatCard'
import { notify } from 'src/utils/notify'
import ContractedServicesPanel from './ContractedServicesPanel'
import IndicatorByTypeCard from './IndicatorByTypeCard'
import IndicatorGoalCard from './IndicatorGoalCard'
import IndicatorGoalProgressCard from './IndicatorGoalProgressCard'
import IndicatorObservationsCard from './IndicatorObservationsCard'
import TypeReviewDialog from './TypeReviewDialog'
import {
  TEAL_TEXT,
  formatCount,
  formatPct,
  emeraldButtonSx
} from './indicatorFormat'

interface Props {
  customerId: number | string
}

const ALL_SITES = ''

/** Pestaña "Indicadores" del perfil del cliente: avance de calibración frente a lo contratado. */
const CustomerIndicatorsTab: React.FC<Props> = ({ customerId }) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [headquarter, setHeadquarter] = useState(ALL_SITES)
  const [downloading, setDownloading] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const canViewContracted = useCan(
    PERMISSIONS.CUSTOMERS_INDICATOR_CONTRACTED_VIEW
  )
  const canManageGoal = useCan(PERMISSIONS.CUSTOMERS_INDICATOR_GOAL_MANAGE)

  const indicatorsQuery = useCustomerIndicators(
    customerId,
    year,
    headquarter || null
  )
  const contractedQuery = useContractedServices(
    customerId,
    year,
    canViewContracted
  )
  const indicators = indicatorsQuery.data

  const yearOptions = useMemo(() => {
    const years = new Set([
      ...(indicators?.availableYears ?? []),
      currentYear,
      year
    ])
    return [...years].sort((a, b) => b - a)
  }, [indicators?.availableYears, currentYear, year])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPrivateFile(
        `/customers/${customerId}/calibration-indicators/report.pdf`,
        `indicadores-calibracion-${customerId}-${year}.pdf`,
        { year, headquarter: headquarter || undefined }
      )
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No se pudo descargar el informe.')
      )
    } finally {
      setDownloading(false)
    }
  }

  const filters = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3
      }}
    >
      <Typography variant='h5' fontWeight='bold'>
        Indicadores de calibración
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' }
        }}
      >
        <TextField
          select
          size='small'
          label='Año'
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          sx={{ minWidth: 110 }}
        >
          {yearOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size='small'
          label='Sede'
          value={headquarter}
          onChange={(event) => setHeadquarter(event.target.value)}
          InputLabelProps={{ shrink: true }}
          SelectProps={{ displayEmpty: true }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value={ALL_SITES}>Todas las sedes</MenuItem>
          {(indicators?.headquarters ?? []).map((site) => (
            <MenuItem key={site} value={site}>
              {site}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant='contained'
          onClick={handleDownload}
          disabled={downloading}
          startIcon={
            downloading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <Download />
            )
          }
          sx={emeraldButtonSx}
        >
          {downloading ? 'Generando informe…' : 'Descargar informe PDF'}
        </Button>
      </Box>
    </Box>
  )

  if (indicatorsQuery.isLoading) {
    return (
      <Box>
        
        <SignalLoader message='Cargando indicadores...' />
      </Box>
    )
  }

  if (indicatorsQuery.isError || !indicators) {
    return (
      <Box>
        {filters}
        <Alert
          severity='error'
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => indicatorsQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(
            indicatorsQuery.error,
            'No se pudieron cargar los indicadores.'
          )}
        </Alert>
      </Box>
    )
  }

  const { goal } = indicators
  const noServices = goal.mode === 'auto' && goal.contractedServices === 0
  const isManual = goal.mode === 'manual'

  return (
    <Box>
      {filters}

      {noServices && (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Este año no hay órdenes de servicio emitidas. Se muestran los equipos
          con servicio metrológico, pero no se puede calcular el avance frente a
          una meta.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <ProfileStatCard
            label='Equipos contratados'
            value={formatCount(goal.value)}
            icon={<FactCheck />}
            color='#1565c0'
            background='#e3f2fd'
            valueColor='#1565c0'
            help='Meta de equipos a calibrar en el año'
            footer={
              <Chip
                size='small'
                variant='outlined'
                sx={{
                  height: 'auto',
                  '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 }
                }}
                label={
                  isManual
                    ? 'Meta fijada por Metromedics'
                    : `Según ${formatCount(goal.contractedServices)} ODS del año`
                }
              />
            }
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ProfileStatCard
            label='Equipos con servicio metrológico'
            value={formatCount(indicators.calibrated)}
            icon={<AssignmentTurnedIn />}
            color='#2e7d32'
            background='#e8f5e9'
            valueColor='#2e7d32'
            help='Equipos con certificado de calibración en el año; cada equipo cuenta una vez'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ProfileStatCard
            label='Avance de la meta'
            value={formatPct(indicators.progressPct)}
            icon={<Percent />}
            color='#00BFA5'
            background='#E0F7F4'
            valueColor={TEAL_TEXT}
            help='Con servicio metrológico frente a la meta'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <ProfileStatCard
            label='Pendientes'
            value={formatCount(indicators.pending)}
            icon={<HourglassTop />}
            color='#b45309'
            background='#fff3e0'
            valueColor='#b45309'
            help='Equipos de la meta que aún no tienen certificado'
          />
        </Grid>
      </Grid>

      {canManageGoal && !!indicators.excluded?.quantity && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Fuera de la meta por no ser metrológicos:{' '}
          {indicators.excluded.byType
            .map((entry) => `${entry.label} (${entry.quantity})`)
            .join(', ')}
          .
        </Alert>
      )}
      {headquarter && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Con una sede elegida, los equipos con servicio metrológico y el avance
          son de esa sede. La meta sigue siendo la del cliente completo.
        </Alert>
      )}

      {canViewContracted && (
        <Box sx={{ mb: 3 }}>
          <IndicatorGoalCard customerId={customerId} year={year} goal={goal} />
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <IndicatorGoalProgressCard indicators={indicators} />
        </Grid>
        <Grid item xs={12} md={6}>
          <IndicatorByTypeCard
            rows={indicators.byType}
            onReview={canManageGoal ? () => setReviewOpen(true) : undefined}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <IndicatorObservationsCard
          customerId={customerId}
          year={year}
          observations={indicators.observations}
        />
      </Box>

      {canViewContracted && (
        <ContractedServicesPanel
          data={contractedQuery.data}
          isLoading={contractedQuery.isLoading}
          isError={contractedQuery.isError}
          onRetry={() => contractedQuery.refetch()}
        />
      )}

      <TypeReviewDialog
        open={reviewOpen}
        unmatched={indicators.byType.filter(
          (row) => row.contracted > 0 && row.calibrated === 0
        )}
        rows={indicators.byType}
        availableTypes={indicators.availableCertificateTypes}
        onClose={() => setReviewOpen(false)}
      />
    </Box>
  )
}

export default CustomerIndicatorsTab
