import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { Download, OpenInNew, Refresh } from '@mui/icons-material'
import { techErrorMessage, useRegenerateQr } from '@hooks/useTechManagement'
import { CustomerEquipment } from 'src/types/techManagement'
import { confirmAction, notifyError, notifySuccess, primaryButtonSx } from './techUi'

export const publicEquipmentUrl = (token: string) => `${window.location.origin}/equipo/${token}`

interface Props {
  customerId: string
  equipment: CustomerEquipment | null
  canManage: boolean
  onClose: () => void
}

/** Código QR del equipo: abre su hoja de vida pública y permite reportar una falla sin iniciar sesión. */
const EquipmentQrDialog = ({ customerId, equipment, canManage, onClose }: Props) => {
  const wrapper = useRef<HTMLDivElement>(null)
  const regenerate = useRegenerateQr(customerId)
  if (!equipment) return null
  const url = publicEquipmentUrl(equipment.publicToken)

  const download = () => {
    const canvas = wrapper.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr_${equipment.name}_${equipment.serie || equipment.id}.png`.replace(/[^\w.-]+/g, '_')
    link.click()
  }

  const handleRegenerate = async () => {
    const ok = await confirmAction(
      '¿Generar un código nuevo?',
      'El código impreso actual dejará de funcionar y habrá que pegar la etiqueta nueva.',
      'Generar código nuevo'
    )
    if (!ok) return
    try {
      await regenerate.mutateAsync(equipment.id)
      notifySuccess('Código QR regenerado')
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo regenerar el código'))
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>Código QR del equipo</DialogTitle>
      <DialogContent>
        <Box ref={wrapper} display='flex' flexDirection='column' alignItems='center' gap={1.5}>
          <QRCodeCanvas value={url} size={220} includeMargin level='M' />
          <Typography fontWeight={600} textAlign='center'>
            {equipment.name}
          </Typography>
          <Typography variant='caption' color='text.secondary' textAlign='center'>
            {[equipment.brand, equipment.model, equipment.serie && `Serie ${equipment.serie}`].filter(Boolean).join(' · ')}
          </Typography>
          <Typography variant='caption' color='text.secondary' textAlign='center'>
            Al escanearlo se ve la hoja de vida resumida y se puede reportar una falla.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        {canManage && (
          <Button color='warning' startIcon={<Refresh />} onClick={handleRegenerate} sx={{ textTransform: 'none', mr: 'auto' }}>
            Regenerar
          </Button>
        )}
        <Button startIcon={<OpenInNew />} href={url} target='_blank' rel='noopener noreferrer' sx={{ textTransform: 'none' }}>
          Abrir
        </Button>
        <Button variant='contained' startIcon={<Download />} onClick={download} sx={primaryButtonSx}>
          Descargar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EquipmentQrDialog
