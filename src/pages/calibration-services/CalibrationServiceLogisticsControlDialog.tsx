import { ChangeEvent, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  CalibrationServiceLogisticsControlItem,
  CalibrationServiceLogisticsControlSheet
} from '../../types/calibrationService'

export interface CalibrationServiceLogisticsControlDialogValues
  extends CalibrationServiceLogisticsControlSheet {}

interface Props {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceLogisticsControlDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (
    values: CalibrationServiceLogisticsControlDialogValues
  ) => void | Promise<void>
}

const YES_NO_OPTIONS = [
  { value: '', label: 'Sin definir' },
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' }
]

const INSPECTION_OPTIONS = [
  { value: '', label: '-' },
  { value: 'B', label: 'B' },
  { value: 'M', label: 'M' },
  { value: 'NA', label: 'NA' },
  { value: 'SI', label: 'SI' }
]

const SERVICE_SCOPE_OPTIONS = [
  { value: 'NA', label: 'NA' },
  { value: 'AC', label: 'AC' }
]

const createEmptyItem = (rowNumber: number): CalibrationServiceLogisticsControlItem => ({
  rowNumber,
  equipmentName: '',
  brand: '',
  model: '',
  serialNumber: '',
  assetNumber: '',
  location: '',
  serviceScope: 'NA',
  physicalInspectionIn: null,
  physicalInspectionOut: null,
  operationalInspectionIn: null,
  operationalInspectionOut: null
})

const toBooleanString = (value?: boolean | null) =>
  value === true ? 'true' : value === false ? 'false' : ''

const fromBooleanString = (value: string) =>
  value === 'true' ? true : value === 'false' ? false : null

const CalibrationServiceLogisticsControlDialog = ({
  open,
  serviceCode,
  initialValues,
  isLoading = false,
  onClose,
  onSubmit
}: Props) => {
  const [values, setValues] =
    useState<CalibrationServiceLogisticsControlDialogValues>(initialValues)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
    }
  }, [initialValues, open])

  const handleChange =
    (field: keyof CalibrationServiceLogisticsControlDialogValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }))
    }

  const handleBooleanChange =
    (
      field:
        | 'noSerialAuthorization'
        | 'calibrationPointsRequested'
        | 'specialCondition'
        | 'calibrationCertificateIncluded'
        | 'stampIncluded'
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: fromBooleanString(event.target.value)
      }))
    }

  const handleItemChange =
    (
      index: number,
      field: keyof CalibrationServiceLogisticsControlItem
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        items: current.items.map((item, currentIndex) =>
          currentIndex === index
            ? {
                ...item,
                [field]:
                  field === 'physicalInspectionIn' ||
                  field === 'physicalInspectionOut' ||
                  field === 'operationalInspectionIn' ||
                  field === 'operationalInspectionOut'
                    ? (event.target.value || null)
                    : event.target.value
              }
            : item
        )
      }))
    }

  const handleAddRow = () => {
    setValues((current) => ({
      ...current,
      items: [...current.items, createEmptyItem(current.items.length + 1)]
    }))
  }

  const handleRemoveRow = (index: number) => {
    setValues((current) => {
      const nextItems = current.items
        .filter((_, currentIndex) => currentIndex !== index)
        .map((item, rowIndex) => ({
          ...item,
          rowNumber: rowIndex + 1
        }))

      return {
        ...current,
        items: nextItems.length ? nextItems : [createEmptyItem(1)]
      }
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='xl'>
      <DialogTitle>Control de ingreso y entrega</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Diligencia el formato formal de recepción y entrega para{' '}
            <strong>{serviceCode}</strong>. El contenido se usará para el PDF oficial
            de logística.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Fecha de ingreso'
                value={values.intakeDate || ''}
                onChange={handleChange('intakeDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Fecha de entrega'
                value={values.deliveryDate || ''}
                onChange={handleChange('deliveryDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
              Información de quien solicita calibración
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Razón social'
                  value={values.requesterCompanyName || ''}
                  onChange={handleChange('requesterCompanyName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='No. de oferta'
                  value={values.requesterOfferNumber || ''}
                  onChange={handleChange('requesterOfferNumber')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Dirección'
                  value={values.requesterAddress || ''}
                  onChange={handleChange('requesterAddress')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Teléfono'
                  value={values.requesterPhone || ''}
                  onChange={handleChange('requesterPhone')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Ciudad'
                  value={values.requesterCity || ''}
                  onChange={handleChange('requesterCity')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Contacto'
                  value={values.requesterContactName || ''}
                  onChange={handleChange('requesterContactName')}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent='space-between'
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant='subtitle1' fontWeight={700}>
                Información e inspección de equipos
              </Typography>
              <Button startIcon={<AddOutlinedIcon />} onClick={handleAddRow}>
                Agregar fila
              </Button>
            </Stack>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Equipo / instrumento</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Serial</TableCell>
                  <TableCell>Activo fijo / inventario</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Fís. ingreso</TableCell>
                  <TableCell>Fís. entrega</TableCell>
                  <TableCell>Oper. ingreso</TableCell>
                  <TableCell>Oper. entrega</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {values.items.map((item, index) => (
                  <TableRow key={`${item.serviceItemId || 'manual'}-${index}`}>
                    <TableCell>{item.rowNumber}</TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.equipmentName}
                        onChange={handleItemChange(index, 'equipmentName')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.brand || ''}
                        onChange={handleItemChange(index, 'brand')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.model || ''}
                        onChange={handleItemChange(index, 'model')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.serialNumber || ''}
                        onChange={handleItemChange(index, 'serialNumber')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.assetNumber || ''}
                        onChange={handleItemChange(index, 'assetNumber')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size='small'
                        value={item.location || ''}
                        onChange={handleItemChange(index, 'location')}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size='small'
                        value={item.serviceScope}
                        onChange={handleItemChange(index, 'serviceScope')}
                      >
                        {SERVICE_SCOPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    {(
                      [
                        'physicalInspectionIn',
                        'physicalInspectionOut',
                        'operationalInspectionIn',
                        'operationalInspectionOut'
                      ] as const
                    ).map((field) => (
                      <TableCell key={field}>
                        <TextField
                          select
                          fullWidth
                          size='small'
                          value={item[field] || ''}
                          onChange={handleItemChange(index, field)}
                        >
                          {INSPECTION_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton
                        size='small'
                        onClick={() => handleRemoveRow(index)}
                        disabled={values.items.length <= 1}
                      >
                        <DeleteOutlineOutlinedIcon fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
              B: Buen estado · M: Mal estado · NA: No aplica · SI: Sin información.
            </Typography>
          </Paper>

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
              Validaciones y observaciones
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Autoriza codificación si no tiene serial'
                  value={toBooleanString(values.noSerialAuthorization)}
                  onChange={handleBooleanChange('noSerialAuthorization')}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Desea establecer puntos de calibración'
                  value={toBooleanString(values.calibrationPointsRequested)}
                  onChange={handleBooleanChange('calibrationPointsRequested')}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Cuáles'
                  value={values.calibrationPointsDetails || ''}
                  onChange={handleChange('calibrationPointsDetails')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Condición especial de operación'
                  value={toBooleanString(values.specialCondition)}
                  onChange={handleBooleanChange('specialCondition')}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label='Detalles de condición especial'
                  value={values.specialConditionDetails || ''}
                  onChange={handleChange('specialConditionDetails')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Entrega certificado de calibración'
                  value={toBooleanString(values.calibrationCertificateIncluded)}
                  onChange={handleBooleanChange('calibrationCertificateIncluded')}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Entrega estampilla'
                  value={toBooleanString(values.stampIncluded)}
                  onChange={handleBooleanChange('stampIncluded')}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label='Observaciones'
                  value={values.observations || ''}
                  onChange={handleChange('observations')}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
              Recibido, enviado y firmas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Transportadora recibido'
                  value={values.receivedTransportCompany || ''}
                  onChange={handleChange('receivedTransportCompany')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Guía recibida'
                  value={values.receivedGuide || ''}
                  onChange={handleChange('receivedGuide')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Transportadora enviado'
                  value={values.sentTransportCompany || ''}
                  onChange={handleChange('sentTransportCompany')}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Guía enviada'
                  value={values.sentGuide || ''}
                  onChange={handleChange('sentGuide')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Recibido por Metromedics'
                  value={values.receivedByMetromedicsName || ''}
                  onChange={handleChange('receivedByMetromedicsName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Cargo recibido por Metromedics'
                  value={values.receivedByMetromedicsRole || ''}
                  onChange={handleChange('receivedByMetromedicsRole')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Entregado por Metromedics'
                  value={values.deliveredByMetromedicsName || ''}
                  onChange={handleChange('deliveredByMetromedicsName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Cargo entregado por Metromedics'
                  value={values.deliveredByMetromedicsRole || ''}
                  onChange={handleChange('deliveredByMetromedicsRole')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Entregado al cliente'
                  value={values.deliveredToClientName || ''}
                  onChange={handleChange('deliveredToClientName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Firma entregado al cliente'
                  value={values.deliveredToClientSignature || ''}
                  onChange={handleChange('deliveredToClientSignature')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Recibido por cliente'
                  value={values.receivedByClientName || ''}
                  onChange={handleChange('receivedByClientName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Firma recibido por cliente'
                  value={values.receivedByClientSignature || ''}
                  onChange={handleChange('receivedByClientSignature')}
                />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={() => void onSubmit(values)} disabled={isLoading}>
          Guardar ficha logística
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceLogisticsControlDialog
