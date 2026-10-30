import { ReactNode, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'

const IMAGES = '/ayuda/facturacion'

interface Step {
  title: string
  body: ReactNode
  images?: Array<{ file: string; caption: string }>
}

const STEPS: Step[] = [
  {
    title: 'Mira lo que te toca',
    body: (
      <>
        Arriba de la bandeja, <b>Mis pendientes</b> muestra tus tareas. Haz clic
        en una tarjeta y la lista se filtra. Los botones de abajo (Por facturar,
        Sin pago, Por cobrar y Facturados) hacen lo mismo.
        <ul>
          <li>
            <b>Cortes listos para facturar:</b> ya los dejó el laboratorio; te
            toca facturarlos.
          </li>
          <li>
            <b>Cortes de contado sin pago:</b> ya se facturaron y el cliente
            paga antes de recibir certificados. Hasta que registres el pago, los
            certificados no se pueden enviar.
          </li>
          <li>
            <b>Crédito por cobrar:</b> ya se facturaron a un cliente con
            crédito. No bloquea nada; registra el pago cuando el cliente pague.
          </li>
        </ul>
      </>
    ),
    images: [
      {
        file: '01-pendientes.png',
        caption: 'Mis pendientes, el embudo de etapas y los botones de filtro.'
      }
    ]
  },
  {
    title: 'Marca el corte como facturado',
    body: (
      <>
        Abre el servicio, entra a la pestaña <b>Cortes</b> y, en el corte que
        dice <i>Listo para facturar</i>, pulsa <b>Marcar facturado</b>. Te pide:
        <ul>
          <li>
            <b>Cliente con crédito:</b> Sí o No. Si eliges <i>No</i>, después se
            te pedirá registrar el pago.
          </li>
          <li>
            <b>Referencia o número de factura</b> (la de tu programa contable) y
            la <b>fecha</b>.
          </li>
          <li>Notas y soporte de la factura, opcionales.</li>
        </ul>
        Si el botón aparece gris con un aviso, es porque hay una novedad abierta
        en los ítems de ese corte: el laboratorio o comercial debe resolverla
        primero.
      </>
    ),
    images: [
      { file: '02-corte-listo.png', caption: 'El corte listo para facturar.' },
      { file: '03-dialogo-facturar.png', caption: 'Datos que pide la factura.' }
    ]
  },
  {
    title: 'Registra el pago',
    body: (
      <>
        Cuando el corte está facturado y el cliente ya pagó, pulsa{' '}
        <b>Registrar pago</b> y confirma. La etiqueta del corte te dice en qué
        caso está: <i>Contado: sin pago</i> o <i>Crédito: por cobrar</i>.
        <ul>
          <li>
            <b>Contado:</b> el botón es naranja. Al registrarlo se habilita el
            control y el envío de certificados.
          </li>
          <li>
            <b>Crédito:</b> el botón es discreto. Solo cierra la cuenta por
            cobrar; los certificados ya se podían enviar.
          </li>
        </ul>
        El pago no se puede deshacer, así que confirma que ya lo recibiste.
      </>
    ),
    images: [
      {
        file: '04-contado-sin-pago.png',
        caption: 'Corte de contado facturado, pendiente de pago.'
      },
      { file: '05-confirmar-pago.png', caption: 'Confirmación del pago.' },
      {
        file: '07-credito-por-cobrar.png',
        caption: 'Corte a crédito: por cobrar.'
      }
    ]
  },
  {
    title: 'Si te equivocas con la factura',
    body: (
      <>
        En el corte, abre <b>Corregir</b> y elige <b>Corregir factura</b>.
        Escribes la referencia correcta y el motivo; queda en el historial del
        servicio. Un corte ya facturado no se puede devolver.
      </>
    ),
    images: [
      { file: '06-corregir-factura.png', caption: 'Menú Corregir del corte.' }
    ]
  },
  {
    title: 'Y después, el sistema sigue solo',
    body: (
      <>
        Metrología controla y envía los certificados. Cuando todo está
        facturado, pagado (en contado) y con certificados enviados, el servicio
        se <b>cierra solo</b>: no tienes que cerrarlo.
      </>
    )
  }
]

const TROUBLESHOOTING = (
  <>
    <b>¿No ves un botón?</b> Puede faltar el permiso (pídele al administrador la
    capacidad <i>Marcar un corte como facturado y registrar su pago</i>), o el
    servicio está pausado, cancelado o cerrado.{' '}
    <b>¿La lista sale en rojo con cortes que ya pagaron?</b> Son del atraso
    histórico: operación los está poniendo al día.
  </>
)

const GuideDialog = ({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth='md'
    scroll='paper'
    aria-labelledby='billing-guide-title'
  >
    <DialogTitle id='billing-guide-title' sx={{ pr: 6 }}>
      <Typography variant='h6' fontWeight={700} component='span'>
        Guía de facturación y cobro
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Qué hacer con cada corte, paso a paso.
      </Typography>
      <IconButton
        aria-label='Cerrar'
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <Stack spacing={3}>
        {STEPS.map((step, index) => (
          <Stack
            key={step.title}
            direction='row'
            spacing={2}
            alignItems='flex-start'
          >
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#00BFA5',
                color: '#fff',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center'
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                {step.title}
              </Typography>
              <Typography
                component='div'
                variant='body2'
                sx={{
                  '& ul': { mt: 0.5, mb: 1, pl: 2.5, listStyle: 'disc' },
                  '& li': { mb: 0.5 }
                }}
              >
                {step.body}
              </Typography>
              {step.images?.length ? (
                <Box
                  sx={{
                    mt: 1,
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      sm: 'repeat(auto-fit, minmax(0, 1fr))'
                    }
                  }}
                >
                  {step.images.map((image) => (
                    <Box key={image.file} component='figure' sx={{ m: 0 }}>
                      <Box
                        component='img'
                        src={`${IMAGES}/${image.file}`}
                        alt={image.caption}
                        loading='lazy'
                        sx={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                      <Typography
                        component='figcaption'
                        variant='caption'
                        color='text.secondary'
                      >
                        {image.caption}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Stack>
        ))}
        <Alert severity='info' sx={{ '& b': { fontWeight: 700 } }}>
          {TROUBLESHOOTING}
        </Alert>
      </Stack>
    </DialogContent>
  </Dialog>
)

/**
 * Botón "Guía de facturación" que abre la ayuda paso a paso con capturas. Solo para quien puede facturar (capacidad
 * calibration:service:invoicing); el resto no la necesita.
 */
const CalibrationBillingGuide = ({
  compact = false
}: {
  compact?: boolean
}) => {
  const canInvoice = useCan(PERMISSIONS.CALIBRATION_SERVICE_INVOICING)
  const [open, setOpen] = useState(false)

  if (!canInvoice) {
    return null
  }

  return (
    <>
      <Button
        variant={compact ? 'text' : 'outlined'}
        size={compact ? 'small' : 'medium'}
        startIcon={<HelpOutlineIcon />}
        onClick={() => setOpen(true)}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: '#00897B',
          borderColor: '#00BFA5',
          '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
        }}
      >
        Guía de facturación
      </Button>
      <GuideDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default CalibrationBillingGuide
