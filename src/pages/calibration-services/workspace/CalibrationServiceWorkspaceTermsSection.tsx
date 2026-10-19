import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Stack,
  Typography
} from '@mui/material'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import CalibrationServiceRichTextEditor from '../CalibrationServiceRichTextEditor'
import {
  CALIBRATION_QUOTE_TERM_KEYS,
  CALIBRATION_QUOTE_TERM_LABELS
} from '../calibrationQuoteTerms'
import { sectionCardSx } from './calibrationServiceWorkspaceConstants'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'

interface CalibrationServiceWorkspaceTermsSectionProps {
  form: CalibrationServiceWorkspaceForm
  canEdit: boolean
  isBusy: boolean
}

/** Paso 3: términos de la cotización (snapshot del servicio, no de la plantilla global). */
const CalibrationServiceWorkspaceTermsSection = ({
  form,
  canEdit,
  isBusy
}: CalibrationServiceWorkspaceTermsSectionProps) => {
  const { formState, setQuoteTerm } = form

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
          <UploadFileOutlinedIcon sx={{ color: '#00897B', fontSize: 22 }} />
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Términos
          </Typography>
        </Stack>
        <Stack spacing={2}>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Este bloque se deja al final para ajustar la última hoja de la
              cotización. Al guardar, los términos quedan como snapshot de este
              servicio sin afectar la plantilla global. Para modificar la plantilla
              que se precarga en servicios nuevos, usa el botón &quot;Plantilla
              términos&quot; en la bandeja de entrada.
            </Typography>
          </Box>
          <Alert severity='info'>
            Puedes usar variables dentro del texto. Al generar el PDF se reemplazan
            automáticamente por los valores de esta cotización:
            <Box component='ul' sx={{ mt: 1, mb: 0, pl: 3 }}>
              <li><strong>{'{{validityDays}}'}</strong>: validez de la oferta.</li>
              <li><strong>{'{{paymentMethod}}'}</strong>: forma de pago acordada.</li>
              <li><strong>{'{{instrumentDeliveryTime}}'}</strong>: tiempo de entrega de los equipos.</li>
              <li><strong>{'{{certificateDeliveryTime}}'}</strong>: tiempo de entrega de los certificados.</li>
            </Box>
          </Alert>
          {CALIBRATION_QUOTE_TERM_KEYS.map((termKey) => (
            <Accordion
              key={termKey}
              disableGutters
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                <Typography fontWeight={800}>
                  {CALIBRATION_QUOTE_TERM_LABELS[termKey]}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CalibrationServiceRichTextEditor
                  value={formState.quoteTerms?.[termKey] || ''}
                  disabled={!canEdit || isBusy}
                  placeholder={`Escribe ${CALIBRATION_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                  onChange={(value) => setQuoteTerm(termKey, value)}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceWorkspaceTermsSection
