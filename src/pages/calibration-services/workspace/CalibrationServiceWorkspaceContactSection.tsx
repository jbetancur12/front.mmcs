import {
  Alert,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { sectionCardSx } from './calibrationServiceWorkspaceConstants'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'

interface CalibrationServiceWorkspaceContactSectionProps {
  form: CalibrationServiceWorkspaceForm
  canEdit: boolean
  isBusy: boolean
}

/** Paso 2: contacto, destino del servicio y cliente de ejecución diferente a la oferta. */
const CalibrationServiceWorkspaceContactSection = ({
  form,
  canEdit,
  isBusy
}: CalibrationServiceWorkspaceContactSectionProps) => {
  const {
    formState,
    setField,
    useDifferentExecutionCustomer,
    handleDifferentExecutionCustomerToggle
  } = form

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
          <Inventory2OutlinedIcon sx={{ color: '#00897B', fontSize: 22 }} />
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Contacto y destino del servicio
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label='Contacto' value={formState.contactName || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactName', event.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label='Email' type='email' value={formState.contactEmail || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactEmail', event.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label='Teléfono / celular' value={formState.contactPhone || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactPhone', event.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label='Ciudad' value={formState.city || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('city', event.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label='Departamento' value={formState.department || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('department', event.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label='Dirección' value={formState.address || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('address', event.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={useDifferentExecutionCustomer}
                  disabled={!canEdit || isBusy}
                  onChange={(event) =>
                    handleDifferentExecutionCustomerToggle(event.target.checked)
                  }
                />
              }
              label='El servicio es para un cliente diferente a la oferta'
            />
          </Grid>
          {useDifferentExecutionCustomer ? (
            <>
              <Grid item xs={12}>
                <Alert severity='info'>
                  Usa este bloque cuando la cotización se emite a un cliente, pero la
                  ejecución real será para un tercero. Estos datos quedarán precargados en
                  la ODS y en el bloque `Cliente Diferente Oferta`.
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Cliente de ejecución'
                  value={formState.executionCustomerName || ''}
                  disabled={!canEdit || isBusy}
                  onChange={(event) =>
                    setField('executionCustomerName', event.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Sede o referencia de ejecución'
                  value={formState.executionSiteName || ''}
                  disabled={!canEdit || isBusy}
                  onChange={(event) =>
                    setField('executionSiteName', event.target.value)
                  }
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary'>
                Si no marcas esta opción, el sistema asumirá que el servicio se presta para el
                mismo cliente de la oferta y tomará como base el cliente y la sede ya elegidos.
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceWorkspaceContactSection
