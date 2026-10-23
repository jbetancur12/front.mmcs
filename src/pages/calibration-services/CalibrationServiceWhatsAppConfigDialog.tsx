import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FormDialog from '../../Components/Common/FormDialog'
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
    <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '12px' }}>
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

  const hasAnyChange = WHATSAPP_CONFIG_OPTIONS.some((opt) =>
    hasChanges(opt.type)
  )

  return (
    <FormDialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      title='Configuración de WhatsApp'
      subtitle='Los números a notificar por cada evento. El metrólogo se notifica solo, con el teléfono de su perfil.'
      submitLabel='Guardar'
      onSubmit={() => void handleSave()}
      loading={saving}
      submitDisabled={isLoading || !hasAnyChange}
    >
      {isLoading ? (
        <Box display='flex' justifyContent='center' py={4}>
          <CircularProgress size={24} sx={{ color: '#00BFA5' }} />
        </Box>
      ) : (
        <Stack spacing={2}>
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
    </FormDialog>
  )
}

export default CalibrationServiceWhatsAppConfigDialog
