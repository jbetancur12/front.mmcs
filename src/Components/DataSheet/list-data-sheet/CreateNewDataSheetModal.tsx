import {
  Avatar,
  Box,
  FormControlLabel,
  MenuItem as MuiMenuItem,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { format, parseISO } from 'date-fns'
import { useFormik } from 'formik'
import { type MRT_ColumnDef } from 'material-react-table'
import React from 'react'

import FormDialog, { FormDialogSection } from '../../Common/FormDialog'
import { notify } from 'src/utils/notify'

import {
  createServiceTypeOptions,
  DataSheetFormValues,
  initialDataSheetFormValues,
  validationSchema
} from './constants'
import { DataSheetData } from './types'
import { useDataSheetMutations } from './useDataSheets'

interface CreateModalProps {
  columns: MRT_ColumnDef<DataSheetData>[]
  onClose: () => void
  /** Se llama tras crear; la lista ya se recarga sola (react-query). */
  onSubmit?: () => void
  open: boolean
}

type FieldKey = keyof DataSheetFormValues

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

// Campos que el formulario de creación no muestra
const HIDDEN_FIELDS = ['id', 'invoiceUrl', 'internalCode', 'status']

/** Crea una hoja de datos de equipo: foto y datos en dos columnas. */
export const CreateNewDataSheetModal: React.FC<CreateModalProps> = ({
  open,
  columns,
  onClose,
  onSubmit
}) => {
  const { createDataSheet } = useDataSheetMutations()

  const formik = useFormik({
    initialValues: initialDataSheetFormValues,
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const formData = new FormData()
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key as FieldKey] as string | Blob)
      })

      try {
        const response = await createDataSheet.mutateAsync(formData)

        if (response.status >= 200 && response.status < 300) {
          notify.success('Hoja de Datos Creada Correctamente')
          resetForm()
          onSubmit?.()
          onClose()
        } else {
          notify.error('Error al crear la Hoja de Datos')
        }
      } catch (error) {
        notify.error('Error al crear la Hoja de Datos')
        console.error('Error al crear la Hoja de Datos:', error)
      }
    }
  })

  const touched = (key: FieldKey) => formik.touched[key]
  const fieldError = (key: FieldKey) => formik.errors[key]

  const renderField = (column: MRT_ColumnDef<DataSheetData>) => {
    const key = column.accessorKey as FieldKey

    if (column.accessorKey === 'pictureUrl') {
      return (
        <Box key={column.accessorKey} sx={{ ...FULL_ROW, textAlign: 'center' }}>
          <label htmlFor='fileInput' style={{ cursor: 'pointer' }}>
            <Avatar
              alt='Foto de equipo'
              src={
                formik.values.picture
                  ? URL.createObjectURL(formik.values.picture)
                  : ''
              }
              sx={{ width: 96, height: 96, mx: 'auto', bgcolor: '#E0F7F4' }}
            />
            <Typography
              variant='body2'
              sx={{ mt: 1, color: '#00695C', fontWeight: 600 }}
            >
              {formik.values.picture
                ? 'Cambiar foto'
                : 'Agregar foto del equipo'}
            </Typography>
          </label>
          <input
            id='fileInput'
            type='file'
            accept='image/*'
            hidden
            onChange={(event) => {
              const file = (event.currentTarget as HTMLInputElement).files?.[0]
              formik.setFieldValue('picture', file)
            }}
          />
          {formik.touched.picture && formik.errors.picture && (
            <Typography variant='caption' color='error' display='block'>
              {formik.errors.picture as string}
            </Typography>
          )}
        </Box>
      )
    }

    if (key === 'manual') {
      return (
        <FormControlLabel
          key={column.accessorKey}
          control={
            <Switch
              checked={formik.values.manual}
              onChange={formik.handleChange}
              name='manual'
              onBlur={formik.handleBlur}
              sx={{
                '& .Mui-checked': { color: '#00BFA5' },
                '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00BFA5' }
              }}
            />
          }
          label='Tiene manual'
        />
      )
    }

    if (key === 'receivedDate' || key === 'inServiceDate') {
      return (
        <DatePicker
          key={column.accessorKey}
          label={column.header}
          value={formik.values[key] ? parseISO(formik.values[key]) : null}
          onChange={(newValue: Date | null) => {
            formik.setFieldValue(
              key,
              newValue ? format(newValue, 'yyyy-MM-dd') : ''
            )
          }}
          slotProps={{
            textField: {
              error: touched(key) && Boolean(fieldError(key)),
              helperText: touched(key) && fieldError(key)
            }
          }}
        />
      )
    }

    if (key === 'serviceType') {
      return (
        <TextField
          select
          key={column.accessorKey}
          label={column.header}
          name={column.accessorKey}
          value={formik.values[key]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={touched(key) && Boolean(fieldError(key))}
          helperText={touched(key) && fieldError(key)}
        >
          {createServiceTypeOptions.map((option) => (
            <MuiMenuItem key={option} value={option}>
              {option}
            </MuiMenuItem>
          ))}
        </TextField>
      )
    }

    return (
      <TextField
        key={column.accessorKey}
        label={column.header}
        name={column.accessorKey}
        value={
          key === 'insuredValue'
            ? `$ ${new Intl.NumberFormat('es-CO').format(
                Number(formik.values.insuredValue) || 0
              )}`
            : formik.values[key]
        }
        onChange={(e) => {
          if (key === 'insuredValue') {
            const rawValue = e.target.value.replace(/[^0-9]/g, '')
            formik.setFieldValue(key, rawValue)
          } else {
            formik.handleChange(e)
          }
        }}
        onBlur={formik.handleBlur}
        error={touched(key) && Boolean(fieldError(key))}
        helperText={touched(key) && fieldError(key)}
      />
    )
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Crear hoja de datos'
      subtitle='Datos del equipo para su hoja de vida'
      submitLabel='Crear hoja de datos'
      onSubmit={() => formik.handleSubmit()}
      loading={formik.isSubmitting}
      maxWidth='md'
    >
      <FormDialogSection title='Datos del equipo'>
        {columns
          .filter(
            (column) =>
              column.accessorKey &&
              !HIDDEN_FIELDS.includes(column.accessorKey as string)
          )
          .map(renderField)}
      </FormDialogSection>
    </FormDialog>
  )
}

export default CreateNewDataSheetModal
