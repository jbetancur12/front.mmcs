import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths
} from 'date-fns'
import { axiosPrivate } from '@utils/api'
import { CalibrationService } from '../../types/calibrationService'
import {
  SCHEDULE_REPORT_STATUSES,
  downloadScheduleReport,
  filterByPeriod
} from './scheduleReport'

interface Props {
  open: boolean
  onClose: () => void
  initialMonth: Date
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

const CalibrationServiceScheduleReportDialog = ({
  open,
  onClose,
  initialMonth
}: Props) => {
  const [from, setFrom] = useState(iso(startOfMonth(initialMonth)))
  const [to, setTo] = useState(iso(endOfMonth(initialMonth)))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const setRange = (a: Date, b: Date) => {
    setFrom(iso(a))
    setTo(iso(b))
    setMessage(null)
  }
  const now = new Date()
  const invalid = !from || !to || from > to

  const handleDownload = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const results = await Promise.all(
        SCHEDULE_REPORT_STATUSES.map((status) =>
          axiosPrivate.get('/calibration-services', {
            params: { limit: 500, status }
          })
        )
      )
      const all = results.flatMap(
        (r) => (r.data?.services as CalibrationService[]) || []
      )
      const rows = filterByPeriod(all, from, to)
      if (rows.length === 0) {
        setMessage('No hay servicios programados en ese periodo.')
        return
      }
      await downloadScheduleReport(rows, from, to)
      onClose()
    } catch {
      setMessage('No se pudo generar el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Descargar reporte de programación</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Excel con un resumen (por estado, metrólogo y cliente) y el detalle de
          los servicios programados en el periodo, incluidos los ya finalizados.
        </Typography>
        <Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label='Este mes'
            onClick={() => setRange(startOfMonth(now), endOfMonth(now))}
          />
          <Chip
            label='Mes anterior'
            onClick={() => {
              const p = subMonths(now, 1)
              setRange(startOfMonth(p), endOfMonth(p))
            }}
          />
          <Chip
            label='Últimos 3 meses'
            onClick={() =>
              setRange(startOfMonth(subMonths(now, 2)), endOfMonth(now))
            }
          />
          <Chip
            label='Próximo mes'
            onClick={() => {
              const n = addMonths(now, 1)
              setRange(startOfMonth(n), endOfMonth(n))
            }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label='Desde'
            type='date'
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label='Hasta'
            type='date'
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            error={!!from && !!to && from > to}
            helperText={
              from > to ? 'Debe ser posterior a la fecha inicial' : ''
            }
          />
        </Stack>
        {message && (
          <Alert severity='info' sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant='contained'
          onClick={handleDownload}
          disabled={invalid || loading}
        >
          {loading ? 'Generando…' : 'Descargar Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceScheduleReportDialog
