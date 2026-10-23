import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'
import {
  CalibrationServiceSlaConfig,
  CalibrationServiceSlaConfigPayload
} from '../../types/calibrationService'

type SlaConfigKey = keyof CalibrationServiceSlaConfigPayload

interface SlaPhaseRow {
  label: string
  startsAt: string
  warningKey: SlaConfigKey
  targetKey: SlaConfigKey
}

interface CalibrationServiceSlaConfigDialogProps {
  open: boolean
  isLoading?: boolean
  config?: CalibrationServiceSlaConfig
  onClose: () => void
  onSubmit: (values: CalibrationServiceSlaConfigPayload) => Promise<void> | void
}

const DEFAULT_SLA_CONFIG: CalibrationServiceSlaConfigPayload = {
  programmingWarningBusinessDays: 2,
  programmingTargetBusinessDays: 3,
  executionWarningBusinessDays: 1,
  executionTargetBusinessDays: 2,
  adminClosureWarningBusinessDays: 1,
  adminClosureTargetBusinessDays: 2,
  invoicingWarningBusinessDays: 1,
  invoicingTargetBusinessDays: 2,
  documentControlWarningBusinessDays: 2,
  documentControlTargetBusinessDays: 3,
  finalCloseWarningBusinessDays: 1,
  finalCloseTargetBusinessDays: 2
}

const slaPhaseRows: SlaPhaseRow[] = [
  {
    label: 'ODS a programación',
    startsAt: 'Emisión de ODS',
    warningKey: 'programmingWarningBusinessDays',
    targetKey: 'programmingTargetBusinessDays'
  },
  {
    label: 'Programación a ejecución',
    startsAt: 'Fecha programada o programación registrada',
    warningKey: 'executionWarningBusinessDays',
    targetKey: 'executionTargetBusinessDays'
  },
  {
    label: 'Ejecución finalizada a corte',
    startsAt: 'Finalización técnica',
    warningKey: 'adminClosureWarningBusinessDays',
    targetKey: 'adminClosureTargetBusinessDays'
  },
  {
    label: 'Corte a facturación',
    startsAt: 'Corte listo para facturación',
    warningKey: 'invoicingWarningBusinessDays',
    targetKey: 'invoicingTargetBusinessDays'
  },
  {
    label: 'Facturación a control documental',
    startsAt: 'Corte facturado',
    warningKey: 'documentControlWarningBusinessDays',
    targetKey: 'documentControlTargetBusinessDays'
  },
  {
    label: 'Control documental a cierre final',
    startsAt: 'Certificados enviados',
    warningKey: 'finalCloseWarningBusinessDays',
    targetKey: 'finalCloseTargetBusinessDays'
  }
]

const normalizeValue = (value: unknown, fallback: number) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? Math.max(Math.trunc(parsedValue), 0) : fallback
}

const buildInitialValues = (
  config?: CalibrationServiceSlaConfig
): CalibrationServiceSlaConfigPayload =>
  slaPhaseRows.reduce<CalibrationServiceSlaConfigPayload>(
    (accumulator, row) => ({
      ...accumulator,
      [row.warningKey]: normalizeValue(
        config?.[row.warningKey],
        DEFAULT_SLA_CONFIG[row.warningKey]
      ),
      [row.targetKey]: Math.max(
        normalizeValue(config?.[row.targetKey], DEFAULT_SLA_CONFIG[row.targetKey]),
        1
      )
    }),
    { ...DEFAULT_SLA_CONFIG }
  )

