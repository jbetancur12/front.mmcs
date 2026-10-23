import * as yup from 'yup'

import { InspectionHistoryData } from './InspectionMaintenance'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { EquipmentInfo } from './InspectionMaintenanceForm'
import { notify } from 'src/utils/notify'
import { useFormik } from 'formik'
import { Box, Button, Paper } from '@mui/material'
import { Delete, Straighten } from '@mui/icons-material'
import { addMonths } from 'date-fns'
import {
  useCalibrationRecord,
  useDataSheet,
  useDeleteDataSheetRecord,
  useSaveCalibration
} from '@hooks/dataSheets/useDataSheets'
import FormPage from 'src/Components/Common/FormPage'
import FormSection from 'src/Components/Common/FormSection'
import FormikField from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import FormErrorSummary from 'src/Components/Common/FormErrorSummary'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'

export interface CalibrationData {
  equipmentId: string | number
  date: string
  calibrationDate: string
  nextCalibrationDate: string
  certificateNumber: string
  comments: string
  elaboratedBy: string
  calibrationCycle: string | null
}

interface CalibrationRecord extends CalibrationData {
  id: number
  verifiedBy?: string
}

interface CalibrationFormProps {
  tableData: InspectionHistoryData[]
  type: 'maintenance' | 'calibration'
  id: string | number
}

const validationSchema = yup.object().shape({
  equipmentId: yup.number().required('ID del equipo es obligatorio'),
  date: yup.date().required('Fecha es obligatoria'),
  calibrationDate: yup.date().required('Fecha de calibración es obligatoria'),
  nextCalibrationDate: yup
    .date()
    .required('Fecha de próxima calibración es obligatoria'),
  certificateNumber: yup
    .string()
    .required('Número de certificado es obligatorio'),
  comments: yup.string().nullable(),
  elaboratedBy: yup.string().required('Elaborado por es obligatorio'),
  calibrationCycle: yup
    .number()
    .typeError('El ciclo debe ser un número')
    .required('Ciclo de calibración es requerido')
    .min(1, 'El ciclo debe ser al menos 1 mes')
})

const CalibrationForm: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  // El equipo sale del estado de la navegación o, si se entra por enlace directo, de la ruta
  const { id: routeId } = useParams()
  const id = (location.state as CalibrationFormProps | null)?.id ?? routeId

  const isEdit = Boolean(location.state && location.state.edit)
  const [editId, setEditId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const equipoId = isEdit ? location.state.data.equipmentId : id

  const calibrationHistoryId: number | undefined =
    isEdit && location.state && location.state.data
      ? location.state.data.calibrationId
      : undefined
  const { data: calibrationData } =
    useCalibrationRecord<CalibrationRecord>(calibrationHistoryId)
  const prefilledCalibrationId = useRef<number | null>(null)
  const saveCalibrationMutation = useSaveCalibration()
  const deleteCalibrationMutation = useDeleteDataSheetRecord()

  useEffect(() => {
    if (!calibrationData) return
    // Solo precarga una vez por registro para no pisar lo que se esté editando
    if (prefilledCalibrationId.current === calibrationData.id) return
    prefilledCalibrationId.current = calibrationData.id
    const data = calibrationData
    setEditId(data.id)
    formik.setValues({
      ...data,
      equipmentId: data.equipmentId,
      date: data.date.split('T')[0],
      comments: data.comments || '',
      elaboratedBy: data.elaboratedBy || data.verifiedBy || ''
    })
  }, [calibrationData])

  // Fetch equipo: en edición usa calibrationData.equipmentId, en creación usa location.state.id
  const equipmentQueryId =
    isEdit && calibrationData && calibrationData.equipmentId
      ? calibrationData.equipmentId
      : !isEdit && id
        ? id
        : null
  const { data: equipmentData } = useDataSheet<EquipmentInfo>(
    equipmentQueryId,
    { refetchOnWindowFocus: false }
  )
  const equipmentInfo = useMemo<EquipmentInfo | null>(
    () =>
      equipmentData
        ? {
            equipmentName: equipmentData.equipmentName,
            internalCode: equipmentData.internalCode,
            brand: equipmentData.brand,
            model: equipmentData.model,
            serviceType: equipmentData.serviceType,
            serialNumber: equipmentData.serialNumber,
            calibrationCycle: equipmentData.calibrationCycle
          }
        : null,
    [equipmentData]
  )

  // Actualizar valores del formulario cuando cambia equipmentInfo
  useEffect(() => {
    if (equipmentInfo) {
      formik.setFieldValue(
        'calibrationCycle',
        equipmentInfo.calibrationCycle || ''
      )
    }
  }, [equipmentInfo])

  const formik = useFormik<CalibrationData>({
    initialValues: {
      equipmentId: id || '',
      date: '',
      calibrationDate: '',
      nextCalibrationDate: '',
      comments: '',
      elaboratedBy: '',
      certificateNumber: '',
      calibrationCycle: equipmentInfo?.calibrationCycle || ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await saveCalibrationMutation.mutateAsync({
          id: isEdit && editId ? editId : null,
          payload: { ...values, name: 'Calibración' }
        })
        if (response.status >= 200 && response.status < 300) {
          notify.success(
            isEdit
              ? 'Calibración actualizada correctamente'
              : 'Calibración enviada correctamente'
          )
          resetForm()
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        } else {
          notify.error('Error al enviar la calibración')
        }
      } catch (error) {
        notify.error('Error al enviar la calibración')
        console.error('Error al enviar la calibración:', error)
      }
    }
  })

  const fieldLabels: { [key in keyof CalibrationData]: string } = {
    equipmentId: 'ID del equipo',
    date: 'Fecha',
    calibrationDate: 'Fecha de calibración',
    nextCalibrationDate: 'Fecha de próxima calibración',
    certificateNumber: 'Número de Certificado',
    comments: 'Comentarios',
    elaboratedBy: 'Elaborado por',
    calibrationCycle: 'Ciclo de calibración'
  }

  useEffect(() => {
    if (formik.values.calibrationDate && equipmentInfo?.calibrationCycle) {
      const parsedDate = new Date(formik.values.calibrationDate)
      if (!isNaN(parsedDate.getTime())) {
        const cycleMonths = Number(equipmentInfo.calibrationCycle)
        formik.setFieldValue(
          'nextCalibrationDate',
          addMonths(parsedDate, cycleMonths).toISOString()
        )
      }
    }
  }, [formik.values.calibrationDate, equipmentInfo?.calibrationCycle])

  const handleDelete = async () => {
    if (!editId) return
    try {
      const response = await deleteCalibrationMutation.mutateAsync(
        `/calibration/${editId}`
      )
      if (response.status === 204 || response.status === 200) {
        notify.success('Calibración eliminada correctamente')
        navigate(-1)
      } else {
        notify.error('Error al eliminar')
      }
    } catch (error) {
      notify.error('Error al eliminar')
    }
    setConfirmDelete(false)
  }

  const dateError = (name: 'date' | 'calibrationDate') =>
    formik.touched[name] && formik.errors[name]
      ? String(formik.errors[name])
      : false

  // La próxima calibración se calcula con la fecha de calibración y el ciclo del equipo
  const nextCalibrationText = formik.values.calibrationDate
    ? addMonths(
        new Date(formik.values.calibrationDate),
        Number(equipmentInfo?.calibrationCycle)
      )
        .toISOString()
        .split('T')[0]
    : ''

  return (
    <>
      <FormPage
        title={isEdit ? 'Editar calibración' : 'Nueva calibración'}
        subtitle={
          equipmentInfo
            ? `Inspección y mantenimiento · ${equipmentInfo.equipmentName} · ${equipmentInfo.internalCode}`
            : 'Inspección y mantenimiento'
        }
        icon={<Straighten />}
        onSubmit={formik.handleSubmit}
        onCancel={() =>
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        }
        submitLabel={isEdit ? 'Actualizar' : 'Guardar'}
        loading={formik.isSubmitting}
        notices={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            {formik.submitCount > 0 && (
              <FormErrorSummary count={Object.keys(formik.errors).length} />
            )}
            {isEdit && (
              <Button
                color='error'
                variant='outlined'
                startIcon={<Delete />}
                onClick={() => setConfirmDelete(true)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Eliminar
              </Button>
            )}
          </Box>
        }
      >
        {equipmentInfo && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}
          >
            <DetailSection title='Datos del equipo'>
              <DetailCell>
                <DetailField label='Nombre'>
                  {equipmentInfo.equipmentName}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Código interno'>
                  {equipmentInfo.internalCode}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Marca'>
                  {equipmentInfo.brand || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Modelo'>
                  {equipmentInfo.model || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Número de serie'>
                  {equipmentInfo.serialNumber || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Tipo de servicio'>
                  {equipmentInfo.serviceType || 'Sin registrar'}
                </DetailField>
              </DetailCell>
            </DetailSection>
          </Paper>
        )}

        <FormSection
          title='1. Calibración'
          description='Fechas del servicio y número del certificado.'
        >
          <FormDateField
            label='Fecha'
            name='date'
            value={formik.values.date}
            onChange={(value) => formik.setFieldValue('date', value)}
            error={dateError('date')}
          />
          <FormDateField
            label='Fecha de calibración'
            name='calibrationDate'
            value={formik.values.calibrationDate}
            onChange={(value) => formik.setFieldValue('calibrationDate', value)}
            error={dateError('calibrationDate')}
          />
          <FormikField
            formik={formik}
            name='calibrationCycle'
            type='number'
            label='Ciclo de calibración (meses)'
            helperText='Lo define el equipo; no se edita aquí.'
            disabled
          />
          <FormDateField
            label='Próxima fecha de calibración'
            name='nextCalibrationDate'
            value={nextCalibrationText}
            onChange={() => undefined}
            disabled
          />
          <FormikField
            formik={formik}
            name='certificateNumber'
            label='Número de certificado'
          />
        </FormSection>

        <FormSection title='2. Responsable'>
          <FormikField
            formik={formik}
            name='elaboratedBy'
            label={fieldLabels.elaboratedBy}
          />
          <FormikField
            formik={formik}
            name='comments'
            label={fieldLabels.comments}
            multiline
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        open={confirmDelete}
        tone='danger'
        title='Eliminar calibración'
        message='No podrá recuperar esta información una vez eliminada.'
        confirmLabel='Eliminar'
        loading={deleteCalibrationMutation.isLoading}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}

export default CalibrationForm
