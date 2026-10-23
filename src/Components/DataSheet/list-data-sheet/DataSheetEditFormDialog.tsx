import React from 'react'
import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import FormikField from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import { menuOptions } from './constants'
import { DataSheetData } from './types'
import { currencyFormatter, toDateInputValue } from './utils'

/** Campos de la hoja de vida que se envían al guardar. */
const PAYLOAD_KEYS = [
  'pictureUrl',
  'invoiceUrl',
  'status',
  'internalCode',
  'equipmentName',
  'brand',
  'model',
  'serialNumber',
  'supplier',
  'manual',
  'magnitude',
  'units',
  'receivedDate',
  'inServiceDate',
  'location',
  'serviceType',
  'equipmentStatus',
  'operationRange',
  'accuracy',
  'resolution',
  'softwareFirmware',
  'storageTemperature',
  'storageHumidity',
  'operationTemperature',
  'operationHumidity',
  'storageOperationComment',
  'transportConditionsComment',
  'insuredValue',
  'maintenanceProvider',
  'maintenanceCycle',
  'calibrationProvider',
  'calibrationCycle'
] as const

interface EditValues {
  internalCode: string
  equipmentName: string
  brand: string
  model: string
  serialNumber: string
  supplier: string
  magnitude: string
  units: string
  location: string
  serviceType: string
  equipmentStatus: string
  manual: boolean
  receivedDate: string
  inServiceDate: string
  insuredValue: number
  operationRange: string
  accuracy: string
  resolution: string
  softwareFirmware: string
  storageTemperature: string
  storageHumidity: string
  operationTemperature: string
  operationHumidity: string
  storageOperationComment: string
  transportConditionsComment: string
  maintenanceProvider: string
  maintenanceCycle: string
  calibrationProvider: string
  calibrationCycle: string
}

const text = (value: unknown) => (value == null ? '' : String(value))

