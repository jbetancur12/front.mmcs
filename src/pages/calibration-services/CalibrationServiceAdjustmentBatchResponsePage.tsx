import { FormEvent, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { axiosPublic } from '@utils/api'

interface BatchAdjustmentEntry {
  adjustmentId: number
  itemName: string
  description: string
  changeType: string
  quotedQuantity: number
  actualQuantity: number
  differenceQuantity: number
  approvedSubtotal?: number | string | null
  approvedTotal?: number | string | null
  status: string
  customerApprovalStatus?: string | null
  canRespond: boolean
}

interface BatchResponseData {
  token: string
  serviceId: number
  serviceCode?: string | null
  quoteCode?: string | null
  customerName?: string | null
  adjustments: BatchAdjustmentEntry[]
}

interface DecisionEntry {
  adjustmentId: number
  decision: 'approved' | 'rejected' | 'changes_requested'
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const TYPE_LABELS: Record<string, string> = {
  quantity_less: 'Cant. menor',
  quantity_more: 'Cant. mayor',
  extra_item: 'Item adicional',
  not_received: 'No recibido',
  scope_change: 'Cambio alcance'
}

const CalibrationServiceAdjustmentBatchResponsePage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<BatchResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [decisions, setDecisions] = useState<DecisionEntry[]>([])

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('El enlace no contiene un token válido.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await axiosPublic.get<BatchResponseData>(
          '/calibration-services/public/adjustments/batch-respond',
          { params: { token } }
        )
        setData(response.data)
        setCustomerName(response.data.customerName || '')
        setDecisions(
          response.data.adjustments
            .filter((a) => a.canRespond)
            .map((a) => ({
              adjustmentId: a.adjustmentId,
              decision: 'approved' as const
            }))
        )
        setError(null)
      } catch (requestError) {
        console.error(requestError)
        setError('No pudimos cargar las novedades para responder.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  const setDecisionFor = (adjustmentId: number, decision: 'approved' | 'rejected' | 'changes_requested') => {
    setDecisions((prev) =>
      prev.map((d) => (d.adjustmentId === adjustmentId ? { ...d, decision } : d))
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!data) return

    const pendingCount = data.adjustments.filter((a) => a.canRespond).length
    if (pendingCount === 0) return

    try {
      setIsSubmitting(true)
      const response = await axiosPublic.post<{
        success: boolean
        message: string
        results: Array<{ adjustmentId: number; success: boolean; status?: string }>
      }>('/calibration-services/public/adjustments/batch-respond', {
        token,
        decisions,
        customerName: customerName.trim() || null,
        notes: notes.trim() || null
      })
      setSuccessMessage(response.data.message)
      setData((current) => {
        if (!current) return current
        return {
          ...current,
          adjustments: current.adjustments.map((a) => {
            const result = response.data.results.find(
              (r) => r.adjustmentId === a.adjustmentId
            )
            if (!result) return a
            return {
              ...a,
              canRespond: false,
              status: result.status || a.status,
              customerApprovalStatus: result.status || a.status
            }
          })
        }
      })
    } catch (submitError) {
      console.error(submitError)
      setError('No pudimos guardar tus respuestas. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = data?.adjustments.filter((a) => a.canRespond).length ?? 0

  return (
    <Container maxWidth='md' sx={{ py: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant='h4' fontWeight={800}>
              Respuesta de novedades de calibración
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
              Aquí puedes aprobar, rechazar o pedir ajuste sobre las novedades reportadas
              para tu servicio.
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity='error'>{error}</Alert>
          ) : data ? (
            <>
              {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

              <Paper variant='outlined' sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant='subtitle1' fontWeight={800}>
                  {data.serviceCode}
                  {data.quoteCode ? ` · ${data.quoteCode}` : ''}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  {data.adjustments.length} novedad(es) pendiente(s) de tu validación.
                </Typography>
              </Paper>

              {pendingCount === 0 && !successMessage ? (
                <Alert severity='info'>
                  Todas las novedades ya fueron respondidas desde este enlace.
                </Alert>
              ) : null}

              {pendingCount > 0 ? (
                <Box component='form' onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label='Tu nombre'
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label='Observación general'
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      helperText='Aplica a todas las novedades.'
                    />

                    <Typography variant='subtitle2' fontWeight={800}>
                      Decisión por cada novedad
                    </Typography>

                    {data.adjustments
                      .filter((a) => a.canRespond)
                      .map((adjustment) => {
                        const entry = decisions.find(
                          (d) => d.adjustmentId === adjustment.adjustmentId
                        )
                        return (
                          <Paper
                            key={adjustment.adjustmentId}
                            variant='outlined'
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction='row' spacing={1} alignItems='center'>
                                <Typography variant='body2' fontWeight={700} color='primary.main'>
                                  {adjustment.itemName}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  · {TYPE_LABELS[adjustment.changeType] || adjustment.changeType}
                                </Typography>
                              </Stack>
                              <Typography variant='caption' color='text.secondary'>
                                Cotizado: {adjustment.quotedQuantity} · Real:{' '}
                                {adjustment.actualQuantity} · Diferencia:{' '}
                                {adjustment.differenceQuantity}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                Valor:{' '}
                                {currencyFormatter.format(
                                  toNumber(adjustment.approvedTotal ?? adjustment.approvedSubtotal)
                                )}
                              </Typography>
                              <TextField
                                select
                                fullWidth
                                size='small'
                                label='Tu decisión'
                                value={entry?.decision || 'approved'}
                                onChange={(event) =>
                                  setDecisionFor(
                                    adjustment.adjustmentId,
                                    event.target.value as 'approved' | 'rejected' | 'changes_requested'
                                  )
                                }
                              >
                                <MenuItem value='approved'>Apruebo la novedad</MenuItem>
                                <MenuItem value='rejected'>No apruebo la novedad</MenuItem>
                                <MenuItem value='changes_requested'>
                                  Solicito ajuste o aclaración
                                </MenuItem>
                              </TextField>
                            </Stack>
                          </Paper>
                        )
                      })}

                    <Stack direction='row' justifyContent='flex-end'>
                      <Button
                        type='submit'
                        variant='contained'
                        disabled={isSubmitting}
                        size='large'
                      >
                        {isSubmitting
                          ? 'Guardando...'
                          : `Enviar respuestas (${pendingCount})`}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  )
}

export default CalibrationServiceAdjustmentBatchResponsePage
