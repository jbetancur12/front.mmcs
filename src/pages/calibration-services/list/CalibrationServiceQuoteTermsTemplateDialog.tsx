import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { toast } from 'react-hot-toast'
import { CalibrationServiceQuoteTerms } from '../../../types/calibrationService'
import CalibrationServiceRichTextEditor from '../CalibrationServiceRichTextEditor'
import {
  CALIBRATION_QUOTE_TERM_KEYS,
  CALIBRATION_QUOTE_TERM_LABELS
} from '../calibrationQuoteTerms'

interface CalibrationServiceQuoteTermsTemplateDialogProps {
  open: boolean
  terms: CalibrationServiceQuoteTerms
  isSaving: boolean
  onClose: () => void
  onChangeTerm: (key: string, value: string) => void
  onSave: () => void
}

/** Diálogo para editar la plantilla global de términos y condiciones de las cotizaciones. */
const CalibrationServiceQuoteTermsTemplateDialog = ({
  open,
  terms,
  isSaving,
  onClose,
  onChangeTerm,
  onSave
}: CalibrationServiceQuoteTermsTemplateDialogProps) => (
      <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Plantilla de términos y condiciones
          <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 400 }}>
            Se carga por defecto al crear una cotización nueva.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2' sx={{ mb: 1 }}>
            Variables que se reemplazan con los datos de cada cotización. Toca una para copiarla.
          </Typography>
          <Stack spacing={1} sx={{ mb: 2.5 }}>
            {[
              { variable: 'validityDays', meaning: 'Días de validez de la oferta' },
              { variable: 'paymentMethod', meaning: 'Forma de pago de la cotización' },
              { variable: 'instrumentDeliveryTime', meaning: 'Tiempo de entrega de los equipos' },
              { variable: 'certificateDeliveryTime', meaning: 'Tiempo de entrega de los certificados' }
            ].map(({ variable, meaning }) => (
              <Stack key={variable} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} alignItems={{ sm: 'center' }}>
                <Tooltip title='Copiar variable'>
                  <Chip
                    label={`{{${variable}}}`}
                    size='small'
                    variant='outlined'
                    onClick={() => {
                      navigator.clipboard?.writeText(`{{${variable}}}`)
                      toast.success('Variable copiada')
                    }}
                    sx={{ fontFamily: 'monospace', alignSelf: 'flex-start', borderColor: '#00BFA5', color: '#00695C', '&:hover': { bgcolor: '#E0F7F4' } }}
                  />
                </Tooltip>
                <Typography variant='body2' color='text.secondary'>
                  {meaning}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {CALIBRATION_QUOTE_TERM_KEYS.map((termKey) => {
              const isEmpty = !(terms[termKey] || '').replace(/<[^>]*>/g, '').trim()
              return (
                <Accordion
                  key={termKey}
                  disableGutters
                  elevation={0}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '100%', pr: 1 }} spacing={1}>
                      <Typography fontWeight={600}>
                        {CALIBRATION_QUOTE_TERM_LABELS[termKey]}
                      </Typography>
                      <Typography variant='caption' sx={{ color: isEmpty ? '#b45309' : '#00695C', fontWeight: 600 }}>
                        {isEmpty ? 'Sin texto' : 'Con texto'}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CalibrationServiceRichTextEditor
                      value={terms[termKey] || ''}
                      placeholder={`Escribe ${CALIBRATION_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                      onChange={(value) => onChangeTerm(termKey, value)}
                    />
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button
            variant='contained'
            startIcon={<SaveOutlinedIcon />}
            onClick={onSave}
            disabled={isSaving}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00ACC1' } }}
          >
            Guardar plantilla
          </Button>
        </DialogActions>
      </Dialog>
)

export default CalibrationServiceQuoteTermsTemplateDialog
