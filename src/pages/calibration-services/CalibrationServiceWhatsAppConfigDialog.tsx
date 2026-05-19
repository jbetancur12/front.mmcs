import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { toast } from 'react-hot-toast'
import {
  useCalibrationWhatsAppConfigs,
  useCalibrationWhatsAppConfigMutation,
  WHATSAPP_CONFIG_OPTIONS,
  WhatsAppConfig,
} from '../../hooks/useCalibrationWhatsAppConfig'

interface Props {
  open: boolean
  onClose: () => void
}

const ConfigSection = ({
  configOption,
  dbConfig,
  phoneNumbers,
  onChange,
}: {
  configOption: typeof WHATSAPP_CONFIG_OPTIONS[0]
  dbConfig: WhatsAppConfig | undefined
  phoneNumbers: Record<string, string[]>
  onChange: (type: string, phones: string[]) => void
}) => {
  const phones = phoneNumbers[configOption.type] || dbConfig?.phoneNumbers || []

  const addPhone = () => {
    onChange(configOption.type, [...phones, ''])
  }

  const updatePhone = (index: number, value: string) => {
    const updated = [...phones]
    updated[index] = value
    onChange(configOption.type, updated)
  }

  const removePhone = (index: number) => {
    onChange(configOption.type, phones.filter((_, i) => i !== index))
  }

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant='body2' fontWeight={700}>{configOption.label}</Typography>
          <Typography variant='caption' color='text.secondary'>{configOption.description}</Typography>
        </Box>
        <Chip
          size='small'
          label={phones.length > 0 ? `${phones.length} número(s)` : 'Sin configurar'}
          color={phones.length > 0 ? 'success' : 'default'}
          variant='outlined'
          sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.6 } }}
        />
      </Stack>
      <Stack spacing={1}>
        {phones.map((phone, i) => (
          <Stack key={i} direction='row' spacing={1} alignItems='center'>
            <TextField
              size='small'
              placeholder='573001613993'
              value={phone}
              onChange={(e) => updatePhone(i, e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: '0.85rem' } }}
            />
            <IconButton size='small' onClick={() => removePhone(i)} color='error'>
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Stack>
        ))}
        <Button
          size='small'
          startIcon={<AddIcon />}
          onClick={addPhone}
          sx={{ textTransform: 'none', fontSize: '0.8rem', alignSelf: 'flex-start' }}
        >
          Agregar número
        </Button>
      </Stack>
    </Box>
  )
}

const CalibrationServiceWhatsAppConfigDialog = ({ open, onClose }: Props) => {
  const { data: dbConfigs, isLoading } = useCalibrationWhatsAppConfigs()
  const { updateConfig } = useCalibrationWhatsAppConfigMutation()
  const [localPhones, setLocalPhones] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setLocalPhones({})
    }
  }, [open])

  const handlePhonesChange = (type: string, phones: string[]) => {
    setLocalPhones((prev) => ({ ...prev, [type]: phones }))
  }

  const hasChanges = (type: string) => {
    const dbPhones = dbConfigs?.find((c) => c.notificationType === type)?.phoneNumbers || []
    const local = localPhones[type]
    if (!local) return false
    return JSON.stringify(local) !== JSON.stringify(dbPhones)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const typesWithChanges = WHATSAPP_CONFIG_OPTIONS.filter((opt) => hasChanges(opt.type))
      for (const opt of typesWithChanges) {
        const phones = localPhones[opt.type]
        if (phones !== undefined) {
          await updateConfig.mutateAsync({ type: opt.type, phoneNumbers: phones })
        }
      }
      toast.success('Configuración de WhatsApp guardada')
      onClose()
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Stack direction='row' alignItems='center' spacing={1}>
            <SettingsOutlinedIcon fontSize='small' sx={{ color: 'text.secondary' }} />
            <Typography variant='h6' fontWeight={700} sx={{ fontSize: '1rem' }}>
              Configuración de WhatsApp
            </Typography>
          </Stack>
          <IconButton size='small' onClick={onClose}>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Stack>
        <Typography variant='caption' color='text.secondary'>
          Define los números de teléfono a notificar para cada evento. El metrólogo se notifica automáticamente desde su perfil de usuario.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Box display='flex' justifyContent='center' py={4}><CircularProgress size={24} /></Box>
        ) : (
          <Stack spacing={2}>
            <Alert severity='info' sx={{ fontSize: '0.8rem' }}>
              Las notificaciones al metrólogo por asignación usan el teléfono registrado en su perfil de usuario.
            </Alert>
            {WHATSAPP_CONFIG_OPTIONS.map((opt) => (
              <ConfigSection
                key={opt.type}
                configOption={opt}
                dbConfig={dbConfigs?.find((c) => c.notificationType === opt.type)}
                phoneNumbers={localPhones}
                onChange={handlePhonesChange}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: '8px' }} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !WHATSAPP_CONFIG_OPTIONS.some((opt) => hasChanges(opt.type))}
          sx={{ textTransform: 'none', borderRadius: '8px' }}
        >
          {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceWhatsAppConfigDialog
