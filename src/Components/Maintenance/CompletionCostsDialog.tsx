import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Alert,
  AlertTitle,
  CircularProgress,
  Collapse,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Add,
  Delete,
  AttachMoney,
  Build,
  CheckCircle,
  Close,
  AddAPhoto,
  Draw
} from '@mui/icons-material'
import MaintenanceFileUpload from './MaintenanceFileUpload'
import SignaturePad from './SignaturePad'
import type { MaintenanceFile } from '../../types/maintenance'

interface Cost {
  name: string
  description?: string
  amount: number | string
}

export interface CompletionPhotoInput {
  file: File
  description?: string
}

export interface CompletionSignatureInput {
  customerSignerName: string
  customerSignatureData: string
  technicianSignatureData?: string | null
  saveTechnicianSignature?: boolean
}

interface CompletionCostsDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (
    workPerformed: string,
    technicianWorkMinutes: number,
    costs: Cost[],
    completionPhotos: CompletionPhotoInput[],
    technicianSignature: {
      technicianSignatureData?: string | null
      saveTechnicianSignature?: boolean
    }
  ) => Promise<void>
  loading?: boolean
  technicianName?: string
  storedTechnicianSignature?: string | null
  canCaptureTechnicianSignature?: boolean
  signaturesEnabled?: boolean
}

