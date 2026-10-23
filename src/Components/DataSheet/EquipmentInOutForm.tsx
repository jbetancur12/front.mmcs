import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material'
import {
  ArrowBack,
  Download,
  Login,
  Logout,
  TableChart
} from '@mui/icons-material'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '@stores/userStore'
import {
  useDataSheetStatus,
  useSaveEquipmentInOut
} from '@hooks/dataSheets/useDataSheets'
import { ROLES } from 'src/constants/roles'
import { formatDateOnly } from '@utils/dateOnly'
import { loadOptions, mapOptions } from '@utils/loadOptions'
import { Profile } from '../../pages/Profiles'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import AsyncSelectField, {
  type AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import FormSection, { FormGridItem } from 'src/Components/Common/FormSection'
import FormikField from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'
import { notify } from 'src/utils/notify'

interface EquipmentFormValues {
  outReason: string
  /** Fechas como `yyyy-MM-dd`; se convierten a `Date` al enviar. */
  outDate: string
  inDate: string
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string
  observationsOut: string
  registeredBy: string
}

interface LastRecord {
  outReason?: string
  outDate?: string
  inDate?: string
  visualOutInspection?: string
  visualInInspection?: string
  operationalOutTest?: string
  operationalInTest?: string
  observationsOut?: string
  observationsIn?: string
  registeredBy?: string
}

const OUT_REASONS = [
  { value: 'Servicio de Calibracion', label: 'Servicio de calibración' },
  { value: 'Calibracion Clientes', label: 'Calibración clientes' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Reparacion', label: 'Reparación' }
]
const VISUAL_OPTIONS = ['Bueno', 'Malo']
const OPERATIONAL_OPTIONS = ['Funciona', 'No Funciona', 'No Aplica']

const todayText = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** `yyyy-MM-dd` a `Date` a mediodía local, para que no cambie de día por la zona horaria. */
const toDate = (text: string) => new Date(`${text}T12:00:00`)

const formatDate = (value?: string) =>
  formatDateOnly(value) ?? 'Sin información'

const orMissing = (value?: string) => value || 'Sin información'

const required = (message: string) => Yup.string().required(message)

const buildSchema = (isEquipmentOut: boolean) =>
  Yup.object(
    isEquipmentOut
      ? {
          inDate: required('La fecha de entrada es obligatoria'),
          visualInInspection: required(
            'La inspección visual de entrada es obligatoria'
          ),
          operationalInTest: required(
            'La prueba operativa de entrada es obligatoria'
          )
        }
      : {
          outReason: required('El motivo de salida es obligatorio'),
          outDate: required('La fecha de salida es obligatoria'),
          visualOutInspection: required(
            'La inspección visual de salida es obligatoria'
          ),
          operationalOutTest: required(
            'La prueba operativa de salida es obligatoria'
          ),
          registeredBy: required('Indique quién registra la salida')
        }
  )

const EquipmentForm: React.FC = () => {
  const $userStore = useStore(userStore)
  const isAdmin = $userStore.rol.some((role) => role === ROLES.ADMIN)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEquipmentOut, setIsEquipmentOut] = useState<boolean>(false)
  const [lastRecord, setLastRecord] = useState<LastRecord | null>(null)
  const [profileOptions, setProfileOptions] = useState<AsyncSelectOption[]>([])

  const { data: equipmentStatus } = useDataSheetStatus(id)
  const saveEquipmentInOutMutation = useSaveEquipmentInOut()

  useEffect(() => {
    if (!equipmentStatus) return
    if (
      equipmentStatus.status === 'busy' ||
      equipmentStatus.status === 'available'
    ) {
      setIsEquipmentOut(equipmentStatus.status === 'busy')
      setLastRecord((equipmentStatus.lastRecord?.[0] as LastRecord) ?? null)
    }
  }, [equipmentStatus])

  const searchProfiles = (input: string) =>
    loadOptions<Profile>(input, 'profiles', (item) =>
      mapOptions(item, 'id', 'name')
    ) as unknown as Promise<AsyncSelectOption[]>

  useEffect(() => {
    searchProfiles('')
      .then(setProfileOptions)
      .catch(() => setProfileOptions([]))
  }, [])

  const schema = useMemo(() => buildSchema(isEquipmentOut), [isEquipmentOut])

  const initialValues: EquipmentFormValues = {
    outReason: '',
    outDate: todayText(),
    inDate: todayText(),
    visualOutInspection: '',
    visualInInspection: '',
    operationalOutTest: '',
    operationalInTest: '',
    observationsIn: '',
    observationsOut: '',
    registeredBy: ''
  }

  const handleSubmit = async (
    values: EquipmentFormValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    const method = !isEquipmentOut ? 'post' : 'put'
    try {
      const response = await saveEquipmentInOutMutation.mutateAsync({
        method,
        data: {
          ...values,
          outDate: toDate(values.outDate),
          inDate: toDate(values.inDate),
          equipmentId: id
        }
      })
      if (method === 'post' && response.status === 201) {
        setLastRecord(response.data)
      }
      setIsEquipmentOut(!isEquipmentOut)
      resetForm()
      await notify.success(
        method === 'post' ? 'Salida registrada' : 'Entrada registrada'
      )
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      await notify.error(
        'No se pudo registrar',
        'Ocurrió un error al guardar el movimiento. Inténtalo de nuevo.'
      )
    }
  }

  const buttonSx = {
    textTransform: 'none',
    fontWeight: 600,
    color: '#00695C',
    borderColor: '#00BFA5',
    '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
  } as const

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title={!isEquipmentOut ? 'Salida de equipo' : 'Entrada de equipo'}
        subtitle={
          !isEquipmentOut
            ? 'Registra la salida del equipo del laboratorio'
            : 'Registra el regreso del equipo al laboratorio'
        }
        icon={!isEquipmentOut ? <Logout /> : <Login />}
        actions={
          <>
            {isAdmin && (
              <>
                <Button
                  variant='outlined'
                  startIcon={<TableChart />}
                  onClick={() => navigate(`/datasheets/${id}/in-out-table`)}
                  sx={buttonSx}
                >
                  Historial
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<Download />}
                  onClick={() => navigate(`/datasheets/${id}/in-out-report`)}
                  sx={buttonSx}
                >
                  Reporte PDF
                </Button>
              </>
            )}
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/datasheets')}
              sx={buttonSx}
            >
              Volver
            </Button>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formik) => (
              <Box
                component='form'
                noValidate
                onSubmit={formik.handleSubmit}
                sx={{
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                    { borderColor: '#00897B' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#00695C' }
                }}
              >
                <FormSection
                  title={
                    !isEquipmentOut
                      ? 'Datos de la salida'
                      : 'Datos de la entrada'
                  }
                  description='Estado del equipo en el momento del movimiento.'
                >
                  {!isEquipmentOut ? (
                    <>
                      <FormikField
                        formik={formik}
                        name='outReason'
                        label='Motivo de salida'
                        options={OUT_REASONS}
                      />
                      <FormDateField
                        label='Fecha de salida'
                        name='outDate'
                        value={formik.values.outDate}
                        onChange={(v) => formik.setFieldValue('outDate', v)}
                        error={formik.touched.outDate && formik.errors.outDate}
                      />
                      <FormikField
                        formik={formik}
                        name='visualOutInspection'
                        label='Inspección visual de salida'
                        options={VISUAL_OPTIONS}
                      />
                      <FormikField
                        formik={formik}
                        name='operationalOutTest'
                        label='Prueba operativa de salida'
                        options={OPERATIONAL_OPTIONS}
                      />
                      <FormGridItem>
                        <FormikField
                          formik={formik}
                          name='observationsOut'
                          label='Observaciones de salida'
                          multiline
                        />
                      </FormGridItem>
                      <FormGridItem>
                        <AsyncSelectField<AsyncSelectOption>
                          label='Registrado por'
                          value={
                            formik.values.registeredBy
                              ? {
                                  value: formik.values.registeredBy,
                                  label: formik.values.registeredBy
                                }
                              : null
                          }
                          onChange={(option) =>
                            formik.setFieldValue(
                              'registeredBy',
                              option ? option.label : ''
                            )
                          }
                          loadOptions={searchProfiles}
                          defaultOptions={profileOptions}
                          helperText={
                            formik.touched.registeredBy &&
                            formik.errors.registeredBy
                              ? formik.errors.registeredBy
                              : undefined
                          }
                        />
                      </FormGridItem>
                    </>
                  ) : (
                    <>
                      <FormDateField
                        label='Fecha de entrada'
                        name='inDate'
                        value={formik.values.inDate}
                        onChange={(v) => formik.setFieldValue('inDate', v)}
                        error={formik.touched.inDate && formik.errors.inDate}
                      />
                      <FormikField
                        formik={formik}
                        name='visualInInspection'
                        label='Inspección visual de entrada'
                        options={VISUAL_OPTIONS}
                      />
                      <FormikField
                        formik={formik}
                        name='operationalInTest'
                        label='Prueba operativa de entrada'
                        options={OPERATIONAL_OPTIONS}
                      />
                      <FormGridItem>
                        <FormikField
                          formik={formik}
                          name='observationsIn'
                          label='Observaciones de entrada'
                          multiline
                        />
                      </FormGridItem>
                    </>
                  )}
                  <FormGridItem>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type='submit'
                        variant='contained'
                        disabled={formik.isSubmitting}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          bgcolor: '#00BFA5',
                          '&:hover': { bgcolor: '#00897B' }
                        }}
                      >
                        {!isEquipmentOut
                          ? 'Registrar salida'
                          : 'Registrar entrada'}
                      </Button>
                    </Box>
                  </FormGridItem>
                </FormSection>
              </Box>
            )}
          </Formik>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}
          >
            <Typography
              component='h2'
              sx={{ fontSize: 17, fontWeight: 700, color: '#111827', mb: 2 }}
            >
              {isEquipmentOut ? 'Salida en curso' : 'Última entrada'}
            </Typography>
            {lastRecord ? (
              <DetailSection
                title={
                  isEquipmentOut
                    ? 'Información de salida'
                    : 'Información de la última entrada'
                }
              >
                <DetailCell>
                  <DetailField
                    label={
                      isEquipmentOut ? 'Fecha de salida' : 'Fecha de entrada'
                    }
                  >
                    {formatDate(
                      isEquipmentOut ? lastRecord.outDate : lastRecord.inDate
                    )}
                  </DetailField>
                </DetailCell>
                <DetailCell>
                  <DetailField label='Motivo de salida'>
                    {orMissing(lastRecord.outReason)}
                  </DetailField>
                </DetailCell>
                <DetailCell>
                  <DetailField label='Inspección visual'>
                    {orMissing(
                      isEquipmentOut
                        ? lastRecord.visualOutInspection
                        : lastRecord.visualInInspection
                    )}
                  </DetailField>
                </DetailCell>
                <DetailCell>
                  <DetailField label='Prueba operativa'>
                    {orMissing(
                      isEquipmentOut
                        ? lastRecord.operationalOutTest
                        : lastRecord.operationalInTest
                    )}
                  </DetailField>
                </DetailCell>
                <DetailCell full>
                  <DetailField
                    label={
                      isEquipmentOut
                        ? 'Observaciones de salida'
                        : 'Observaciones de entrada'
                    }
                  >
                    {orMissing(
                      isEquipmentOut
                        ? lastRecord.observationsOut
                        : lastRecord.observationsIn
                    )}
                  </DetailField>
                </DetailCell>
                <DetailCell full>
                  <DetailField label='Registrado por'>
                    {orMissing(lastRecord.registeredBy)}
                  </DetailField>
                </DetailCell>
              </DetailSection>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Este equipo aún no tiene movimientos registrados.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default EquipmentForm