const CalibrationServiceSlaConfigDialog = ({
  open,
  isLoading = false,
  config,
  onClose,
  onSubmit
}: CalibrationServiceSlaConfigDialogProps) => {
  const [values, setValues] = useState<CalibrationServiceSlaConfigPayload>(
    buildInitialValues(config)
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(buildInitialValues(config))
  }, [config, open])

  const hasInvalidValues = useMemo(
    () =>
      slaPhaseRows.some((row) => {
        const warning = Number(values[row.warningKey])
        const target = Number(values[row.targetKey])

        return !Number.isFinite(warning) || !Number.isFinite(target) || target < 1 || warning > target
      }),
    [values]
  )

  const updateValue = (key: SlaConfigKey, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: normalizeValue(value, currentValues[key])
    }))
  }

  const handleSubmit = async () => {
    await onSubmit(values)
  }

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Configurar tiempos SLA'
      subtitle='Cuántos días hábiles puede tardar cada fase antes de pasar a amarillo y a rojo.'
      submitLabel='Guardar tiempos'
      onSubmit={() => void handleSubmit()}
      loading={isLoading}
      submitDisabled={hasInvalidValues}
      maxWidth='md'
    >
        <Stack spacing={2}>
          <Alert severity='info' sx={{ alignItems: 'center' }}>
            Los días se cuentan en días hábiles desde el inicio de cada fase. Solo admin y super admin
            pueden cambiarlos; los demás roles los consultan en la guía.
          </Alert>

          {config?.updatedAt || config?.updatedByName ? (
            <Typography variant='caption' color='text.secondary'>
              Última actualización:{' '}
              {config.updatedAt ? new Date(config.updatedAt).toLocaleString('es-CO') : 'N/A'}
              {config.updatedByName ? ` por ${config.updatedByName}` : ''}
            </Typography>
          ) : null}

          <Box sx={{ overflowX: 'auto' }}>
            <Table size='small' sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Fase</TableCell>
                  <TableCell>Empieza cuando</TableCell>
                  <TableCell width={170}>
                    <Box component='span' sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b', mr: 0.75 }} />Amarillo desde el día
                  </TableCell>
                  <TableCell width={170}>
                    <Box component='span' sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444', mr: 0.75 }} />Rojo después del día
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slaPhaseRows.map((row) => {
                  const warning = Number(values[row.warningKey])
                  const target = Number(values[row.targetKey])
                  const warningInvalid = warning > target
                  const targetInvalid = target < 1
                  const greenEnd = Math.max(warning - 1, 0)

                  return (
                    <TableRow key={row.label} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{row.label}</Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                          <Box component='span' sx={{ color: '#00897B', fontWeight: 600 }}>Verde</Box> hasta el día {greenEnd},{' '}
                          <Box component='span' sx={{ color: '#b45309', fontWeight: 600 }}>amarillo</Box> del {warning} al {target},{' '}
                          <Box component='span' sx={{ color: '#dc2626', fontWeight: 600 }}>rojo</Box> desde el {target + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.startsAt}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          value={values[row.warningKey]}
                          onChange={(event) => updateValue(row.warningKey, event.target.value)}
                          disabled={isLoading}
                          error={warningInvalid}
                          inputProps={{ min: 0, step: 1, 'aria-label': `Amarillo desde, ${row.label}` }}
                          InputProps={{ endAdornment: <InputAdornment position='end'>días</InputAdornment> }}
                          helperText={warningInvalid ? 'No puede pasar el rojo' : ' '}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size='small'
                          type='number'
                          value={values[row.targetKey]}
                          onChange={(event) => updateValue(row.targetKey, event.target.value)}
                          disabled={isLoading}
                          error={targetInvalid || warningInvalid}
                          inputProps={{ min: 1, step: 1, 'aria-label': `Rojo después del día, ${row.label}` }}
                          InputProps={{ endAdornment: <InputAdornment position='end'>días</InputAdornment> }}
                          helperText={targetInvalid ? 'Mínimo 1 día' : ' '}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>

          {hasInvalidValues ? (
            <Alert severity='warning'>
              Revisa los valores: el rojo debe empezar mínimo en 1 día hábil y no puede ser menor
              que el día en que empieza el amarillo.
            </Alert>
          ) : null}
        </Stack>
    </FormDialog>
  )
}

export default CalibrationServiceSlaConfigDialog
