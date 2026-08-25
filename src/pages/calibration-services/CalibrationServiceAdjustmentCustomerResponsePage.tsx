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

interface PublicAdjustmentResponseData {
  token: string
  serviceCode?: string | null
  quoteCode?: string | null
  customerName?: string | null
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
  customerApprovalDeadlineAt?: string | null
  customerApprovalSentAt?: string | null
  customerApprovalResponseNotes?: string | null
  canRespond: boolean
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const CalibrationServiceAdjustmentCustomerResponsePage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<PublicAdjustmentResponseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [decision, setDecision] = useState<
    'approved' | 'rejected' | 'changes_requested'
  >('approved')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('El enlace no contiene un token válido.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await axiosPublic.get<PublicAdjustmentResponseData>(
          '/calibration-services/public/adjustments/respond',
          {
            params: { token }
          }
        )
        setData(response.data)
        setCustomerName(response.data.customerName || '')
        setError(null)
      } catch (requestError) {
        console.error(requestError)
        setError('No pudimos cargar la novedad para responder.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!data?.canRespond) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await axiosPublic.post<{
        success: boolean
        status: string
        message: string
      }>('/calibration-services/public/adjustments/respond', {
        token,
        decision,
        customerName: customerName.trim() || null,
        notes: notes.trim() || null
      })
      setSuccessMessage(response.data.message)
      setData((current) =>
        current
          ? {
              ...current,
              canRespond: false,
              status: response.data.status,
              customerApprovalStatus: response.data.status,
              customerApprovalResponseNotes: notes.trim() || null
            }
          : current
      )
    } catch (submitError) {
      console.error(submitError)
      setError('No pudimos guardar tu respuesta. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth='md' sx={{ py: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant='h4' fontWeight={800}>
              Respuesta de novedad de calibración
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
              Aquí puedes aprobar, rechazar o pedir ajuste sobre la novedad reportada
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
                <Stack spacing={1.5}>
                  <Typography variant='subtitle1' fontWeight={800}>
                    {data.serviceCode}
                    {data.quoteCode ? ` · ${data.quoteCode}` : ''}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Ítem: {data.itemName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Descripción: {data.description}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Cantidad cotizada: {data.quotedQuantity} · Cantidad real:{' '}
                    {data.actualQuantity} · Diferencia: {data.differenceQuantity}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Valor propuesto:{' '}
                    {currencyFormatter.format(
                      toNumber(data.approvedTotal ?? data.approvedSubtotal)
                    )}
                  </Typography>
                </Stack>
              </Paper>

              {!data.canRespond ? (
                <Alert severity='info'>
                  Esta novedad ya no admite una nueva respuesta desde este enlace.
                </Alert>
              ) : (
                <Box component='form' onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label='Tu nombre'
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                    />
                    <TextField
                      select
                      fullWidth
                      label='Tu decisión'
                      value={decision}
                      onChange={(event) =>
                        setDecision(
                          event.target.value as
                            | 'approved'
                            | 'rejected'
                            | 'changes_requested'
                        )
                      }
                    >
                      <MenuItem value='approved'>Apruebo la novedad</MenuItem>
                      <MenuItem value='rejected'>No apruebo la novedad</MenuItem>
                      <MenuItem value='changes_requested'>
                        Solicito ajuste o aclaración
                      </MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label='Observación'
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                    <Stack direction='row' justifyContent='flex-end'>
                      <Button type='submit' variant='contained' disabled={isSubmitting}>
                        Enviar respuesta
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  )
}

export default CalibrationServiceAdjustmentCustomerResponsePage
