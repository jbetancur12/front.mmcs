import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import {
  CalibrationServiceLogisticsControlSheet,
  CalibrationServicePhysicalTraceabilityEntry
} from '../../types/calibrationService'

interface Props {
  controlSheet: CalibrationServiceLogisticsControlSheet
  entries: CalibrationServicePhysicalTraceabilityEntry[]
  canManageControl: boolean
  canRegisterMovement: boolean
  canGeneratePdf: boolean
  canSendEmail: boolean
  isBusy?: boolean
  onEditControl: () => void
  onRegisterMovement: () => void
  onGeneratePdf: () => void
  onSendEmail: () => void
}

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : 'Sin registrar'

const formatDate = (value?: string | null) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-CO') : 'Sin registrar'

const formatYesNo = (value?: boolean | null) =>
  value === true ? 'Sí' : value === false ? 'No' : 'Sin definir'

const CalibrationServiceLogisticsPanel = ({
  controlSheet,
  entries,
  canManageControl,
  canRegisterMovement,
  canGeneratePdf,
  canSendEmail,
  isBusy = false,
  onEditControl,
  onRegisterMovement,
  onGeneratePdf,
  onSendEmail
}: Props) => {
  const filledRows = (controlSheet.items || []).filter(
    (item) =>
      item.equipmentName ||
      item.brand ||
      item.model ||
      item.serialNumber ||
      item.assetNumber
  )

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        spacing={1.5}
      >
        <Box>
          <Typography variant='subtitle1' fontWeight={700}>
            Control de ingreso y entrega
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Aquí diligencias el formato formal que usa el laboratorio al recibir y
            entregar equipos.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          {canGeneratePdf ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={onGeneratePdf}
              disabled={isBusy}
            >
              Generar PDF
            </Button>
          ) : null}
          {canSendEmail ? (
            <Button
              variant='outlined'
              startIcon={<EmailOutlinedIcon />}
              onClick={onSendEmail}
              disabled={isBusy}
            >
              Enviar correo
            </Button>
          ) : null}
          {canRegisterMovement ? (
            <Button
              variant='outlined'
              startIcon={<LocalShippingOutlinedIcon />}
              onClick={onRegisterMovement}
              disabled={isBusy}
            >
              Registrar movimiento
            </Button>
          ) : null}
          {canManageControl ? (
            <Button
              variant='contained'
              startIcon={<DescriptionOutlinedIcon />}
              onClick={onEditControl}
              disabled={isBusy}
            >
              Diligenciar formato
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Chip
              color={controlSheet.intakeDate ? 'success' : 'default'}
              label={`Ingreso: ${formatDate(controlSheet.intakeDate)}`}
            />
            <Chip
              color={controlSheet.deliveryDate ? 'info' : 'default'}
              label={`Entrega: ${formatDate(controlSheet.deliveryDate)}`}
            />
            <Chip
              color={filledRows.length ? 'secondary' : 'default'}
              label={`Equipos diligenciados: ${filledRows.length}`}
            />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle2' fontWeight={700}>
                Solicitante
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {controlSheet.requesterCompanyName || 'Sin registrar'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Oferta: {controlSheet.requesterOfferNumber || 'Sin registrar'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Contacto: {controlSheet.requesterContactName || 'Sin registrar'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle2' fontWeight={700}>
                Validaciones
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Autoriza codificación: {formatYesNo(controlSheet.noSerialAuthorization)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Define puntos de calibración:{' '}
                {formatYesNo(controlSheet.calibrationPointsRequested)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Condición especial: {formatYesNo(controlSheet.specialCondition)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle2' fontWeight={700}>
                Documentos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Certificado: {formatYesNo(controlSheet.calibrationCertificateIncluded)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Estampilla: {formatYesNo(controlSheet.stampIncluded)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Última actualización:{' '}
                {formatDateTime(controlSheet.lastUpdatedAt)}
              </Typography>
            </Box>
          </Stack>

          {filledRows.length ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Equipo</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Serial</TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell>Fís. ingreso</TableCell>
                    <TableCell>Fís. entrega</TableCell>
                    <TableCell>Oper. ingreso</TableCell>
                    <TableCell>Oper. entrega</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filledRows.map((item) => (
                    <TableRow key={`${item.serviceItemId || 'manual'}-${item.rowNumber}`}>
                      <TableCell>{item.rowNumber}</TableCell>
                      <TableCell>{item.equipmentName || 'Sin registrar'}</TableCell>
                      <TableCell>{item.brand || '—'}</TableCell>
                      <TableCell>{item.model || '—'}</TableCell>
                      <TableCell>{item.serialNumber || '—'}</TableCell>
                      <TableCell>{item.serviceScope || '—'}</TableCell>
                      <TableCell>{item.physicalInspectionIn || '—'}</TableCell>
                      <TableCell>{item.physicalInspectionOut || '—'}</TableCell>
                      <TableCell>{item.operationalInspectionIn || '—'}</TableCell>
                      <TableCell>{item.operationalInspectionOut || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Alert severity='info'>
              Aún no se ha diligenciado la ficha formal de ingreso y entrega para este
              servicio.
            </Alert>
          )}

          {controlSheet.observations ? (
            <Box>
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 0.5 }}>
                Observaciones
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {controlSheet.observations}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Paper>

      <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>
          Movimientos físicos rápidos
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Este historial sigue sirviendo como bitácora operativa corta de recogidas y
          entregas.
        </Typography>
        {entries.length ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Movimiento</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Registrado por</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Chip
                        size='small'
                        color={entry.movementType === 'pickup' ? 'warning' : 'success'}
                        label={entry.movementType === 'pickup' ? 'Recogida' : 'Entrega'}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(entry.occurredAt)}</TableCell>
                    <TableCell>
                      {entry.contactName}
                      {entry.contactRole ? ` · ${entry.contactRole}` : ''}
                    </TableCell>
                    <TableCell>{entry.location || 'Sin registrar'}</TableCell>
                    <TableCell>{entry.notes || 'Sin observaciones'}</TableCell>
                    <TableCell>{entry.recordedByName || 'Sistema'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Alert severity='info'>
            Aún no hay movimientos físicos rápidos registrados para este servicio.
          </Alert>
        )}
      </Paper>
    </Stack>
  )
}

export default CalibrationServiceLogisticsPanel