const CompletionCostsDialog: React.FC<CompletionCostsDialogProps> = ({
  open,
  onClose,
  onComplete,
  loading = false,
  technicianName,
  storedTechnicianSignature,
  canCaptureTechnicianSignature = false,
  signaturesEnabled = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }

  const [workPerformed, setWorkPerformed] = useState<string>('')
  const [workPerformedError, setWorkPerformedError] = useState<string>('')
  const [technicianWorkMinutes, setTechnicianWorkMinutes] = useState<string>('')
  const [technicianWorkMinutesError, setTechnicianWorkMinutesError] =
    useState<string>('')
  const [costs, setCosts] = useState<Cost[]>([
    { name: '', description: '', amount: '' }
  ])
  const [errors, setErrors] = useState<
    Record<number, { name?: string; amount?: string }>
  >({})
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [completionPhotos, setCompletionPhotos] = useState<CompletionPhotoInput[]>([])
  const [technicianSignatureData, setTechnicianSignatureData] = useState<string | null>(
    storedTechnicianSignature || null
  )
  const [technicianSignatureError, setTechnicianSignatureError] = useState('')

  useEffect(() => {
    if (!open) {
      setWorkPerformed('')
      setWorkPerformedError('')
      setTechnicianWorkMinutes('')
      setTechnicianWorkMinutesError('')
      setCosts([{ name: '', description: '', amount: '' }])
      setErrors({})
      setShowPhotoUpload(false)
      setCompletionPhotos([])
      setTechnicianSignatureData(storedTechnicianSignature || null)
      setTechnicianSignatureError('')
    }
  }, [open, storedTechnicianSignature])

  const handleAddCost = () => {
    setCosts([...costs, { name: '', description: '', amount: '' }])
  }

  const handleRemoveCost = (index: number) => {
    if (costs.length > 1) {
      setCosts(costs.filter((_, i) => i !== index))
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  const handleCostChange = (
    index: number,
    field: keyof Cost,
    value: string
  ) => {
    const updated = [...costs]
    updated[index] = { ...updated[index], [field]: value }
    setCosts(updated)

    // Clear error
    if (errors[index]?.[field as 'name' | 'amount']) {
      const newErrors = { ...errors }
      delete newErrors[index][field as 'name' | 'amount']
      setErrors(newErrors)
    }
  }

  const validateWorkPerformed = (): boolean => {
    if (!workPerformed.trim()) {
      setWorkPerformedError('La descripción del trabajo es requerida')
      return false
    }
    if (workPerformed.trim().length < 20) {
      setWorkPerformedError('Debe tener al menos 20 caracteres')
      return false
    }
    setWorkPerformedError('')
    return true
  }

  const validateTechnicianWorkMinutes = (): boolean => {
    const value = Number(technicianWorkMinutes)

    if (!technicianWorkMinutes.trim()) {
      setTechnicianWorkMinutesError(
        'El tiempo invertido por el técnico es requerido'
      )
      return false
    }

    if (!Number.isFinite(value) || value <= 0) {
      setTechnicianWorkMinutesError('Ingresa un tiempo válido en minutos')
      return false
    }

    setTechnicianWorkMinutesError('')
    return true
  }

  const validate = (): boolean => {
    const newErrors: Record<number, { name?: string; amount?: string }> = {}
    let isValid = true

    costs.forEach((cost, index) => {
      if (!cost.name.trim()) {
        newErrors[index] = {
          ...newErrors[index],
          name: 'El nombre es requerido'
        }
        isValid = false
      } else if (cost.name.trim().length < 3) {
        newErrors[index] = { ...newErrors[index], name: 'Mínimo 3 caracteres' }
        isValid = false
      }

      const amount = parseFloat(cost.amount as string)
      if (!cost.amount || isNaN(amount) || amount < 0) {
        newErrors[index] = { ...newErrors[index], amount: 'Monto inválido' }
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    const isWorkValid = validateWorkPerformed()
    const isTimeValid = validateTechnicianWorkMinutes()
    const areCostsValid = validate()
    const effectiveTechnicianSignature =
      technicianSignatureData || storedTechnicianSignature || null

    if (!isWorkValid || !isTimeValid || !areCostsValid) return
    if (signaturesEnabled && !effectiveTechnicianSignature) {
      setTechnicianSignatureError(
        'Debes registrar la firma del técnico para completar el ticket'
      )
      return
    }

    const formattedCosts = costs.map((cost) => ({
      name: cost.name.trim(),
      description: cost.description?.trim() || undefined,
      amount: parseFloat(cost.amount as string)
    }))

    await onComplete(
      workPerformed.trim(),
      Number(technicianWorkMinutes),
      formattedCosts,
      completionPhotos,
      {
      technicianSignatureData: signaturesEnabled
        ? effectiveTechnicianSignature
        : null,
      saveTechnicianSignature:
        signaturesEnabled &&
        canCaptureTechnicianSignature &&
        !storedTechnicianSignature &&
        Boolean(technicianSignatureData)
      }
    )
  }

  const handleCompleteWithoutCosts = async () => {
    const effectiveTechnicianSignature =
      technicianSignatureData || storedTechnicianSignature || null

    if (!validateWorkPerformed() || !validateTechnicianWorkMinutes()) return
    if (signaturesEnabled && !effectiveTechnicianSignature) {
      setTechnicianSignatureError(
        'Debes registrar la firma del técnico para completar el ticket'
      )
      return
    }

    await onComplete(
      workPerformed.trim(),
      Number(technicianWorkMinutes),
      [],
      completionPhotos,
      {
      technicianSignatureData: signaturesEnabled
        ? effectiveTechnicianSignature
        : null,
      saveTechnicianSignature:
        signaturesEnabled &&
        canCaptureTechnicianSignature &&
        !storedTechnicianSignature &&
        Boolean(technicianSignatureData)
      }
    )
  }

  const handlePhotosChange = (newFiles: File[]) => {
    setCompletionPhotos((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, description: '' }))
    ])
  }

  const handlePhotoRemove = (fileId: string) => {
    const fileIndex = parseInt(fileId, 10)
    setCompletionPhotos((prev) => prev.filter((_, index) => index !== fileIndex))
  }

  const handlePhotoDescriptionChange = (index: number, value: string) => {
    setCompletionPhotos((prev) =>
      prev.map((photo, photoIndex) =>
        photoIndex === index ? { ...photo, description: value } : photo
      )
    )
  }

  const calculateTotal = () => {
    return costs.reduce((sum, cost) => {
      const amount = parseFloat(cost.amount as string)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const isFormValid = useMemo(() => {
    const workValid = workPerformed.trim().length >= 20
    const timeValid =
      technicianWorkMinutes.trim().length > 0 &&
      Number.isFinite(Number(technicianWorkMinutes)) &&
      Number(technicianWorkMinutes) > 0
    const costsValid = costs.every(
      (cost) =>
        cost.name.trim().length >= 3 &&
        cost.amount &&
        !isNaN(parseFloat(cost.amount as string)) &&
        parseFloat(cost.amount as string) >= 0
    )
    return workValid && timeValid && costsValid
  }, [costs, workPerformed, technicianWorkMinutes])

  const isWorkPerformedValid = useMemo(() => {
    return (
      workPerformed.trim().length >= 20 &&
      technicianWorkMinutes.trim().length > 0 &&
      Number.isFinite(Number(technicianWorkMinutes)) &&
      Number(technicianWorkMinutes) > 0
    )
  }, [workPerformed, technicianWorkMinutes])

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth='md'
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={loading}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Avatar
          sx={{
            backgroundColor: '#eef6ee',
            color: '#2f7d32',
            width: 48,
            height: 48
          }}
        >
          <Build />
        </Avatar>
        <Box flex={1}>
          <Typography variant='h5' fontWeight={700}>
            Completar Ticket
          </Typography>
          <Typography variant='body2' sx={{ color: '#64748b' }}>
            Describa el trabajo realizado y registre los costos
          </Typography>
        </Box>
        {isMobile && !loading && (
          <IconButton onClick={onClose} sx={{ color: '#475569' }}>
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Alert */}
        <Alert
          severity='info'
          icon={<CheckCircle />}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>Completando Ticket</AlertTitle>
          Una vez completado, el estado no podrá modificarse. Describa el
          trabajo realizado y, si el servicio tiene costos asociados,
          regístrelos aquí (repuestos, transporte, mano de obra, etc.).
        </Alert>

        {/* Work Performed Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
            backgroundColor: '#f8fbff'
          }}
        >
          <Typography
            variant='subtitle1'
            fontWeight={600}
            gutterBottom
            sx={{ color: '#0f172a' }}
          >
            Trabajo Realizado *
          </Typography>
          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label='Descripción del Trabajo Realizado'
            placeholder='Describa en detalle el diagnóstico técnico, las reparaciones efectuadas, partes reemplazadas, ajustes realizados, pruebas ejecutadas, etc.'
            value={workPerformed}
            onChange={(e) => {
              setWorkPerformed(e.target.value)
              if (workPerformedError) setWorkPerformedError('')
            }}
            error={!!workPerformedError}
            helperText={
              workPerformedError ||
              `${workPerformed.length}/500 caracteres (mínimo 20)`
            }
            inputProps={{ maxLength: 500 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white'
              }
            }}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #dbeafe',
            backgroundColor: '#f8fbff'
          }}
        >
          <Typography
            variant='subtitle1'
            fontWeight={600}
            gutterBottom
            sx={{ color: '#0f172a' }}
          >
            Tiempo invertido por el técnico *
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Este dato quedará como referencia interna para analíticas, reporte
            técnico y consulta de facturación.
          </Typography>
          <TextField
            fullWidth
            required
            type='number'
            label='Minutos invertidos'
            placeholder='Ej: 90'
            value={technicianWorkMinutes}
            onChange={(e) => {
              setTechnicianWorkMinutes(e.target.value)
              if (technicianWorkMinutesError) {
                setTechnicianWorkMinutesError('')
              }
            }}
            error={!!technicianWorkMinutesError}
            helperText={
              technicianWorkMinutesError ||
              'Registra el tiempo total aproximado de trabajo efectivo'
            }
            inputProps={{ min: 1, step: 1 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white'
              }
            }}
          />
        </Paper>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant='h6'
            fontWeight={600}
            gutterBottom
            sx={{ mb: 2, color: '#3b82f6' }}
          >
            Evidencia fotográfica (opcional)
          </Typography>
          <Button
            variant={showPhotoUpload ? 'contained' : 'outlined'}
            startIcon={<AddAPhoto />}
            onClick={() => setShowPhotoUpload((prev) => !prev)}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              minHeight: 44,
              ...(showPhotoUpload
                ? {
                    backgroundColor: '#2f7d32',
                    '&:hover': { backgroundColor: '#27672a' }
                  }
                : {
                    borderColor: '#d1d5db',
                    color: '#334155',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f8fafc'
                    }
                  })
            }}
          >
            {showPhotoUpload ? 'Ocultar fotos del servicio' : 'Adjuntar fotos del servicio'}
          </Button>

          <Collapse in={showPhotoUpload}>
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                border: '1px dashed #cbd5e1',
                backgroundColor: '#f8fafc'
              }}
            >
              <Typography variant='subtitle1' fontWeight={600} gutterBottom>
                Evidencia fotográfica del servicio
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Puedes adjuntar hasta 5 fotos del trabajo realizado. Estas imágenes aparecerán en la orden de servicio PDF.
              </Typography>
              <MaintenanceFileUpload
                files={completionPhotos.map((photo, index) => ({
                  id: index.toString(),
                  ticketId: '',
                  fileName: photo.file.name,
                  originalName: photo.file.name,
                  fileType: photo.file.type,
                  fileSize: photo.file.size,
                  filePath: '',
                  uploadedBy: '',
                  uploadedAt: '',
                  isImage: photo.file.type.startsWith('image/'),
                  isVideo: false
                } as MaintenanceFile))}
                onFilesChange={handlePhotosChange}
                onFileRemove={handlePhotoRemove}
                acceptedFileTypes={['image/*']}
                maxFiles={5}
                maxSizeInMB={10}
                disabled={loading}
              />
              {completionPhotos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
                    Descripción por foto (opcional)
                  </Typography>
                  <Grid container spacing={2}>
                    {completionPhotos.map((photo, index) => (
                      <Grid item xs={12} key={`${photo.file.name}-${index}`}>
                        <TextField
                          fullWidth
                          label={`Descripción de ${photo.file.name}`}
                          placeholder='Ej: Estado final del equipo, pieza reemplazada, prueba de funcionamiento...'
                          value={photo.description || ''}
                          onChange={(e) =>
                            handlePhotoDescriptionChange(index, e.target.value)
                          }
                          inputProps={{ maxLength: 250 }}
                          helperText={`${(photo.description || '').length}/250 caracteres`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>
          </Collapse>
        </Box>

        {signaturesEnabled && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: '12px',
              border: '1px solid #dbeafe',
              backgroundColor: '#f8fbff'
            }}
          >
            <Box display='flex' alignItems='center' gap={1} mb={1.5}>
              <Draw sx={{ color: '#2563eb' }} />
              <Typography variant='h6' fontWeight={600} sx={{ color: '#0f172a' }}>
                Firma del técnico
              </Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              La firma del cliente puede registrarse después. Para completar el ticket necesitamos dejar confirmada la firma del técnico.
            </Typography>

            {storedTechnicianSignature ? (
              <Box>
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
                    src={storedTechnicianSignature}
                    alt={`Firma de ${technicianName || 'técnico'}`}
                    sx={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain' }}
                  />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                  Se usará la firma guardada de {technicianName || 'este técnico'}.
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
                label='Firma del técnico *'
                helperText={
                  technicianSignatureError ||
                  'La guardaremos para reutilizarla automáticamente en próximos cierres.'
                }
              />
            ) : (
              <Alert severity='warning'>
                Este ticket no tiene una firma de técnico disponible. Debes registrar una para poder completarlo.
              </Alert>
            )}
          </Paper>
        )}

        {/* Costs Section Header */}
        <Typography
          variant='h6'
          fontWeight={600}
          gutterBottom
          sx={{ mb: 2, color: '#10b981' }}
        >
          Costos del Servicio (Opcional)
        </Typography>

        {/* Costs List */}
        {costs.map((cost, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fafafa',
              position: 'relative'
            }}
          >
            {/* Delete Button */}
            <IconButton
              onClick={() => handleRemoveCost(index)}
              disabled={costs.length === 1}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#dc2626',
                '&:disabled': { opacity: 0.3 }
              }}
            >
              <Delete />
            </IconButton>

            <Grid container spacing={2}>
              {/* Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label='Nombre del Costo'
                  placeholder='Ej: Repuesto filtro, Transporte, Mano de obra'
                  value={cost.name}
                  onChange={(e) =>
                    handleCostChange(index, 'name', e.target.value)
                  }
                  error={!!errors[index]?.name}
                  helperText={errors[index]?.name || 'Tipo de costo o concepto'}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Descripción (Opcional)'
                  placeholder='Detalles adicionales...'
                  value={cost.description}
                  onChange={(e) =>
                    handleCostChange(index, 'description', e.target.value)
                  }
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type='number'
                  label='Monto'
                  placeholder='0'
                  value={cost.amount}
                  onChange={(e) =>
                    handleCostChange(index, 'amount', e.target.value)
                  }
                  error={!!errors[index]?.amount}
                  helperText={errors[index]?.amount}
                  InputProps={{
                    startAdornment: (
                      <AttachMoney sx={{ color: '#10b981', mr: 0.5 }} />
                    )
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}

        {/* Add Button */}
        <Button
          fullWidth
          variant='outlined'
          startIcon={<Add />}
          onClick={handleAddCost}
          disabled={loading}
          sx={{
            borderRadius: '12px',
            borderColor: '#10b981',
            color: '#10b981',
            borderStyle: 'dashed',
            borderWidth: 2,
            py: 1.5,
            '&:hover': {
              borderColor: '#2f7d32',
              backgroundColor: '#f8fafc',
              borderStyle: 'solid'
            }
          }}
        >
          Agregar otro costo
        </Button>

        {/* Total */}
        <Paper
          sx={{
            ...surfaceSx,
            p: 2,
            mt: 3,
            borderColor: '#bbf7d0'
          }}
        >
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6' fontWeight={600}>
              Total de Costos
            </Typography>
            <Typography variant='h4' fontWeight={700} color='#166534'>
              {formatCurrency(calculateTotal())}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{ px: 3, py: 2, background: '#fafafa', gap: 1, flexWrap: 'wrap' }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant='outlined'
          sx={{ borderRadius: '12px', minHeight: 48 }}
        >
          Cancelar
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handleCompleteWithoutCosts}
          disabled={loading || !isWorkPerformedValid}
          variant='outlined'
          sx={{
            borderRadius: '12px',
            borderColor: '#d1d5db',
            color: '#334155',
            minHeight: 48,
            fontWeight: 600,
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc'
            },
            '&:disabled': {
              borderColor: '#e5e7eb',
              color: '#9ca3af'
            }
          }}
        >
          Completar sin costos
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          sx={{
            borderRadius: '12px',
            backgroundColor: '#2f7d32',
            minHeight: 48,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#27672a'
            },
            '&:disabled': {
              background: '#e5e7eb',
              color: '#9ca3af'
            }
          }}
        >
          {loading ? 'Completando...' : 'Completar con costos'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompletionCostsDialog
