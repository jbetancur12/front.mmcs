import {
  Alert,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { NumericFormatCustom } from '../../../Components/NumericFormatCustom'
import {
  DELIVERY_TIME_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  sectionCardSx,
  VALIDITY_DAY_OPTIONS
} from './calibrationServiceWorkspaceConstants'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'

interface CalibrationServiceWorkspaceCommercialSectionProps {
  form: CalibrationServiceWorkspaceForm
  canEdit: boolean
  isBusy: boolean
}

/** Paso 5: validez, forma de pago, descuento y tiempos de entrega. */
const CalibrationServiceWorkspaceCommercialSection = ({
  form,
  canEdit,
  isBusy
}: CalibrationServiceWorkspaceCommercialSectionProps) => {
  const { formState, setField } = form

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
          <ReceiptLongOutlinedIcon sx={{ color: '#00897B', fontSize: 22 }} />
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Condiciones comerciales
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Validez</InputLabel>
              <Select
                value={String(formState.validityDays || 30)}
                label='Validez'
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('validityDays', Number(event.target.value))}
              >
                {VALIDITY_DAY_OPTIONS.map((days) => (
                  <MenuItem key={days} value={String(days)}>
                    {days} dias
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel required>Forma de pago</InputLabel>
              <Select
                value={formState.paymentMethod || ''}
                label='Forma de pago'
                required
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('paymentMethod', event.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Aplica descuento</InputLabel>
              <Select
                value={formState.hasDiscount ? 'yes' : 'no'}
                label='Aplica descuento'
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('hasDiscount', event.target.value === 'yes')}
              >
                <MenuItem value='no'>No</MenuItem>
                <MenuItem value='yes'>Si</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {formState.hasDiscount ? (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo descuento</InputLabel>
                  <Select
                    value={formState.discountType || 'fixed'}
                    label='Tipo descuento'
                    disabled={!canEdit || isBusy}
                    onChange={(event) => setField('discountType', event.target.value)}
                  >
                    {DISCOUNT_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Valor descuento'
                  value={formState.discountValue ?? 0}
                  disabled={!canEdit || isBusy}
                  onChange={(event) =>
                    setField('discountValue', Number(event.target.value))
                  }
                  InputProps={
                    formState.discountType === 'fixed'
                      ? { inputComponent: NumericFormatCustom as never }
                      : undefined
                  }
                />
              </Grid>
            </>
          ) : null}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel required>Entrega instrumento</InputLabel>
              <Select
                value={formState.instrumentDeliveryTime || ''}
                label='Entrega instrumento'
                required
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('instrumentDeliveryTime', event.target.value)}
              >
                {DELIVERY_TIME_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel required>Entrega certificado</InputLabel>
              <Select
                value={formState.certificateDeliveryTime || ''}
                label='Entrega certificado'
                required
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('certificateDeliveryTime', event.target.value)}
              >
                {DELIVERY_TIME_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Alert severity='info'>
              El perfil sugerido de precio se usa para precargar el valor al
              seleccionar un producto del catálogo. Luego cada ítem puede cambiar
              su precio de catálogo o editar manualmente el valor unitario.
            </Alert>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceWorkspaceCommercialSection
