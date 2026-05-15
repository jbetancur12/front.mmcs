import { ChangeEvent, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
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

  const sectionPaperProps = {
    elevation: 0,
    sx: {
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)'
    }
  }

  const sectionTitleProps = {
    variant: 'subtitle1',
    fontWeight: 600,
    color: 'text.primary'
  } as const

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth='xl'
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.default'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            p: 1,
            borderRadius: 2,
            bgcolor: 'primary.50',
            color: 'primary.main'
          }}
        >
          <AssignmentTurnedInOutlinedIcon />
        </Box>
        <Typography variant='h6' fontWeight={700}>
          Control de ingreso y entrega
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={4}>
          <Alert severity='info' icon={<FactCheckOutlinedIcon />} sx={{ borderRadius: 2 }}>
            Diligencia el formato formal de recepción y entrega para{' '}
            <strong>{serviceCode}</strong>. El contenido se usará para el PDF oficial
            de logística.
          </Alert>

          <Paper {...sectionPaperProps}>
            <Grid container spacing={3}>
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
          </Paper>

          <Paper {...sectionPaperProps}>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
              <PersonOutlineOutlinedIcon color='action' />
              <Typography {...sectionTitleProps}>
                Información de quien solicita calibración
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
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

          <Paper {...sectionPaperProps}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent='space-between'
              alignItems='center'
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Stack direction='row' alignItems='center' spacing={1}>
                <EngineeringOutlinedIcon color='action' />
                <Typography {...sectionTitleProps}>
                  Información e inspección de equipos
                </Typography>
              </Stack>
              <Button
                variant='outlined'
                startIcon={<AddOutlinedIcon />}
                onClick={handleAddRow}
                sx={{ borderRadius: 2 }}
              >
                Agregar fila
              </Button>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <TableContainer sx={{ overflowX: 'auto', pb: 1 }}>
              <Table size='small' sx={{ minWidth: 1800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: 50 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 250 }}>Equipo / instrumento</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 150 }}>Marca</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 150 }}>Modelo</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 150 }}>Serial</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 150 }}>Activo fijo / inventario</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 150 }}>Ubicación</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 100 }}>Servicio</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 100 }}>Fís. ingreso</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 100 }}>Fís. entrega</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 100 }}>Oper. ingreso</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 100 }}>Oper. entrega</TableCell>
                    <TableCell sx={{ width: 50 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {values.items.map((item, index) => (
                    <TableRow key={`${item.serviceItemId || 'manual'}-${index}`} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.rowNumber}</TableCell>
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
                          color="error"
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
            </TableContainer>
            <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
              B: Buen estado · M: Mal estado · NA: No aplica · SI: Sin información.
            </Typography>
          </Paper>

          <Paper {...sectionPaperProps}>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
              <FactCheckOutlinedIcon color='action' />
              <Typography {...sectionTitleProps}>
                Validaciones y observaciones
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
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

          <Paper {...sectionPaperProps}>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
              <LocalShippingOutlinedIcon color='action' />
              <Typography {...sectionTitleProps}>
                Recibido, enviado y firmas
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
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
                <SignaturePad
                  value={values.deliveredToClientSignature || null}
                  onChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      deliveredToClientSignature: value || ''
                    }))
                  }
                  disabled={isLoading}
                  height={150}
                  label='Firma de quien recibe del lado del cliente'
                  helperText='Esta firma quedará embebida en el PDF oficial de entrega.'
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
                <SignaturePad
                  value={values.receivedByClientSignature || null}
                  onChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      receivedByClientSignature: value || ''
                    }))
                  }
                  disabled={isLoading}
                  height={150}
                  label='Firma de quien recibe finalmente el equipo'
                  helperText='Puedes firmar aquí mismo o cargar una imagen si ya tienes la firma.'
                />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant='outlined'
          color='inherit'
          onClick={onClose}
          disabled={isLoading}
          startIcon={<CloseOutlinedIcon />}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={() => void onSubmit(values)}
          disabled={isLoading}
          startIcon={<SaveOutlinedIcon />}
          sx={{ borderRadius: 2, px: 3, boxShadow: 2 }}
        >
          Guardar ficha logística
        </Button>
      </DialogActions>
    </Dialog>
  )
}


export default CalibrationServiceLogisticsControlDialog
