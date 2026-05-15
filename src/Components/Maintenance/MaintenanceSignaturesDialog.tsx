import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography
} from '@mui/material'
import { Draw, Save } from '@mui/icons-material'
import SignaturePad from './SignaturePad'
import type { CompletionSignatureInput } from './CompletionCostsDialog'

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

const MaintenanceSignaturesDialog: React.FC<MaintenanceSignaturesDialogProps> = ({
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
  const [customerSignerName, setCustomerSignerName] = useState('')
  const [customerSignerNameError, setCustomerSignerNameError] = useState('')
  const [customerSignatureData, setCustomerSignatureData] = useState<string | null>(null)
  const [customerSignatureError, setCustomerSignatureError] = useState('')
  const [technicianSignatureData, setTechnicianSignatureData] = useState<string | null>(null)
  const [technicianSignatureError, setTechnicianSignatureError] = useState('')

  const effectiveTechnicianSignature =
    currentTicketTechnicianSignature || storedTechnicianSignature || technicianSignatureData

  useEffect(() => {
    if (!open) return

    setCustomerSignerName(currentCustomerSignerName || '')
    setCustomerSignatureData(currentCustomerSignature || null)
    setTechnicianSignatureData(
      currentTicketTechnicianSignature || storedTechnicianSignature || null
    )
    setCustomerSignerNameError('')
    setCustomerSignatureError('')
    setTechnicianSignatureError('')
  }, [
    open,
    currentCustomerSignerName,
    currentCustomerSignature,
    currentTicketTechnicianSignature,
    storedTechnicianSignature
  ])

  const validate = () => {
    let isValid = true

    if (!customerSignerName.trim() || customerSignerName.trim().length < 2) {
      setCustomerSignerNameError('Ingresa el nombre de quien recibe el servicio')
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

    if (!effectiveTechnicianSignature && canCaptureTechnicianSignature) {
      setTechnicianSignatureError('Necesitamos registrar la firma del técnico')
      isValid = false
    } else {
      setTechnicianSignatureError('')
    }

    return isValid
  }

  const handleSave = async () => {
    if (!validate()) return

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

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box display='flex' alignItems='center' gap={1}>
          <Draw sx={{ color: '#2f7d32' }} />
          <Typography variant='h6'>Registrar firmas de conformidad</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity='info' sx={{ mb: 3 }}>
          Este flujo te permite completar las firmas después del cierre, sin reabrir ni cambiar el estado del ticket.
        </Alert>

        <Grid container spacing={3}>
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
              helperText={customerSignerNameError || 'Este nombre aparecerá en la orden de servicio.'}
              sx={{ mb: 2 }}
            />
            <SignaturePad
              value={customerSignatureData}
              onChange={(value) => {
                setCustomerSignatureData(value)
                if (customerSignatureError) setCustomerSignatureError('')
              }}
              disabled={loading}
              label='Firma del cliente'
              helperText={
                customerSignatureError ||
                'Puedes pedirle al cliente que firme aquí mismo desde el equipo o una tablet.'
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            {effectiveTechnicianSignature ? (
              <Box>
                <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
                  Firma del técnico
                </Typography>
                <Box
                  sx={{
                    border: '1px solid #d1d5db',
                    borderRadius: 2,
                    backgroundColor: '#ffffff',
                    minHeight: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                  }}
                >
                  <Box
                    component='img'
                    src={effectiveTechnicianSignature}
                    alt={`Firma de ${technicianName || 'técnico'}`}
                    sx={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain' }}
                  />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
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
                  if (technicianSignatureError) setTechnicianSignatureError('')
                }}
                disabled={loading}
                label='Firma del técnico'
                helperText={
                  technicianSignatureError ||
                  'La guardaremos para reutilizarla en próximos tickets.'
                }
              />
            ) : (
              <Alert severity='warning'>
                No encontramos una firma guardada del técnico asignado. Si necesitas que también aparezca en el PDF, toca registrar su firma primero desde su perfil o con su sesión.
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          color='inherit'
          sx={{
            borderColor: '#d1d5db',
            color: '#334155',
            '&:hover': { backgroundColor: '#f8fafc' }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant='contained'
          startIcon={<Save />}
          disabled={loading}
          sx={{
            backgroundColor: '#2f7d32',
            '&:hover': { backgroundColor: '#27672a' }
          }}
        >
          {loading ? 'Guardando...' : 'Guardar firmas'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MaintenanceSignaturesDialog
