import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Paper } from '@mui/material'
import { Build, Delete } from '@mui/icons-material'
import { useFormik } from 'formik'
import * as yup from 'yup'

import { notify } from 'src/utils/notify'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import Profile from '../../pages/Profile'
import { loadOptions, mapOptions } from '../../utils/loadOptions'
import {
  useDataSheet,
  useDeleteDataSheetRecord,
  useInspectionMaintenanceRecord,
  useSaveInspectionMaintenance
} from '@hooks/dataSheets/useDataSheets'
import FormPage from 'src/Components/Common/FormPage'
import FormSection, { FormGridItem } from 'src/Components/Common/FormSection'
import FormikField from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import FormErrorSummary from 'src/Components/Common/FormErrorSummary'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import AsyncSelectField, {
  type AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'

// Definir los tipos para los valores del formulario
export interface InspectionMaintenanceData {
  equipmentId: string | number
  date: string
  estadoCondicionesAmbientales: string
  estadoSuperficieExterna: string
  estadoConexionElectrica: string
  estadoCambioDePoder: string
  voltaje: string
  verificarFusibles: string
  tarjetasElectronicas: string
  conexionesYSoldaduras: string
  estadoValvulaAireComprimido: string
  limpiezaFiltros: string
  lubricacionRodamientos: string
  sujecionTornillos: string
  limpiezaSensoresOLentes: string
  bandasDeTraccionOMovimiento: string
  estadoManguerasDeAire: string
  funcionamientoSensores: string
  comprobacionOperacion: string
  conclusion: string
  comentarios: string
  elaboradoPor: string
}

// Definir los tipos para la información básica del equipo
export interface EquipmentInfo {
  equipmentName: string
  internalCode: string
  brand: string
  model: string
  serviceType: string
  serialNumber: string
  calibrationCycle: string
}

interface InspectionMaintenanceRecord extends InspectionMaintenanceData {
  id: number
  comments?: string
  verifiedBy?: string
}

// Definir el esquema de validación con yup
const validationSchema = yup.object().shape({
  equipmentId: yup.number().required('ID del equipo es obligatorio'),
  date: yup.date().required('Fecha es obligatoria'),
  estadoCondicionesAmbientales: yup
    .string()
    .required('Estado condiciones ambientales es obligatorio'),
  estadoSuperficieExterna: yup
    .string()
    .required('Estado superficie externa es obligatorio'),
  estadoConexionElectrica: yup
    .string()
    .required('Estado de conexión eléctrica es obligatorio'),
  estadoCambioDePoder: yup
    .string()
    .required('Estado de cambio de poder es obligatorio'),
  voltaje: yup.string().required('Voltaje es obligatorio'),
  verificarFusibles: yup
    .string()
    .required('Verificación de fusibles es obligatoria'),
  tarjetasElectronicas: yup
    .string()
    .required('Tarjetas electrónicas es obligatorio'),
  conexionesYSoldaduras: yup
    .string()
    .required('Conexiones y soldaduras es obligatorio'),
  estadoValvulaAireComprimido: yup
    .string()
    .required('Estado válvula de aire comprimido es obligatorio'),
  limpiezaFiltros: yup.string().required('Limpieza de filtros es obligatoria'),
  lubricacionRodamientos: yup
    .string()
    .required('Lubricación de rodamientos es obligatoria'),
  sujecionTornillos: yup
    .string()
    .required('Sujeción de tornillos es obligatoria'),
  limpiezaSensoresOLentes: yup
    .string()
    .required('Limpieza de sensores o lentes es obligatoria'),
  bandasDeTraccionOMovimiento: yup
    .string()
    .required('Bandas de tracción o movimiento es obligatorio'),
  estadoManguerasDeAire: yup
    .string()
    .required('Estado mangueras de aire es obligatorio'),
  funcionamientoSensores: yup
    .string()
    .required('Funcionamiento de sensores es obligatorio'),
  comprobacionOperacion: yup
    .string()
    .required('Comprobación de operación es obligatorio'),
  conclusion: yup.string().required('Conclusión es obligatoria'),
  comentarios: yup.string().nullable(),
  elaboradoPor: yup.string().required('Elaborado por es obligatorio')
})

const InspectionMaintenanceDataForm: React.FC = () => {
  const location = useLocation()
  // El equipo sale del estado de la navegación o, si se entra por enlace directo, de la ruta
  const { id: routeId } = useParams()
  const createId = location.state?.id ?? routeId

  const navigate = useNavigate()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [profileOptions, setProfileOptions] = useState<AsyncSelectOption[]>([])

  const searchProfiles = (input: string) =>
    loadOptions<Profile>(input, 'profiles', (item) =>
      mapOptions(item, 'id', 'name')
    ) as unknown as Promise<AsyncSelectOption[]>

  useEffect(() => {
    searchProfiles('')
      .then(setProfileOptions)
      .catch(() => setProfileOptions([]))
  }, [])
  const isEdit = Boolean(location.state && location.state.edit)
  const [editId, setEditId] = useState<number | null>(null)
  const equipoId = isEdit ? location.state.data.equipmentId : createId

  const equipmentQueryId =
    isEdit &&
    location.state &&
    location.state.data &&
    location.state.data.equipmentId
      ? location.state.data.equipmentId
      : !isEdit && createId
        ? createId
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

  // Si solo tenemos el id, pedimos los datos al backend
  const editRecordId: number | string | undefined =
    location.state && location.state.edit && location.state.id
      ? location.state.id
      : undefined
  const { data: editData } =
    useInspectionMaintenanceRecord<InspectionMaintenanceRecord>(editRecordId)
  const prefilledRecordId = useRef<number | null>(null)
  const saveInspectionMutation = useSaveInspectionMaintenance()
  const deleteInspectionMutation = useDeleteDataSheetRecord()

  useEffect(() => {
    if (!editData) return
    // Solo precarga una vez por registro para no pisar lo que se esté editando
    if (prefilledRecordId.current === editData.id) return
    prefilledRecordId.current = editData.id
    const data = editData
    setEditId(data.id)
    formik.setValues({
      ...data,
      equipmentId: data.equipmentId,
      date: data.date.split('T')[0],
      comentarios: data.comments || '',
      elaboradoPor: data.verifiedBy || ''
    })
  }, [editData])

  const options = ['Bueno', 'Malo', 'No Aplica']

  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  // Fecha local (toISOString devolvía la del día siguiente por la tarde)
  const formattedDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  const formik = useFormik<InspectionMaintenanceData>({
    initialValues: {
      equipmentId: equipoId || '',
      date: formattedDate,
      estadoCondicionesAmbientales: '',
      estadoSuperficieExterna: '',
      estadoConexionElectrica: '',
      estadoCambioDePoder: '',
      voltaje: '',
      verificarFusibles: '',
      tarjetasElectronicas: '',
      conexionesYSoldaduras: '',
      estadoValvulaAireComprimido: '',
      limpiezaFiltros: '',
      lubricacionRodamientos: '',
      sujecionTornillos: '',
      limpiezaSensoresOLentes: '',
      bandasDeTraccionOMovimiento: '',
      estadoManguerasDeAire: '',
      funcionamientoSensores: '',
      comprobacionOperacion: '',
      conclusion: '',
      comentarios: '',
      elaboradoPor: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await saveInspectionMutation.mutateAsync({
          id: isEdit && editId ? editId : null,
          payload: { ...values, name: 'Mantenimiento' }
        })
        if (response.status >= 200 && response.status < 300) {
          notify.success(
            isEdit
              ? 'Mantenimiento actualizado correctamente'
              : 'Mantenimiento/Inspección enviada correctamente'
          )
          resetForm()
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        } else {
          notify.error('Error al enviar mantenimiento/inspección')
        }
      } catch (error) {
        notify.error('Error al enviar mantenimiento/inspección')
        console.error('Error al enviar mantenimiento/inspección:', error)
      }
    }
  })

  const handleDelete = async () => {
    if (!editId) return
    try {
      const response = await deleteInspectionMutation.mutateAsync(
        `/inspectionMaintenance/${editId}`
      )
      if (response.status === 204 || response.status === 200) {
        notify.success('Mantenimiento eliminado correctamente')
        navigate(-1)
      } else {
        notify.error('Error al eliminar')
      }
    } catch (error) {
      notify.error('Error al eliminar')
    }
    setConfirmDelete(false)
  }

  const fieldLabels: { [key in keyof InspectionMaintenanceData]: string } = {
    equipmentId: 'ID del equipo',
    date: 'Fecha',
    estadoCondicionesAmbientales: 'Estado de Condiciones Ambientales',
    estadoSuperficieExterna: 'Estado de Superficie Externa',
    estadoConexionElectrica: 'Estado de Conexión Eléctrica',
    estadoCambioDePoder: 'Estado de Cambio de Poder',
    voltaje: 'Voltaje',
    verificarFusibles: 'Verificar Fusibles',
    tarjetasElectronicas: 'Tarjetas Electrónicas',
    conexionesYSoldaduras: 'Conexiones y Soldaduras',
    estadoValvulaAireComprimido: 'Estado de Válvula de Aire Comprimido',
    limpiezaFiltros: 'Limpieza de Filtros',
    lubricacionRodamientos: 'Lubricación de Rodamientos',
    sujecionTornillos: 'Sujeción de Tornillos',
    limpiezaSensoresOLentes: 'Limpieza de Sensores o Lentes',
    bandasDeTraccionOMovimiento: 'Bandas de Tracción o Movimiento',
    estadoManguerasDeAire: 'Estado de Mangueras de Aire',
    funcionamientoSensores: 'Funcionamiento de Sensores',
    comprobacionOperacion: 'Comprobación de Operación',
    conclusion: 'Conclusión',
    comentarios: 'Comentarios',
    elaboradoPor: 'Elaborado Por'
  }

  const buildSelects = (names: Array<keyof InspectionMaintenanceData>) =>
    names.map((name) => (
      <FormikField
        key={name}
        formik={formik}
        name={name}
        label={fieldLabels[name]}
        options={options}
      />
    ))

  return (
    <>
      <FormPage
        title={isEdit ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
        subtitle={
          equipmentInfo
            ? `Inspección y mantenimiento · ${equipmentInfo.equipmentName} · ${equipmentInfo.internalCode}`
            : 'Inspección y mantenimiento'
        }
        icon={<Build />}
        onSubmit={formik.handleSubmit}
        onCancel={() => navigate(-1)}
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
          title='1. Fecha y entorno'
          description='Cuándo se hizo la intervención y cómo está el equipo por fuera.'
        >
          <FormDateField
            label='Fecha'
            name='date'
            value={formik.values.date}
            onChange={(value) => formik.setFieldValue('date', value)}
            error={formik.touched.date && formik.errors.date}
          />
          {buildSelects([
            'estadoCondicionesAmbientales',
            'estadoSuperficieExterna'
          ])}
        </FormSection>

        <FormSection
          title='2. Sistema eléctrico'
          description='Conexiones, alimentación y componentes electrónicos.'
        >
          {buildSelects([
            'estadoConexionElectrica',
            'estadoCambioDePoder',
            'voltaje',
            'verificarFusibles',
            'tarjetasElectronicas',
            'conexionesYSoldaduras'
          ])}
        </FormSection>

        <FormSection
          title='3. Sistema mecánico y neumático'
          description='Limpieza, lubricación y estado de las partes móviles.'
        >
          {buildSelects([
            'estadoValvulaAireComprimido',
            'limpiezaFiltros',
            'lubricacionRodamientos',
            'sujecionTornillos',
            'limpiezaSensoresOLentes',
            'bandasDeTraccionOMovimiento',
            'estadoManguerasDeAire'
          ])}
        </FormSection>

        <FormSection
          title='4. Funcionamiento'
          description='Verificación de sensores y operación del equipo.'
        >
          {buildSelects(['funcionamientoSensores', 'comprobacionOperacion'])}
        </FormSection>

        <FormSection title='5. Conclusión'>
          <FormGridItem>
            <FormikField
              formik={formik}
              name='conclusion'
              label={fieldLabels.conclusion}
              multiline
            />
          </FormGridItem>
          <FormikField
            formik={formik}
            name='comentarios'
            label={fieldLabels.comentarios}
            multiline
          />
          <AsyncSelectField<AsyncSelectOption>
            label={fieldLabels.elaboradoPor}
            value={
              formik.values.elaboradoPor
                ? {
                    value: formik.values.elaboradoPor,
                    label: formik.values.elaboradoPor
                  }
                : null
            }
            onChange={(option) =>
              formik.setFieldValue('elaboradoPor', option ? option.label : '')
            }
            loadOptions={searchProfiles}
            defaultOptions={profileOptions}
            helperText={
              formik.touched.elaboradoPor && formik.errors.elaboradoPor
                ? formik.errors.elaboradoPor
                : undefined
            }
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        open={confirmDelete}
        tone='danger'
        title='Eliminar mantenimiento'
        message='No podrá recuperar esta información una vez eliminada.'
        confirmLabel='Eliminar'
        loading={deleteInspectionMutation.isLoading}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}

export default InspectionMaintenanceDataForm
