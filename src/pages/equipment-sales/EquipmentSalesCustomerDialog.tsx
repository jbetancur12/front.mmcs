import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { EquipmentCustomerOption, EquipmentCustomerSite } from '../../types/equipmentSales'

export interface EquipmentSalesCustomerDialogValues {
  customer: {
    nombre: string
    identificacion: string
    email: string
    telefono: string
    direccion: string
    ciudad: string
    departamento: string
    pais: string
  }
  site: EquipmentCustomerSite
}

interface EquipmentSalesCustomerDialogProps {
  open: boolean
  mode: 'customer' | 'site'
  customer?: EquipmentCustomerOption | null
  site?: EquipmentCustomerSite | null
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (values: EquipmentSalesCustomerDialogValues) => void
}

const emptyValues: EquipmentSalesCustomerDialogValues = {
  customer: {
    nombre: '',
    identificacion: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia'
  },
  site: {
    name: 'Principal',
    address: '',
    city: '',
    department: '',
    country: 'Colombia',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    isActive: true
  }
}

const EquipmentSalesCustomerDialog = ({
  open,
  mode,
  customer,
  site,
  isSubmitting = false,
  onClose,
  onSubmit
}: EquipmentSalesCustomerDialogProps) => {
  const [values, setValues] = useState<EquipmentSalesCustomerDialogValues>(emptyValues)

  useEffect(() => {
    if (!open) return

    if (mode === 'site' && customer) {
      setValues({
        customer: {
          nombre: customer.nombre || '',
          identificacion: customer.identificacion || '',
          email: customer.email || '',
          telefono: customer.telefono || '',
          direccion: customer.direccion || '',
          ciudad: customer.ciudad || '',
          departamento: customer.departamento || '',
          pais: 'Colombia'
        },
        site: {
          id: site?.id,
          customerId: site?.customerId || customer.id,
          name: site?.name || '',
          address: site?.address || customer.direccion || '',
          city: site?.city || customer.ciudad || '',
          department: site?.department || customer.departamento || '',
          country: site?.country || 'Colombia',
          contactName: site?.contactName || '',
          contactEmail: site?.contactEmail || customer.email || '',
          contactPhone: site?.contactPhone || customer.telefono || '',
          notes: site?.notes || '',
          isActive: site?.isActive ?? true
        }
      })
      return
    }

    setValues(emptyValues)
  }, [customer, mode, open, site])

  const setCustomerField = (
    field: keyof EquipmentSalesCustomerDialogValues['customer'],
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      customer: { ...previous.customer, [field]: value }
    }))
  }

  const setSiteField = (field: keyof EquipmentCustomerSite, value: string) => {
    setValues((previous) => ({
      ...previous,
      site: { ...previous.site, [field]: value }
    }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  const title =
    mode === 'customer'
      ? 'Crear cliente comercial'
      : site?.id
        ? 'Editar sede del cliente'
        : 'Crear sede del cliente'

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth='md' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity='info'>
            Estos datos alimentan la cotización de venta de equipos.
          </Alert>

          {mode === 'customer' ? (
            <Box>
              <Typography variant='subtitle1' fontWeight={800} mb={2}>
                Datos de la empresa
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    required
                    label='Nombre / razón social'
                    value={values.customer.nombre}
                    onChange={(event) => setCustomerField('nombre', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label='NIT / identificación'
                    value={values.customer.identificacion}
                    onChange={(event) => setCustomerField('identificacion', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type='email'
                    label='Email principal'
                    value={values.customer.email}
                    onChange={(event) => setCustomerField('email', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Teléfono principal'
                    value={values.customer.telefono}
                    onChange={(event) => setCustomerField('telefono', event.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity='success'>
              {site?.id ? 'Editando sede de' : 'Nueva sede para'}{' '}
              <strong>{customer?.nombre || 'cliente seleccionado'}</strong>.
            </Alert>
          )}

          <Box>
            <Typography variant='subtitle1' fontWeight={800} mb={2}>
              Sede
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label='Nombre de la sede'
                  value={values.site.name}
                  onChange={(event) => setSiteField('name', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Contacto de la sede'
                  value={values.site.contactName || ''}
                  onChange={(event) => setSiteField('contactName', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='email'
                  label='Email contacto sede'
                  value={values.site.contactEmail || ''}
                  onChange={(event) => setSiteField('contactEmail', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Teléfono contacto sede'
                  value={values.site.contactPhone || ''}
                  onChange={(event) => setSiteField('contactPhone', event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Dirección sede'
                  value={values.site.address || ''}
                  onChange={(event) => setSiteField('address', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Ciudad'
                  value={values.site.city || ''}
                  onChange={(event) => setSiteField('city', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Departamento'
                  value={values.site.department || ''}
                  onChange={(event) => setSiteField('department', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='País'
                  value={values.site.country || ''}
                  onChange={(event) => setSiteField('country', event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label='Notas de sede'
                  value={values.site.notes || ''}
                  onChange={(event) => setSiteField('notes', event.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? 'Guardando...'
            : mode === 'customer'
              ? 'Crear cliente'
              : site?.id
                ? 'Guardar sede'
                : 'Crear sede'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EquipmentSalesCustomerDialog
