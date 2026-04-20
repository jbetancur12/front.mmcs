import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
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
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth='md' fullWidth>
      <DialogTitle>Configurar tiempos SLA</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity='info'>
            Estos tiempos se cuentan en días hábiles. Solo admin y super admin
            pueden modificarlos; los demás roles los consultan en la guía.
          </Alert>

          {config?.updatedAt || config?.updatedByName ? (
            <Typography variant='caption' color='text.secondary'>
              Última actualización:{' '}
              {config.updatedAt ? new Date(config.updatedAt).toLocaleString('es-CO') : 'N/A'}
              {config.updatedByName ? ` por ${config.updatedByName}` : ''}
            </Typography>
          ) : null}

          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Fase</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell width={160}>Alerta desde</TableCell>
                <TableCell width={160}>Vencido después de</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slaPhaseRows.map((row) => {
                const warning = Number(values[row.warningKey])
                const target = Number(values[row.targetKey])
                const isInvalid = warning > target || target < 1

                return (
                  <TableRow key={row.label}>
                    <TableCell>
                      <Typography fontWeight={700}>{row.label}</Typography>
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
                        error={isInvalid}
                        inputProps={{ min: 0, step: 1 }}
                        helperText='días hábiles'
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
                        error={isInvalid}
                        inputProps={{ min: 1, step: 1 }}
                        helperText='días hábiles'
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {hasInvalidValues ? (
            <Alert severity='warning'>
              Revisa los valores: el vencimiento debe ser mínimo 1 día hábil y
              no puede ser menor al umbral de alerta.
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={isLoading || hasInvalidValues}
        >
          Guardar tiempos
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceSlaConfigDialog
