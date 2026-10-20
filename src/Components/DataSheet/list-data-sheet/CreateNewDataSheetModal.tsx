import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Switch,
  TextField
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { format, parseISO } from 'date-fns'
import { useFormik } from 'formik'
import { type MRT_ColumnDef } from 'material-react-table'
import React from 'react'

import { bigToast } from '../../ExcelManipulation/Utils'

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

// Campos que el formulario de creación no muestra
const HIDDEN_FIELDS = ['id', 'invoiceUrl', 'internalCode', 'status']

//example of creating a mui dialog modal for creating new rows
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
          bigToast('Hoja de Datos Creada Correctamente', 'success')
          resetForm()
          onSubmit?.()
          onClose()
        } else {
          bigToast('Error al crear la Hoja de Datos', 'error')
        }
      } catch (error) {
        bigToast('Error al crear la Hoja de Datos', 'error')
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
        <Grid item xs={12} key={column.accessorKey}>
          <div className='flex items-center justify-center mb-4'>
            <label htmlFor='fileInput' className='cursor-pointer'>
              <Avatar
                alt='Foto de equipo'
                src={
                  formik.values.picture
                    ? URL.createObjectURL(formik.values.picture)
                    : ''
                }
                sx={{ width: 100, height: 100, mb: 2 }}
              />
            </label>
            <input
              id='fileInput'
              type='file'
              accept='image/*'
              onChange={(event) => {
                const file = (event.currentTarget as HTMLInputElement).files?.[0]
                formik.setFieldValue('picture', file)
              }}
              className='hidden'
            />
          </div>
          {formik.touched.picture && formik.errors.picture && (
            <div className='text-red-500 flex items-center justify-center text-sm'>
              {formik.errors.picture}
            </div>
          )}
        </Grid>
      )
    }

    if (key === 'manual') {
      return (
        <Grid item xs={12} md={6} key={column.accessorKey}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.manual}
                onChange={formik.handleChange}
                name='manual'
                onBlur={formik.handleBlur}
                color='primary'
              />
            }
            label='Tiene Manual'
          />
        </Grid>
      )
    }

    if (key === 'receivedDate' || key === 'inServiceDate') {
      return (
        <Grid item xs={12} md={6} key={column.accessorKey}>
          <DatePicker
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
                helperText: touched(key) && fieldError(key),
                fullWidth: true
              }
            }}
          />
        </Grid>
      )
    }

    if (key === 'serviceType') {
      return (
        <Grid item xs={12} md={6} key={column.accessorKey}>
          <FormControl fullWidth>
            <InputLabel>{column.header}</InputLabel>
            <Select
              name={column.accessorKey}
              value={formik.values[key]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={touched(key) && Boolean(fieldError(key))}
            >
              {createServiceTypeOptions.map((option) => (
                <MuiMenuItem key={option} value={option}>
                  {option}
                </MuiMenuItem>
              ))}
            </Select>
            <FormHelperText>{touched(key) && fieldError(key)}</FormHelperText>
          </FormControl>
        </Grid>
      )
    }

    return (
      <Grid item xs={12} md={6} key={column.accessorKey}>
        <TextField
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
          fullWidth
        />
      </Grid>
    )
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle textAlign='center'>Crear Nueva Hoja de Datos</DialogTitle>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {columns
              .filter(
                (column) =>
                  column.accessorKey &&
                  !HIDDEN_FIELDS.includes(column.accessorKey as string)
              )
              .map(renderField)}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: '1.25rem' }}>
        <Button variant='contained' color='secondary' onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={() => formik.handleSubmit()}
        >
          Crear Hoja de Datos
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateNewDataSheetModal
