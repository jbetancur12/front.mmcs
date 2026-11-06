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
import React, { useEffect } from 'react'

import FormDialog, { FormDialogSection } from '../../Common/FormDialog'
import { notify } from 'src/utils/notify'

import FileDropZone from '../../Common/FileDropZone'
import {
  createServiceTypeOptions,
  DataSheetFormValues,
  initialDataSheetFormValues,
  MANUAL_ACCEPT,
  MANUAL_MAX_MB,
  validationSchema
} from './constants'
import { DataSheetData } from './types'
import { useDataSheetMutations, useReusableCodes } from './useDataSheets'

import { logger } from 'src/utils/logger'
import { brand } from 'src/theme/designTokens'
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
const HIDDEN_FIELDS = [
  'id',
  'invoiceUrl',
  'manualUrl',
  'internalCode',
  'status'
]

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
        const value = values[key as FieldKey]
        if (key === 'internalCode' && !String(value ?? '').trim()) return
        if (key === 'manualFile') {
          // Solo viaja si "Tiene manual" sigue activo.
          if (values.manual && value) formData.append(key, value as Blob)
          return
        }
        formData.append(key, value as string | Blob)
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
        logger.error('Error al crear la Hoja de Datos:', error)
      }
    }
  })

  const { data: reusableCodes = [] } = useReusableCodes()

  const normalizedServiceType = String(formik.values.serviceType ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
  const expectedPrefix =
    normalizedServiceType === 'equipo de prestamo' ? 'PRES-' : 'MMCS-'
  const availableCodes = formik.values.serviceType
    ? (reusableCodes as Array<Record<string, unknown>>).filter((code) =>
        String(code.internalCode ?? '').startsWith(expectedPrefix)
      )
    : (reusableCodes as Array<Record<string, unknown>>)

  // Si el código elegido no corresponde al tipo de servicio, se limpia.
  useEffect(() => {
    const selected = String(formik.values.internalCode ?? '')
    if (!selected || !formik.values.serviceType) return
    if (!selected.startsWith(expectedPrefix)) {
      formik.setFieldValue('internalCode', '')
    }
    // Solo cuando cambia el tipo de servicio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.serviceType])

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
              sx={{ width: 96, height: 96, mx: 'auto', bgcolor: brand.soft }}
            />
            <Typography
              variant='body2'
              sx={{ mt: 1, color: brand.ink, fontWeight: 600 }}
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
        <Box key={column.accessorKey} sx={FULL_ROW}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.manual}
                onChange={(event) => {
                  formik.handleChange(event)
                  if (!event.target.checked) {
                    formik.setFieldValue('manualFile', null)
                  }
                }}
                name='manual'
                onBlur={formik.handleBlur}
                sx={{
                  '& .Mui-checked': { color: brand.main },
                  '& .Mui-checked + .MuiSwitch-track': { bgcolor: brand.main }
                }}
              />
            }
            label='Tiene manual'
          />
          {formik.values.manual && (
            <Box sx={{ mt: 1 }}>
              <FileDropZone
                file={formik.values.manualFile}
                onFileSelected={(file) =>
                  formik.setFieldValue('manualFile', file)
                }
                onReject={(message) =>
                  notify.error('Archivo no válido', message)
                }
                accept={MANUAL_ACCEPT}
                acceptLabel='PDF o imagen'
                title='Arrastra el manual aquí o haz clic para elegirlo'
                hint={`PDF, JPG, PNG o WEBP, hasta ${MANUAL_MAX_MB} MB. Es opcional: también puedes subirlo después desde Editar.`}
                maxSizeMb={MANUAL_MAX_MB}
              />
            </Box>
          )}
        </Box>
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
        <TextField
          select
          fullWidth
          label='Código interno'
          name='internalCode'
          value={formik.values.internalCode}
          onChange={formik.handleChange}
          sx={{ gridColumn: { sm: '1 / -1' } }}
          helperText={
            formik.values.serviceType
              ? 'Automático usa el siguiente consecutivo. También puedes reutilizar un código liberado compatible con el tipo de servicio.'
              : 'Selecciona el tipo de servicio para filtrar los códigos liberados. Mientras tanto se muestran todos.'
          }
        >
          <MuiMenuItem value=''>Automático (siguiente)</MuiMenuItem>
          {availableCodes.map((code) => {
            const value = String(code.internalCode ?? '')
            const name = String(code.equipmentName ?? 'Equipo anterior')
            return (
              <MuiMenuItem key={value} value={value}>
                {value} · {name}
              </MuiMenuItem>
            )
          })}
          {availableCodes.length === 0 && (
            <MuiMenuItem value='__sin_codigos__' disabled>
              No hay códigos liberados
            </MuiMenuItem>
          )}
        </TextField>
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
