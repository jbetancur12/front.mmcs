import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
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

import { DetailField } from './CalibrationServiceDetailBlocks'
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
        <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
          {canGeneratePdf ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={onGeneratePdf}
              disabled={isBusy}
              sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
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
              sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
            >
              Enviar formato
            </Button>
          ) : null}
          {canRegisterMovement ? (
            <Button
              variant='outlined'
              startIcon={<LocalShippingOutlinedIcon />}
              onClick={onRegisterMovement}
              disabled={isBusy}
              sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
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
              sx={{ bgcolor: '#00BFA5', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
            >
              Diligenciar formato
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
            <Chip
              variant='outlined'
              color={controlSheet.intakeDate ? 'success' : 'default'}
              label={`Ingreso: ${formatDate(controlSheet.intakeDate)}`}
            />
            <Chip
              variant='outlined'
              color={controlSheet.deliveryDate ? 'info' : 'default'}
              label={`Entrega: ${formatDate(controlSheet.deliveryDate)}`}
            />
            <Chip
              variant='outlined'
              color={filledRows.length ? 'success' : 'default'}
              label={`Equipos diligenciados: ${filledRows.length}`}
            />
          </Stack>

          <Divider />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
                Solicitante
              </Typography>
              <Stack spacing={1.5}>
                <DetailField label='Empresa'>{controlSheet.requesterCompanyName || 'Sin registrar'}</DetailField>
                <DetailField label='Oferta'>{controlSheet.requesterOfferNumber || 'Sin registrar'}</DetailField>
                <DetailField label='Contacto'>{controlSheet.requesterContactName || 'Sin registrar'}</DetailField>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
                Validaciones
              </Typography>
              <Stack spacing={1.5}>
                <DetailField label='Autoriza codificación'>{formatYesNo(controlSheet.noSerialAuthorization)}</DetailField>
                <DetailField label='Define puntos de calibración'>{formatYesNo(controlSheet.calibrationPointsRequested)}</DetailField>
                <DetailField label='Condición especial'>{formatYesNo(controlSheet.specialCondition)}</DetailField>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
                Documentos
              </Typography>
              <Stack spacing={1.5}>
                <DetailField label='Certificado'>{formatYesNo(controlSheet.calibrationCertificateIncluded)}</DetailField>
                <DetailField label='Estampilla'>{formatYesNo(controlSheet.stampIncluded)}</DetailField>
                <DetailField label='Última actualización'>{formatDateTime(controlSheet.lastUpdatedAt)}</DetailField>
              </Stack>
            </Grid>
          </Grid>

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
