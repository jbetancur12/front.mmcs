import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField
} from '@mui/material'
import { useEquipmentFilters, useSaveEquipment, techErrorMessage } from '@hooks/useTechManagement'
import { CustomerEquipment, EquipmentPayload } from 'src/types/techManagement'
import { notifyError, notifySuccess, primaryButtonSx, RISK_CLASSES } from './techUi'

const EMPTY: EquipmentPayload = {
  name: '',
  brand: '',
  model: '',
  serie: '',
  activoFijo: '',
  sede: '',
  service: '',
  location: '',
  riskClass: null,
  invimaRegistry: '',
  lot: '',
  manufacturer: '',
  responsibleProvider: '',
  status: 'active',
  calibrationPeriodMonths: null,
  maintenancePeriodMonths: null,
  notes: ''
}

const TEXT_FIELDS: { key: keyof EquipmentPayload; label: string; sm?: number }[] = [
  { key: 'name', label: 'Nombre del equipo *', sm: 12 },
  { key: 'brand', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'serie', label: 'Serie' },
  { key: 'activoFijo', label: 'Activo fijo' },
  { key: 'sede', label: 'Sede' },
  { key: 'service', label: 'Servicio' },
  { key: 'location', label: 'Ubicación' },
  { key: 'invimaRegistry', label: 'Registro sanitario INVIMA' },
  { key: 'lot', label: 'Lote' },
  { key: 'manufacturer', label: 'Fabricante' },
  { key: 'responsibleProvider', label: 'Proveedor responsable' }
]

interface Props {
  customerId: string
  open: boolean
  equipment?: CustomerEquipment | null
  onClose: () => void
}

/** Alta y edición de un equipo del inventario (los que vienen de certificados ya llegan cargados). */
const EquipmentFormDialog = ({ customerId, open, equipment, onClose }: Props) => {
  const [values, setValues] = useState<EquipmentPayload>(EMPTY)
  const save = useSaveEquipment(customerId)
  const { data: filters } = useEquipmentFilters(customerId)

  useEffect(() => {
    if (!open) return
    if (equipment) {
      const next: EquipmentPayload = {}
      ;(Object.keys(EMPTY) as (keyof EquipmentPayload)[]).forEach((key) => {
        ;(next as Record<string, unknown>)[key] = equipment[key as keyof CustomerEquipment] ?? EMPTY[key] ?? ''
      })
      setValues(next)
    } else {
      setValues(EMPTY)
    }
  }, [open, equipment])

  const set = (key: keyof EquipmentPayload, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }))
  const asMonths = (value: string) => (value === '' ? null : Number(value))

  const handleSubmit = async () => {
    if (!String(values.name || '').trim()) {
      notifyError('El nombre del equipo es obligatorio')
      return
    }
    try {
      await save.mutateAsync({ id: equipment?.id, payload: { ...values, riskClass: values.riskClass || null } })
      notifySuccess(equipment ? 'Equipo actualizado' : 'Equipo creado')
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar el equipo'))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle
        sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
      >
        {equipment ? 'Editar equipo' : 'Nuevo equipo'}
      </DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        <Grid container spacing={2}>
          {TEXT_FIELDS.map((field) => (
            <Grid item xs={12} sm={field.sm || 6} key={field.key}>
              <TextField
                fullWidth
                size='small'
                label={field.label}
                value={(values[field.key] as string) ?? ''}
                onChange={(event) => set(field.key, event.target.value)}
                inputProps={field.key === 'sede' || field.key === 'service' ? { list: `tech-${field.key}-options` } : undefined}
              />
            </Grid>
          ))}
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size='small'
              label='Clase de riesgo'
              value={values.riskClass || ''}
              onChange={(event) => set('riskClass', event.target.value || null)}
            >
              <MenuItem value=''>Sin definir</MenuItem>
              {RISK_CLASSES.map((risk) => (
                <MenuItem key={risk} value={risk}>
                  {risk}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Calibración cada (meses)'
              value={values.calibrationPeriodMonths ?? ''}
              onChange={(event) => set('calibrationPeriodMonths', asMonths(event.target.value))}
              inputProps={{ min: 1, max: 120 }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Preventivo cada (meses)'
              value={values.maintenancePeriodMonths ?? ''}
              onChange={(event) => set('maintenancePeriodMonths', asMonths(event.target.value))}
              inputProps={{ min: 1, max: 120 }}
            />
          </Grid>
          {equipment && (
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size='small'
                label='Estado'
                value={values.status || 'active'}
                onChange={(event) => set('status', event.target.value)}
              >
                <MenuItem value='active'>Activo</MenuItem>
                <MenuItem value='inactive'>Fuera de servicio</MenuItem>
                <MenuItem value='retired'>Dado de baja</MenuItem>
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              size='small'
              label='Observaciones'
              value={values.notes ?? ''}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Grid>
        </Grid>
        <datalist id='tech-sede-options'>
          {filters?.sedes.map((sede) => <option key={sede} value={sede} />)}
        </datalist>
        <datalist id='tech-service-options'>
          {filters?.services.map((service) => <option key={service} value={service} />)}
        </datalist>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={save.isLoading} sx={primaryButtonSx}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EquipmentFormDialog
