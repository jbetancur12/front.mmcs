import { FormEvent, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { useSearchParams } from 'react-router-dom'
import { axiosPublic } from '@utils/api'
import SignaturePad from '../../Components/Maintenance/SignaturePad'

interface PublicSignatureData {
  serviceCode: string
  customerName: string
  contactName?: string | null
  expiresAt: string
  isExpired: boolean
  alreadySigned: boolean
  canSign: boolean
  hasDocument?: boolean
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error
  return message || fallback
}

const CalibrationServiceRemoteSignaturePage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<PublicSignatureData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerRole, setSignerRole] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)

  const documentUrl = axiosPublic.getUri({
    url: '/calibration-services/public/signature/document',
    params: { token }
  })

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('El enlace no contiene un token válido.')
        setIsLoading(false)
        return
      }

      try {
        const response = await axiosPublic.get<PublicSignatureData>(
          '/calibration-services/public/signature',
          { params: { token } }
        )
        setData(response.data)
        setSignerName(response.data.contactName || '')
      } catch (requestError) {
        setError(
          getErrorMessage(requestError, 'No pudimos cargar el enlace de firma.')
        )
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      !data?.canSign ||
      !signature ||
      !signerName.trim() ||
      (data.hasDocument && !hasReviewed)
    ) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await axiosPublic.post('/calibration-services/public/signature', {
        token,
        signatureData: signature,
        signerName: signerName.trim(),
        signerRole: signerRole.trim() || null
      })
      setIsSigned(true)
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, 'No pudimos guardar tu firma. Intenta nuevamente.')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxWidth='sm' sx={{ py: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: '#E0F7F4',
                  color: '#00BFA5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DrawOutlinedIcon />
              </Box>
              <Typography variant='h5' fontWeight={800}>
                Recepción conforme del servicio
              </Typography>
            </Stack>
            <Typography color='text.secondary' sx={{ mt: 1.5 }}>
              Revisa la orden de servicio y firma como constancia de que recibiste
              el servicio a satisfacción.
            </Typography>
          </Box>

          {isLoading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <CircularProgress />
            </Box>
          ) : null}

          {error ? <Alert severity='error'>{error}</Alert> : null}

          {isSigned ? (
            <Alert severity='success'>
              ¡Gracias! Tu firma quedó registrada en la orden de servicio{' '}
              <strong>{data?.serviceCode}</strong>. Ya puedes cerrar esta página.
            </Alert>
          ) : null}

          {data && !isSigned ? (
            <>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Orden de servicio
                </Typography>
                <Typography variant='h6' fontWeight={700}>
                  {data.serviceCode}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {data.customerName}
                </Typography>
              </Box>

              {data.alreadySigned ? (
                <Alert severity='info'>
                  Este enlace ya fue utilizado y la orden ya está firmada.
                </Alert>
              ) : data.isExpired ? (
                <Alert severity='warning'>
                  Este enlace venció. Solicita uno nuevo a Metromedics.
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    {data.hasDocument ? (
                      <Box>
                        <Button
                          variant='outlined'
                          startIcon={<PictureAsPdfOutlinedIcon />}
                          href={documentUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          fullWidth
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Ver la orden de servicio (PDF)
                        </Button>
                        <FormControlLabel
                          sx={{ mt: 1 }}
                          control={
                            <Checkbox
                              checked={hasReviewed}
                              onChange={(event) => setHasReviewed(event.target.checked)}
                            />
                          }
                          label='Revisé la orden de servicio y estoy de acuerdo'
                        />
                      </Box>
                    ) : null}
                    <TextField
                      label='Nombre de quien recibe'
                      value={signerName}
                      onChange={(event) => setSignerName(event.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label='Cargo'
                      value={signerRole}
                      onChange={(event) => setSignerRole(event.target.value)}
                      fullWidth
                    />
                    <SignaturePad
                      value={signature}
                      onChange={setSignature}
                      height={200}
                      label='Tu firma'
                      helperText='Dibuja tu firma con el dedo o el mouse.'
                    />
                    <Typography variant='caption' color='text.secondary'>
                      Al firmar confirmas que recibiste a satisfacción los servicios de la
                      orden. El enlace vence el{' '}
                      {new Date(data.expiresAt).toLocaleString('es-CO')} y solo puede
                      usarse una vez.
                    </Typography>
                    <Button
                      type='submit'
                      variant='contained'
                      size='large'
                      disabled={
                        !signature ||
                        !signerName.trim() ||
                        (data.hasDocument && !hasReviewed) ||
                        isSubmitting
                      }
                      sx={{
                        bgcolor: '#00BFA5',
                        '&:hover': { bgcolor: '#00897B' },
                        textTransform: 'none',
                        fontWeight: 700
                      }}
                    >
                      {isSubmitting ? 'Guardando…' : 'Firmar orden de servicio'}
                    </Button>
                  </Stack>
                </form>
              )}
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  )
}

export default CalibrationServiceRemoteSignaturePage
