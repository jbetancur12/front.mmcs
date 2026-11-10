import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SignaturePad from './SignaturePad'
import type { CompletionSignatureInput } from './CompletionCostsDialog'
import { brand, neutral } from 'src/theme/designTokens'

interface MaintenanceSignaturesDialogProps {
  open: boolean
  onClose: () => void
  onSave: (signatures: CompletionSignatureInput) => Promise<void>
  loading?: boolean
  technicianName?: string
  storedTechnicianSignature?: string | null
  currentTicketTechnicianSignature?: string | null
  currentCustomerSignerName?: string | null
  currentCustomerSignature?: string | null
  canCaptureTechnicianSignature?: boolean
}

const primaryButtonSx = {
  minHeight: 48,
  textTransform: 'none',
  fontWeight: 700,
  bgcolor: brand.main,
  color: neutral.text,
  '&:hover': { bgcolor: brand.hover, color: brand.onMain }
} as const

/**
 * Firmas de conformidad. En celular ocupa toda la pantalla y, si hay que
 * capturar también la firma del técnico, la pide en un segundo paso para
 * que cada recuadro de firma tenga todo el espacio.
 */
const MaintenanceSignaturesDialog: React.FC<
  MaintenanceSignaturesDialogProps
> = ({
  open,
  onClose,
  onSave,
  loading = false,
  technicianName,
  storedTechnicianSignature,
  currentTicketTechnicianSignature,
  currentCustomerSignerName,
  currentCustomerSignature,
  canCaptureTechnicianSignature = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [step, setStep] = useState(0)
  const [customerSignerName, setCustomerSignerName] = useState('')
  const [customerSignerNameError, setCustomerSignerNameError] = useState('')
  const [customerSignatureData, setCustomerSignatureData] = useState<
    string | null
  >(null)
  const [customerSignatureError, setCustomerSignatureError] = useState('')
  const [technicianSignatureData, setTechnicianSignatureData] = useState<
    string | null
  >(null)
  const [technicianSignatureError, setTechnicianSignatureError] = useState('')

  const fixedTechnicianSignature =
    currentTicketTechnicianSignature || storedTechnicianSignature || null
  const effectiveTechnicianSignature =
    fixedTechnicianSignature || technicianSignatureData
  const needsTechnicianPad =
    !fixedTechnicianSignature && canCaptureTechnicianSignature
  const stepped = isMobile && needsTechnicianPad
  const showCustomer = !stepped || step === 0
  const showTechnician = !stepped || step === 1

  useEffect(() => {
    if (!open) return

    setStep(0)
    setCustomerSignerName(currentCustomerSignerName || '')
    setCustomerSignatureData(currentCustomerSignature || null)
    setTechnicianSignatureData(fixedTechnicianSignature)
    setCustomerSignerNameError('')
    setCustomerSignatureError('')
    setTechnicianSignatureError('')
  }, [
    open,
    currentCustomerSignerName,
    currentCustomerSignature,
    fixedTechnicianSignature
  ])

  const validateCustomer = () => {
    let isValid = true

    if (!customerSignerName.trim() || customerSignerName.trim().length < 2) {
      setCustomerSignerNameError(
        'Ingresa el nombre de quien recibe el servicio'
      )
      isValid = false
    } else {
      setCustomerSignerNameError('')
    }

    if (!customerSignatureData) {
      setCustomerSignatureError('La firma del cliente es requerida')
      isValid = false
    } else {
      setCustomerSignatureError('')
    }

    return isValid
  }

  const validateTechnician = () => {
    if (!effectiveTechnicianSignature && canCaptureTechnicianSignature) {
      setTechnicianSignatureError('Necesitamos registrar la firma del técnico')
      return false
    }
    setTechnicianSignatureError('')
    return true
  }

  const handleNext = () => {
    if (validateCustomer()) setStep(1)
  }

  const handleSave = async () => {
    const customerOk = validateCustomer()
    const technicianOk = validateTechnician()
    if (!customerOk) {
      setStep(0)
      return
    }
    if (!technicianOk) return

    await onSave({
      customerSignerName: customerSignerName.trim(),
      customerSignatureData: customerSignatureData!,
      technicianSignatureData: effectiveTechnicianSignature || null,
      saveTechnicianSignature:
        canCaptureTechnicianSignature &&
        !storedTechnicianSignature &&
        Boolean(technicianSignatureData)
    })
  }

  const padHeight = isMobile ? 260 : 180
  const lastStep = !stepped || step === 1

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth='md'
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' component='span' fontWeight={700}>
            Firmas de conformidad
          </Typography>
          {stepped && (
            <Typography variant='body2' color='text.secondary'>
              Paso {step + 1} de 2:{' '}
              {step === 0 ? 'firma del cliente' : 'firma del técnico'}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          disabled={loading}
          aria-label='Cerrar'
          edge='end'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!stepped && (
          <Alert severity='info' sx={{ mb: 3 }}>
            Este flujo te permite completar las firmas después del cierre, sin
            reabrir ni cambiar el estado del ticket.
          </Alert>
        )}

        <Grid container spacing={3}>
          {showCustomer && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Nombre de quien recibe el servicio'
                value={customerSignerName}
                onChange={(e) => {
                  setCustomerSignerName(e.target.value)
                  if (customerSignerNameError) setCustomerSignerNameError('')
                }}
                error={!!customerSignerNameError}
                helperText={
                  customerSignerNameError ||
                  'Este nombre aparecerá en la orden de servicio.'
                }
                sx={{ mb: 2 }}
              />
              <SignaturePad
                value={customerSignatureData}
                onChange={(value) => {
                  setCustomerSignatureData(value)
                  if (customerSignatureError) setCustomerSignatureError('')
                }}
                disabled={loading}
                height={padHeight}
                label='Firma del cliente'
                helperText={
                  customerSignatureError ||
                  'Pídele al cliente que firme aquí mismo con el dedo.'
                }
              />
            </Grid>
          )}

          {showTechnician && (
            <Grid item xs={12} md={6}>
              {fixedTechnicianSignature ? (
                <Box>
                  <Typography
                    variant='subtitle2'
                    fontWeight={600}
                    sx={{ mb: 1 }}
                  >
                    Firma del técnico
                  </Typography>
                  <Box
                    sx={{
                      border: `1px solid ${neutral.borderStrong}`,
                      borderRadius: 2,
                      backgroundColor: neutral.surface,
                      minHeight: isMobile ? 120 : 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2
                    }}
                  >
                    <Box
                      component='img'
                      src={fixedTechnicianSignature}
                      alt={`Firma de ${technicianName || 'técnico'}`}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 140,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {currentTicketTechnicianSignature
                      ? 'El ticket ya tiene firma del técnico registrada.'
                      : `Usaremos la firma guardada de ${technicianName || 'este técnico'}.`}
                  </Typography>
                </Box>
              ) : canCaptureTechnicianSignature ? (
                <SignaturePad
                  value={technicianSignatureData}
                  onChange={(value) => {
                    setTechnicianSignatureData(value)
                    if (technicianSignatureError)
                      setTechnicianSignatureError('')
                  }}
                  disabled={loading}
                  height={padHeight}
                  label='Firma del técnico'
                  helperText={
                    technicianSignatureError ||
                    'La guardaremos para reutilizarla en próximos tickets.'
                  }
                />
              ) : (
                <Alert severity='warning'>
                  No encontramos una firma guardada del técnico asignado. Si
                  necesitas que también aparezca en el PDF, toca registrar su
                  firma primero desde su perfil o con su sesión.
                </Alert>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {stepped && step === 1 ? (
          <Button
            onClick={() => setStep(0)}
            disabled={loading}
            color='inherit'
            sx={{ minHeight: 48, textTransform: 'none' }}
          >
            Atrás
          </Button>
        ) : (
          <Button
            onClick={onClose}
            disabled={loading}
            color='inherit'
            sx={{ minHeight: 48, textTransform: 'none' }}
          >
            Cancelar
          </Button>
        )}
        {lastStep ? (
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
            sx={primaryButtonSx}
          >
            {loading ? 'Guardando...' : 'Guardar firmas'}
          </Button>
        ) : (
          <Button variant='contained' onClick={handleNext} sx={primaryButtonSx}>
            Siguiente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default MaintenanceSignaturesDialog