const toNumber = (value: unknown) => {
  const digits = String(value ?? '')
    .split('.')[0]
    .replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

const buildInitialValues = (row: DataSheetData): EditValues => ({
  internalCode: text(row.internalCode),
  equipmentName: text(row.equipmentName),
  brand: text(row.brand),
  model: text(row.model),
  serialNumber: text(row.serialNumber),
  supplier: text(row.supplier),
  magnitude: text(row.magnitude),
  units: text(row.units),
  location: text(row.location),
  serviceType: text(row.serviceType),
  equipmentStatus: text(row.equipmentStatus),
  manual: Boolean(row.manual),
  receivedDate: toDateInputValue(row.receivedDate),
  inServiceDate: toDateInputValue(row.inServiceDate),
  insuredValue: toNumber(row.insuredValue),
  operationRange: text(row.operationRange),
  accuracy: text(row.accuracy),
  resolution: text(row.resolution),
  softwareFirmware: text(row.softwareFirmware),
  storageTemperature: text(row.storageTemperature),
  storageHumidity: text(row.storageHumidity),
  operationTemperature: text(row.operationTemperature),
  operationHumidity: text(row.operationHumidity),
  storageOperationComment: text(row.storageOperationComment),
  transportConditionsComment: text(row.transportConditionsComment),
  maintenanceProvider: text(row.maintenanceProvider),
  maintenanceCycle: text(row.maintenanceCycle),
  calibrationProvider: text(row.calibrationProvider),
  calibrationCycle: text(row.calibrationCycle)
})

const validationSchema = Yup.object({
  equipmentName: Yup.string()
    .trim()
    .required('El nombre del equipo es obligatorio')
})

interface DataSheetEditFormDialogProps {
  /** Fila a editar; `null` mantiene el diálogo cerrado. */
  row: DataSheetData | null
  onClose: () => void
  /** Guarda los valores ya listos para el endpoint. */
  onSave: (id: number, values: Record<string, unknown>) => Promise<void>
}

/**
 * Edición de los datos de una hoja de vida en un `FormDialog` con secciones
 * (reemplaza el modal de edición por defecto de la tabla).
 */
const DataSheetEditFormDialog: React.FC<DataSheetEditFormDialogProps> = ({
  row,
  onClose,
  onSave
}) => {
  const formik = useFormik<EditValues>({
    initialValues: row ? buildInitialValues(row) : ({} as EditValues),
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (!row?.id) return
      // Se mantiene el contenido que ya traía la fila y se pisa con lo editado
      const payload: Record<string, unknown> = {}
      PAYLOAD_KEYS.forEach((key) => {
        payload[key] =
          key in values ? values[key as keyof EditValues] : row[key]
      })
      await onSave(row.id, payload)
      onClose()
    }
  })

  const dateField = (name: 'receivedDate' | 'inServiceDate', label: string) => (
    <FormDateField
      label={label}
      name={name}
      value={formik.values[name] ?? ''}
      onChange={(value) => formik.setFieldValue(name, value)}
    />
  )

  const field = (name: keyof EditValues, label: string, multiline = false) => (
    <FormikField
      formik={formik}
      name={name}
      label={label}
      multiline={multiline}
    />
  )

  return (
    <FormDialog
      open={Boolean(row)}
      onClose={onClose}
      title='Editar hoja de vida'
      subtitle={row ? `${row.equipmentName} · ${row.internalCode}` : undefined}
      submitLabel='Guardar cambios'
      onSubmit={() => formik.handleSubmit()}
      loading={formik.isSubmitting}
      maxWidth='md'
    >
      <FormDialogSection title='Identificación'>
        <TextField
          fullWidth
          disabled
          label='Código interno'
          value={formik.values.internalCode ?? ''}
        />
        {field('equipmentName', 'Nombre del equipo')}
        {field('brand', 'Marca')}
        {field('model', 'Modelo')}
        {field('serialNumber', 'Número de serie')}
        {field('supplier', 'Proveedor')}
        {field('magnitude', 'Magnitud')}
        {field('units', 'Unidades')}
        {field('location', 'Ubicación')}
        <FormikField
          formik={formik}
          name='serviceType'
          label='Tipo de servicio'
          options={menuOptions.map((o) => ({ value: o.value, label: o.text }))}
        />
        {field('equipmentStatus', 'Estado del equipo')}
        <FormControlLabel
          label='Tiene manual'
          control={
            <Checkbox
              name='manual'
              checked={Boolean(formik.values.manual)}
              onChange={formik.handleChange}
              sx={{ '&.Mui-checked': { color: '#00BFA5' } }}
            />
          }
        />
      </FormDialogSection>

      <FormDialogSection title='Fechas y valor'>
        {dateField('receivedDate', 'Fecha de recepción')}
        {dateField('inServiceDate', 'Fecha en servicio')}
        <TextField
          fullWidth
          label='Valor asegurado'
          value={
            formik.values.insuredValue
              ? currencyFormatter.format(formik.values.insuredValue)
              : ''
          }
          onChange={(event) =>
            formik.setFieldValue(
              'insuredValue',
              toNumber(event.target.value.replace(/[^0-9]/g, ''))
            )
          }
        />
      </FormDialogSection>

      <FormDialogSection title='Especificaciones técnicas'>
        {field('operationRange', 'Rango de operación')}
        {field('accuracy', 'Exactitud')}
        {field('resolution', 'Resolución')}
        {field('softwareFirmware', 'Software/Firmware')}
      </FormDialogSection>

      <FormDialogSection
        title='Condiciones ambientales'
        description='Almacenamiento, operación y transporte.'
      >
        {field('storageTemperature', 'Temperatura de almacenamiento')}
        {field('storageHumidity', 'Humedad de almacenamiento')}
        {field('operationTemperature', 'Temperatura de operación')}
        {field('operationHumidity', 'Humedad de operación')}
        <Box sx={{ gridColumn: '1 / -1' }}>
          {field(
            'storageOperationComment',
            'Comentario de almacenamiento/operación',
            true
          )}
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          {field(
            'transportConditionsComment',
            'Comentario de condiciones de transporte',
            true
          )}
        </Box>
      </FormDialogSection>

      <FormDialogSection title='Mantenimiento y calibración'>
        {field('maintenanceProvider', 'Proveedor de mantenimiento')}
        {field('maintenanceCycle', 'Ciclo de mantenimiento')}
        {field('calibrationProvider', 'Proveedor de calibración')}
        {field('calibrationCycle', 'Ciclo de calibración')}
      </FormDialogSection>

      {formik.submitCount > 0 && Object.keys(formik.errors).length > 0 && (
        <Typography variant='body2' color='error' sx={{ mt: 2 }}>
          Revisa los campos marcados antes de guardar.
        </Typography>
      )}
    </FormDialog>
  )
}

export default DataSheetEditFormDialog
