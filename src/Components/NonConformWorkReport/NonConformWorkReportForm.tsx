import React, { useMemo } from 'react'
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  Paper
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import esLocale from 'date-fns/locale/es'

const tncAcceptanceOptions = ['Aceptado', 'No aceptado']
const statusOptions = ['Abierta', 'Cerrada']
const impactOptions = [1, 5]
const reviewFrequencyOptions = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Quincenal', value: 'biweekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Personalizada', value: 'custom' }
]

interface NonConformWorkReportFormProps {
  initialData?: Partial<NonConformWorkReport>
  onSuccess?: () => void
  onCancel?: () => void
}

const NonConformWorkReportForm: React.FC<NonConformWorkReportFormProps> = ({
  initialData = {},
  onSuccess,
  onCancel
}) => {
  const axiosPrivate = useAxiosPrivate()

  // Mapeos de español a inglés para enums
  const tncAcceptanceMap: Record<string, string> = {
    Aceptado: 'Accepted',
    'No aceptado': 'No accepted'
  }
  const statusMap: Record<string, string> = {
    Abierta: 'Open',
    Cerrada: 'Closed'
  }
  const yesNoMap: Record<string, string> = {
    Sí: 'Yes',
    No: 'No'
  }
  const impactMap: Record<string, string> = {
    Alta: 'High',
    Media: 'Medium',
    Baja: 'Low'
  }
  const probabilityMap: Record<string, string> = {
    Alta: 'High',
    Media: 'Medium',
    Baja: 'Low'
  }
  const riskLevelMap: Record<string, string> = {
    Crítico: 'Critical',
    Alto: 'High',
    Media: 'Medium',
    Baja: 'Low',
    'Muy Baja': 'Very Low',
    'No evaluado': 'Not evaluated'
  }

  // Mapeos reversos de inglés a español para valores iniciales
  const tncAcceptanceReverseMap: Record<string, string> = {
    Accepted: 'Aceptado',
    'No accepted': 'No aceptado'
  }
  const statusReverseMap: Record<string, string> = {
    Open: 'Abierta',
    Closed: 'Cerrada'
  }
  const yesNoReverseMap: Record<string, string> = {
    Yes: 'Sí',
    No: 'No'
  }

  const initialValues: NonConformWorkReport = {
    tncCode: initialData.tncCode || '',
    tncAcceptance: (tncAcceptanceReverseMap[
      initialData.tncAcceptance as string
    ] ||
      initialData.tncAcceptance ||
      '') as 'Accepted' | 'No accepted',
    registerDate: initialData.registerDate
      ? initialData.registerDate.slice(0, 10)
      : '',
    detectedBy: initialData.detectedBy || '',
    affectedArea: initialData.affectedArea || '',
    iso17025Clause: initialData.iso17025Clause || '',
    findingDescription: initialData.findingDescription || '',
    status: (statusReverseMap[initialData.status as string] ||
      initialData.status ||
      '') as 'Open' | 'Abierta' | 'Closed' | 'Cerrada',
    serviceNumbers: initialData.serviceNumbers || '',
    affectedClients: initialData.affectedClients || '',
    involvedProcedure: initialData.involvedProcedure || '',
    resultsDelivered: initialData.resultsDelivered || '',
    moreFindings: (yesNoReverseMap[initialData.moreFindings as string] ||
      initialData.moreFindings ||
      'No') as 'Yes' | 'No',

    causeAnalysis: initialData.causeAnalysis || '',
    affectedPeriod: initialData.affectedPeriod || '',
    certificateReview: initialData.certificateReview || '',
    procedureReview: initialData.procedureReview || '',
    recordReview: initialData.recordReview || '',
    metrologyInventoryCheck: initialData.metrologyInventoryCheck || '',
    personnelCompetenceEvaluation:
      initialData.personnelCompetenceEvaluation || '',
    resultValidity4_3: initialData.resultValidity4_3 || 1,
    affectedServicesCount4_3: initialData.affectedServicesCount4_3 || 1,
    resultsDelivered4_3: initialData.resultsDelivered4_3 || 1,
    regulatoryOrContractualImpact4_3:
      initialData.regulatoryOrContractualImpact4_3 || 1,
    reputationRisk4_3: initialData.reputationRisk4_3 || 1,
    resultValidity: initialData.resultValidity || 1,
    affectedServicesCount: initialData.affectedServicesCount || 1,
    clientResultsDelivery: initialData.clientResultsDelivery || 1,
    contractualImpact: initialData.contractualImpact || 1,
    reputationRisk: initialData.reputationRisk || 1,
    previousNonConformWorks: (yesNoReverseMap[
      initialData.previousNonConformWorks as string
    ] ||
      initialData.previousNonConformWorks ||
      'No') as 'Yes' | 'No',
    nonConformityOccurrences: initialData.nonConformityOccurrences || 0,
    immediateCorrection: initialData.immediateCorrection || '',
    correctionBy: initialData.correctionBy || '',
    correctionDate: initialData.correctionDate
      ? initialData.correctionDate.slice(0, 10)
      : '',
    correctiveActionRequired: initialData.correctiveActionRequired || false,
    correctiveAction: initialData.correctiveAction || '',
    correctiveActionBy: initialData.correctiveActionBy || '',
    correctiveActionDate: initialData.correctiveActionDate
      ? initialData.correctiveActionDate.slice(0, 10)
      : '',
    clientNotified: initialData.clientNotified || false,
    notificationMethod: initialData.notificationMethod || '',
    notificationDate: initialData.notificationDate
      ? initialData.notificationDate.slice(0, 10)
      : '',
    communicationSummary: initialData.communicationSummary || '',
    workSuspended: initialData.workSuspended || false,
    resumptionAuthorizationDate: initialData.resumptionAuthorizationDate
      ? initialData.resumptionAuthorizationDate.slice(0, 10)
      : '',
    authorizedBy: initialData.authorizedBy || '',
    closingDate: initialData.closingDate
      ? initialData.closingDate.slice(0, 10)
      : '',
    closingResponsible: initialData.closingResponsible || '',
    closingComments: initialData.closingComments || '',
    closingDeadlineExtended: initialData.closingDeadlineExtended || false,
    closingJustification: initialData.closingJustification || '',
    recurrence: initialData.recurrence || false,
    correctiveActionsEffectiveness:
      initialData.correctiveActionsEffectiveness || '',
    reviewFrequency: initialData.reviewFrequency || 'monthly',
    customReviewDays: initialData.customReviewDays || undefined
  }

  const validationSchema = Yup.object({
    tncCode: Yup.string()
      .required('Required')
      .test(
        'unique-tnc-code',
        'El código TNC ya existe',
        async function (value) {
          if (!value) return true // Si no hay valor, deja que 'required' maneje el error

          // Si estamos editando y el código no ha cambiado, no validar
          if (initialData?.id && value === initialData.tncCode) {
            return true
          }

          try {
            const response = await axiosPrivate.get(
              `/non-conform-work-report/check-code/${value}`
            )
            return !response.data.exists // Retorna true si NO existe
          } catch (error) {
            console.error('Error checking TNC code:', error)
            return true // En caso de error, permitir continuar
          }
        }
      ),
    tncAcceptance: Yup.string().required('Required'),
    registerDate: Yup.string().required('Required'),
    detectedBy: Yup.string().required('Required'),
    affectedArea: Yup.string().required('Required'),
    findingDescription: Yup.string().required('Required'),
    status: Yup.string().required('Required'),
    // Campos requeridos de Servicio afectado
    serviceNumbers: Yup.string().required('Requerido'),
    affectedClients: Yup.string().required('Requerido'),
    involvedProcedure: Yup.string().required('Requerido'),
    resultsDelivered: Yup.string().required('Requerido'),
    // Evaluación y análisis
    // previousResultsReviewed: Yup.string().required('Requerido'),
    // evaluatedCertificates: Yup.string().required('Requerido'),
    moreFindings: Yup.string().oneOf(['Sí', 'No']).required('Requerido'),
    // actionOnPreviousResults: Yup.string().required('Requerido'),
    // Análisis de causa
    causeAnalysis: Yup.string().required('Required'),
    affectedPeriod: Yup.string().required('Required'),
    certificateReview: Yup.string().required('Required'),
    procedureReview: Yup.string().required('Required'),
    recordReview: Yup.string().required('Required'),
    metrologyInventoryCheck: Yup.string().required('Required'),
    personnelCompetenceEvaluation: Yup.string().required('Required'),
    // Importancia del trabajo no conforme
    resultValidity4_3: Yup.number().oneOf([1, 5]).required(),
    affectedServicesCount4_3: Yup.number().oneOf([1, 3, 5]).required(),
    resultsDelivered4_3: Yup.number().oneOf([1, 5]).required(),
    regulatoryOrContractualImpact4_3: Yup.number().oneOf([1, 5]).required(),
    reputationRisk4_3: Yup.number().oneOf([1, 5]).required(),
    // Impacto
    resultValidity: Yup.number().oneOf([1, 5]).required(),
    affectedServicesCount: Yup.number().oneOf([1, 5]).required(),
    clientResultsDelivery: Yup.number().oneOf([1, 5]).required(),
    contractualImpact: Yup.number().oneOf([1, 5]).required(),
    reputationRisk: Yup.number().oneOf([1, 5]).required(),
    // Probabilidad
    nonConformityOccurrences: Yup.number().min(0).required(),
    previousNonConformWorks: Yup.string()
      .oneOf(['Sí', 'No'])
      .required('Required'),
    reviewFrequency: Yup.string().when('status', {
      is: (val: string) => val === 'Abierta',
      then: (schema) => schema.required('Requerido'),
      otherwise: (schema) => schema.notRequired()
    }),
    customReviewDays: Yup.number().when('reviewFrequency', {
      is: 'custom',
      then: (schema) =>
        schema
          .required('Ingrese el número de días')
          .min(1, 'Debe ser mayor a 0'),
      otherwise: (schema) => schema.notRequired()
    })
  })

  const formik = useFormik<NonConformWorkReport>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Mapeo de valores antes de enviar
        const payload = {
          ...values,
          tncAcceptance:
            tncAcceptanceMap[values.tncAcceptance] || values.tncAcceptance,
          status: statusMap[values.status] || values.status,
          previousNonConformWorks:
            yesNoMap[values.previousNonConformWorks as string] ||
            values.previousNonConformWorks,
          moreFindings:
            yesNoMap[values.moreFindings as string] || values.moreFindings,
          impactWeight: impactMap[impactWeight] || impactWeight,
          probability: probabilityMap[probability] || probability,
          riskLevel: riskLevelMap[riskLevel] || riskLevel,
          reviewFrequency: values.reviewFrequency,
          customReviewDays: values.customReviewDays
        }
        console.log('Payload to send:', payload)
        if (initialData && initialData.id) {
          // EDITAR
          await axiosPrivate.put(
            `/non-conform-work-report/${initialData.id}`,
            payload
          )
          await Swal.fire({
            icon: 'success',
            title: '¡Edición exitosa!',
            text: 'El reporte fue actualizado correctamente.'
          })
        } else {
          // CREAR
          await axiosPrivate.post('/non-conform-work-report', payload)
          await Swal.fire({
            icon: 'success',
            title: '¡Creación exitosa!',
            text: 'El reporte fue creado correctamente.'
          })
        }
        if (onSuccess) onSuccess()
        resetForm()
      } catch (error) {
        alert('Error saving report')
      } finally {
        setSubmitting(false)
      }
    },
    enableReinitialize: true
  })

  // Cálculos en tiempo real
  const impactScore = useMemo(() => {
    return [
      formik.values.resultValidity,
      formik.values.affectedServicesCount,
      formik.values.clientResultsDelivery,
      formik.values.contractualImpact,
      formik.values.reputationRisk
    ].reduce((a, b) => Number(a) + Number(b), 0)
  }, [formik.values])

  const tncImportanceScore = useMemo(() => {
    return [
      formik.values.resultValidity4_3,
      formik.values.affectedServicesCount4_3,
      formik.values.resultsDelivered4_3,
      formik.values.regulatoryOrContractualImpact4_3,
      formik.values.reputationRisk4_3
    ].reduce((a, b) => Number(a) + Number(b), 0)
  }, [formik.values])

  const impactWeight = useMemo(() => {
    if (impactScore >= 21) return 'Alta'
    if (impactScore >= 13) return 'Media'
    return 'Baja'
  }, [impactScore])

  const tncImportanceWeight = useMemo(() => {
    if (tncImportanceScore > 14) return 'Alta'
    if (tncImportanceScore > 9) return 'Media'
    return 'Baja'
  }, [tncImportanceScore])

  const probability = useMemo(() => {
    if (formik.values.nonConformityOccurrences >= 5) return 'Alta'
    if (formik.values.nonConformityOccurrences >= 2) return 'Media'
    return 'Baja'
  }, [formik.values.nonConformityOccurrences])

  const riskLevel = useMemo(() => {
    const impact = impactWeight
    const prob = probability
    if (impact === 'Alta' && prob === 'Alta') return 'Crítico'
    if (impact === 'Alta' && prob === 'Media') return 'Alto'
    if (impact === 'Alta' && prob === 'Baja') return 'Media'
    if (impact === 'Media' && prob === 'Alta') return 'Alto'
    if (impact === 'Media' && prob === 'Media') return 'Media'
    if (impact === 'Media' && prob === 'Baja') return 'Baja'
    if (impact === 'Baja' && prob === 'Alta') return 'Media'
    if (impact === 'Baja' && prob === 'Media') return 'Baja'
    if (impact === 'Baja' && prob === 'Baja') return 'Muy Baja'
    return 'No evaluado'
  }, [impactWeight, probability])

  // Función para asignar color según el nivel de riesgo
  const riskLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'Crítico':
        return '#e53935'
      case 'Alto':
        return '#ff7043'
      case 'Media':
        return '#fff176'
      case 'Baja':
        return '#81c784'
      case 'Muy Baja':
        return '#388e3c'
      default:
        return '#bdbdbd'
    }
  }

  // Función para asignar color a impacto y probabilidad
  const impactProbColor = (valor: string) => {
    switch (valor) {
      case 'Alta':
      case 'Alto':
        return '#ff7043'
      case 'Media':
      case 'Medio':
        return '#fff176'
      case 'Baja':
      case 'Muy Baja':
      case 'Bajo':
        return '#81c784'
      default:
        return '#bdbdbd'
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
      <Box sx={{ background: '#f7fafd', minHeight: '100vh', py: 4 }}>
        <form onSubmit={formik.handleSubmit}>
          <Paper
            elevation={3}
            sx={{ maxWidth: 900, mx: 'auto', p: 4, borderRadius: 4 }}
          >
            <Typography variant='h5' mb={3} align='center' color='primary'>
              Reporte de Trabajo No Conforme
            </Typography>
            <Grid container spacing={2}>
              {/* Datos generales */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  1. Datos generales
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Código TNC'
                  name='tncCode'
                  value={formik.values.tncCode}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tncCode && Boolean(formik.errors.tncCode)
                  }
                  helperText={formik.touched.tncCode && formik.errors.tncCode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Aceptación TNC'
                  name='tncAcceptance'
                  value={formik.values.tncAcceptance}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tncAcceptance &&
                    Boolean(formik.errors.tncAcceptance)
                  }
                  helperText={
                    formik.touched.tncAcceptance && formik.errors.tncAcceptance
                  }
                >
                  {tncAcceptanceOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de registro'
                  value={
                    formik.values.registerDate
                      ? new Date(formik.values.registerDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'registerDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('registerDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'registerDate',
                      error:
                        formik.touched.registerDate &&
                        Boolean(formik.errors.registerDate),
                      helperText:
                        formik.touched.registerDate &&
                        formik.errors.registerDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Detectado por'
                  name='detectedBy'
                  value={formik.values.detectedBy}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.detectedBy &&
                    Boolean(formik.errors.detectedBy)
                  }
                  helperText={
                    formik.touched.detectedBy && formik.errors.detectedBy
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Área/proceso afectado'
                  name='affectedArea'
                  value={formik.values.affectedArea}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.affectedArea &&
                    Boolean(formik.errors.affectedArea)
                  }
                  helperText={
                    formik.touched.affectedArea && formik.errors.affectedArea
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Numeral de ISO 17025 relacionado'
                  name='iso17025Clause'
                  value={formik.values.iso17025Clause || ''}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.iso17025Clause &&
                    Boolean(formik.errors.iso17025Clause)
                  }
                  helperText={
                    formik.touched.iso17025Clause &&
                    formik.errors.iso17025Clause
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Estatus'
                  name='status'
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Periodicidad de revisión'
                  name='reviewFrequency'
                  value={formik.values.reviewFrequency}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.reviewFrequency &&
                    Boolean(formik.errors.reviewFrequency)
                  }
                  helperText={
                    formik.touched.reviewFrequency &&
                    formik.errors.reviewFrequency
                  }
                  disabled={formik.values.status !== 'Abierta'}
                >
                  {reviewFrequencyOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {formik.values.reviewFrequency === 'custom' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Días para revisión personalizada'
                    name='customReviewDays'
                    value={formik.values.customReviewDays || ''}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.customReviewDays &&
                      Boolean(formik.errors.customReviewDays)
                    }
                    helperText={
                      formik.touched.customReviewDays &&
                      formik.errors.customReviewDays
                    }
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Descripción del hallazgo'
                  name='findingDescription'
                  value={formik.values.findingDescription}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.findingDescription &&
                    Boolean(formik.errors.findingDescription)
                  }
                  helperText={
                    formik.touched.findingDescription &&
                    formik.errors.findingDescription
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Servicio afectado */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  2. Servicio afectado
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Números de servicio/certificados'
                  name='serviceNumbers'
                  value={formik.values.serviceNumbers}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.serviceNumbers &&
                    Boolean(formik.errors.serviceNumbers)
                  }
                  helperText={
                    formik.touched.serviceNumbers &&
                    formik.errors.serviceNumbers
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Clientes afectados'
                  name='affectedClients'
                  value={formik.values.affectedClients}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.affectedClients &&
                    Boolean(formik.errors.affectedClients)
                  }
                  helperText={
                    formik.touched.affectedClients &&
                    formik.errors.affectedClients
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Magnitud/procedimiento involucrado'
                  name='involvedProcedure'
                  value={formik.values.involvedProcedure}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.involvedProcedure &&
                    Boolean(formik.errors.involvedProcedure)
                  }
                  helperText={
                    formik.touched.involvedProcedure &&
                    formik.errors.involvedProcedure
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Resultados entregados'
                  name='resultsDelivered'
                  value={formik.values.resultsDelivered}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.resultsDelivered &&
                    Boolean(formik.errors.resultsDelivered)
                  }
                  helperText={
                    formik.touched.resultsDelivered &&
                    formik.errors.resultsDelivered
                  }
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Analisis de Causa */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  3. Analisis de Causa
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Analisis de causa'
                  name='causeAnalysis'
                  value={formik.values.causeAnalysis}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.causeAnalysis &&
                    Boolean(formik.errors.causeAnalysis)
                  }
                  helperText={
                    formik.touched.causeAnalysis && formik.errors.causeAnalysis
                  }
                  multiline
                  minRows={2}
                />
              </Grid>

              {/* 4. Evaluación de la importancia del trabajo no conforme y análisis de resultados previos */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 0,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  4. Evaluación de la importancia del trabajo no conforme y
                  análisis de resultados previos
                </Typography>
              </Grid>

              {/* 4.1 Alcance */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  4.1 Alcance
                </Typography>
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Identificación del período afectado por el trabajo no conforme'
                  name='affectedPeriod'
                  value={formik.values.affectedPeriod}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>
              {/*  4.2 Verificación de registros */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  4.2 Verificación de registros
                </Typography>
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Revisión de certificados emitidos durante el período afectado'
                  name='certificateReview'
                  value={formik.values.certificateReview}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Revisión de procedimientos, políticas o formatos'
                  name='procedureReview'
                  value={formik.values.procedureReview}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Revisión de registros del sistema de gestión (ambientales, hojas de trabajo, etc.)'
                  name='recordReview'
                  value={formik.values.recordReview}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Verificación del inventario metrológico afectado'
                  name='metrologyInventoryCheck'
                  value={formik.values.metrologyInventoryCheck}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label='Evaluación de la competencia del personal involucrado'
                  name='personnelCompetenceEvaluation'
                  value={formik.values.personnelCompetenceEvaluation}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>

              {/*  4.3 Importancia del trabajo no conforme */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  4.3 Importancia del trabajo no conforme
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Afectación a la validez del resultado'
                  name='resultValidity4_3'
                  value={formik.values.resultValidity4_3}
                  onChange={formik.handleChange}
                  helperText='Hay o no afectación en la validez de los resultados'
                >
                  {[1, 5].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Número de servicios afectados'
                  name='affectedServicesCount4_3'
                  value={formik.values.affectedServicesCount4_3}
                  onChange={formik.handleChange}
                  helperText='5 o menos (1), 10 o menos (3), más de 10 (5)'
                >
                  {[1, 3, 5].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='¿Resultados ya entregados?'
                  name='resultsDelivered4_3'
                  value={formik.values.resultsDelivered4_3}
                  onChange={formik.handleChange}
                  helperText='Se entregaron los resultados'
                >
                  {[1, 5].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Impacto normativo o contractual'
                  name='regulatoryOrContractualImpact4_3'
                  value={formik.values.regulatoryOrContractualImpact4_3}
                  onChange={formik.handleChange}
                  helperText='Hay impacto normativo o contractual'
                >
                  {[1, 5].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Riesgo a la reputación'
                  name='reputationRisk4_3'
                  value={formik.values.reputationRisk4_3}
                  onChange={formik.handleChange}
                  helperText='Hay riesgo en la reputación'
                >
                  {[1, 5].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box mt={2} mb={2}>
                  <Typography variant='body2' color='textSecondary'>
                    Total: <b>{tncImportanceScore}</b> &nbsp; | &nbsp;
                    Importancia del trabajo no conforme:{' '}
                    <b>{tncImportanceWeight}</b>
                  </Typography>
                </Box>
              </Grid>

              {/* Impacto */}
              <Grid item xs={12} mt={2}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  5. Nivel de riesgo del trabajo no conforme
                </Typography>
              </Grid>
              <Grid item xs={12} mt={2}>
                <Typography
                  variant='subtitle2'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  5.1 Impacto
                </Typography>
                <Typography variant='body2' color='textSecondary' mb={2}>
                  Califique cada criterio según la descripción y la valoración
                  sugerida.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Validez del resultado'
                  name='resultValidity'
                  value={formik.values.resultValidity}
                  onChange={formik.handleChange}
                  helperText='¿Se afecta la trazabilidad o confiabilidad de los resultados de servicios? (1: No, 5: Sí)'
                >
                  {impactOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Cantidad de servicios/calibraciones afectadas'
                  name='affectedServicesCount'
                  value={formik.values.affectedServicesCount}
                  onChange={formik.handleChange}
                  helperText='¿Cuántos servicios están involucrados? (1: <5 servicios, 5: >=5 servicios)'
                >
                  {impactOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Entrega de resultados al cliente'
                  name='clientResultsDelivery'
                  value={formik.values.clientResultsDelivery}
                  onChange={formik.handleChange}
                  helperText='¿Los resultados ya fueron entregados? (1: no entregados, 5: entregados y con impacto en decisión del cliente)'
                >
                  {impactOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Impacto contractual / regulatorio'
                  name='contractualImpact'
                  value={formik.values.contractualImpact}
                  onChange={formik.handleChange}
                  helperText='¿Hay incumplimiento de requisitos normativos o legales? (1: interno, 5: legal/ISO/regulador)'
                >
                  {impactOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Riesgo a la reputación'
                  name='reputationRisk'
                  value={formik.values.reputationRisk}
                  onChange={formik.handleChange}
                  helperText='¿Afecta la imagen del laboratorio? (1: interno, 5: cliente clave o mercado externo)'
                >
                  {impactOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box mt={2} mb={2}>
                  <Typography variant='body2' color='textSecondary'>
                    Total de puntos: <b>{impactScore}</b> &nbsp; | &nbsp;
                    Ponderación de impacto: <b>{impactWeight}</b>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Probabilidad */}
              <Grid item xs={12} mt={2}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  5.2 Probabilidad
                </Typography>
                <Typography variant='body2' color='textSecondary' mb={2}>
                  Indique si se han presentado trabajos no conformes similares y
                  cuántas veces se ha materializado el incumplimiento en los
                  últimos dos años.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='¿Se han presentado anteriormente trabajos no conformes similares?'
                  name='previousNonConformWorks'
                  value={formik.values.previousNonConformWorks}
                  onChange={formik.handleChange}
                  helperText='Seleccione Sí o No'
                >
                  <MenuItem value='Sí'>Sí</MenuItem>
                  <MenuItem value='No'>No</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='number'
                  label='¿Cuántas veces se ha materializado el incumplimiento al requisito en los dos últimos años?'
                  name='nonConformityOccurrences'
                  value={formik.values.nonConformityOccurrences}
                  onChange={formik.handleChange}
                  helperText='Alta: >3 veces, Media: 1-3 veces, Baja: <1 vez'
                />
              </Grid>
              <Grid item xs={12}>
                <Box mt={2} mb={2}>
                  <Typography variant='body2' color='textSecondary'>
                    Probabilidad calculada: <b>{probability}</b>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Matriz de riesgos */}
              <Grid item xs={12} mt={2}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  5.3 Matriz de Riesgos
                </Typography>
                <Typography variant='body2' color='textSecondary' mb={2}>
                  El nivel de riesgo se calcula automáticamente según la matriz
                  de riesgos.
                </Typography>
                <Box mt={1} mb={2} display='flex' alignItems='center' gap={2}>
                  <Box
                    px={2}
                    py={1}
                    borderRadius={2}
                    bgcolor={impactProbColor(impactWeight)}
                    color={
                      ['Media', 'Baja', 'Muy Baja', 'Medio', 'Bajo'].includes(
                        impactWeight
                      )
                        ? '#333'
                        : '#fff'
                    }
                    fontWeight='bold'
                    minWidth={100}
                    textAlign='center'
                  >
                    Impacto: {impactWeight}
                  </Box>
                  <Box
                    px={2}
                    py={1}
                    borderRadius={2}
                    bgcolor={impactProbColor(probability)}
                    color={
                      ['Media', 'Baja', 'Muy Baja', 'Medio', 'Bajo'].includes(
                        probability
                      )
                        ? '#333'
                        : '#fff'
                    }
                    fontWeight='bold'
                    minWidth={120}
                    textAlign='center'
                  >
                    Probabilidad: {probability}
                  </Box>
                  <Box
                    px={2}
                    py={1}
                    borderRadius={2}
                    bgcolor={riskLevelColor(riskLevel)}
                    color={
                      ['Media', 'Baja', 'Muy Baja'].includes(riskLevel)
                        ? '#333'
                        : '#fff'
                    }
                    fontWeight='bold'
                    minWidth={140}
                    textAlign='center'
                  >
                    Nivel de riesgo: {riskLevel}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Acciones tomadas */}
              <Grid item xs={12} mt={2}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  6. Acciones tomadas
                </Typography>
                <Typography variant='body2' color='textSecondary' mb={2}>
                  Indique las acciones inmediatas y correctivas aplicadas,
                  responsables y fechas de ejecución.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Corrección inmediata'
                  name='immediateCorrection'
                  value={formik.values.immediateCorrection}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Responsable de la corrección'
                  name='correctionBy'
                  value={formik.values.correctionBy}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de corrección'
                  value={
                    formik.values.correctionDate
                      ? new Date(formik.values.correctionDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'correctionDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('correctionDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'correctionDate',
                      error:
                        formik.touched.correctionDate &&
                        Boolean(formik.errors.correctionDate),
                      helperText:
                        formik.touched.correctionDate &&
                        formik.errors.correctionDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.correctiveActionRequired}
                      onChange={formik.handleChange}
                      name='correctiveActionRequired'
                    />
                  }
                  label='¿Requiere acción correctiva?'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Acción correctiva'
                  name='correctiveAction'
                  value={formik.values.correctiveAction}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Responsable de la acción correctiva'
                  name='correctiveActionBy'
                  value={formik.values.correctiveActionBy}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de acción correctiva'
                  value={
                    formik.values.correctiveActionDate
                      ? new Date(formik.values.correctiveActionDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'correctiveActionDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('correctiveActionDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'correctiveActionDate',
                      error:
                        formik.touched.correctiveActionDate &&
                        Boolean(formik.errors.correctiveActionDate),
                      helperText:
                        formik.touched.correctiveActionDate &&
                        formik.errors.correctiveActionDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Notificación al cliente */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mt: 2,
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  7. Comunicación
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.clientNotified}
                      onChange={formik.handleChange}
                      name='clientNotified'
                    />
                  }
                  label='¿Se notificó al cliente?'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Método de notificación'
                  name='notificationMethod'
                  value={formik.values.notificationMethod}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de notificación'
                  value={
                    formik.values.notificationDate
                      ? new Date(formik.values.notificationDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'notificationDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('notificationDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'notificationDate',
                      error:
                        formik.touched.notificationDate &&
                        Boolean(formik.errors.notificationDate),
                      helperText:
                        formik.touched.notificationDate &&
                        formik.errors.notificationDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Resumen de comunicación'
                  name='communicationSummary'
                  value={formik.values.communicationSummary}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Suspensión y reanudación del trabajo */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mt: 2,
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  8. Reanudación del trabajo
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.workSuspended}
                      onChange={formik.handleChange}
                      name='workSuspended'
                    />
                  }
                  label='Fue necesario suspender el trabajo'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de autorización de reanudación'
                  value={
                    formik.values.resumptionAuthorizationDate
                      ? new Date(formik.values.resumptionAuthorizationDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'resumptionAuthorizationDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('resumptionAuthorizationDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'resumptionAuthorizationDate',
                      error:
                        formik.touched.resumptionAuthorizationDate &&
                        Boolean(formik.errors.resumptionAuthorizationDate),
                      helperText:
                        formik.touched.resumptionAuthorizationDate &&
                        formik.errors.resumptionAuthorizationDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Autorizado por'
                  name='authorizedBy'
                  value={formik.values.authorizedBy}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
              {/* Cierre y efectividad */}
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mt: 2,
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  9. Cierre
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label='Fecha de cierre'
                  value={
                    formik.values.closingDate
                      ? new Date(formik.values.closingDate)
                      : null
                  }
                  onChange={(value) => {
                    if (value instanceof Date && !isNaN(value.getTime())) {
                      formik.setFieldValue(
                        'closingDate',
                        value.toISOString().slice(0, 10)
                      )
                    } else {
                      formik.setFieldValue('closingDate', '')
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: 'closingDate',
                      error:
                        formik.touched.closingDate &&
                        Boolean(formik.errors.closingDate),
                      helperText:
                        formik.touched.closingDate && formik.errors.closingDate,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Responsable de cierre'
                  name='closingResponsible'
                  value={formik.values.closingResponsible}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Comentarios adicionales'
                  name='closingComments'
                  value={formik.values.closingComments}
                  onChange={formik.handleChange}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.closingDeadlineExtended}
                      onChange={formik.handleChange}
                      name='closingDeadlineExtended'
                    />
                  }
                  label='¿Se amplió el plazo de cierre?'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Justificación (Si aplica)'
                  name='closingJustification'
                  value={formik.values.closingJustification}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    mt: 2,
                    mb: 1,
                    textAlign: 'center',
                    color: 'secondary.main',
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  10. Seguimiento
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.recurrence}
                      onChange={formik.handleChange}
                      name='recurrence'
                    />
                  }
                  label='¿Hubo reincidencia?'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Evaluación de eficacia de acciones correctivas'
                  name='correctiveActionsEffectiveness'
                  value={formik.values.correctiveActionsEffectiveness}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>

            {/* Mostrar errores generales */}
            {formik.submitCount > 0 &&
              Object.keys(formik.errors).length > 0 && (
                <Box mt={2} p={2} bgcolor='error.light' borderRadius={1}>
                  <Typography
                    variant='body2'
                    color='error.dark'
                    fontWeight='bold'
                  >
                    ⚠️ Hay errores en el formulario. Por favor, revise los
                    campos resaltados.
                  </Typography>
                  <Typography variant='body2' color='error.dark' mt={1}>
                    Campos con errores: {Object.keys(formik.errors).length}
                  </Typography>
                </Box>
              )}

            <Box mt={3} display='flex' gap={2} justifyContent='center'>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                disabled={formik.isSubmitting}
              >
                Guardar
              </Button>
              <Button variant='outlined' color='secondary' onClick={onCancel}>
                Cancelar
              </Button>
            </Box>
          </Paper>
        </form>
      </Box>
    </LocalizationProvider>
  )
}

export default NonConformWorkReportForm
