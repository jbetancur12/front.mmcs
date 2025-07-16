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
import { useFormik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'

const tncAcceptanceOptions = ['Aceptado', 'No aceptado']
const statusOptions = ['Abierta', 'Cerrada']
const impactOptions = [1, 5]

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
      '') as any,
    registerDate: initialData.registerDate
      ? initialData.registerDate.slice(0, 10)
      : '',
    detectedBy: initialData.detectedBy || '',
    affectedArea: initialData.affectedArea || '',
    iso17025Clause: initialData.iso17025Clause || '',
    findingDescription: initialData.findingDescription || '',
    status: (statusReverseMap[initialData.status as string] ||
      initialData.status ||
      '') as any,
    serviceNumbers: initialData.serviceNumbers || '',
    affectedClients: initialData.affectedClients || '',
    involvedProcedure: initialData.involvedProcedure || '',
    resultsDelivered: initialData.resultsDelivered || '',
    previousResultsReviewed: initialData.previousResultsReviewed || '',
    evaluatedCertificates: initialData.evaluatedCertificates || '',
    moreFindings: (yesNoReverseMap[initialData.moreFindings as string] ||
      initialData.moreFindings ||
      'No') as any,
    actionOnPreviousResults: initialData.actionOnPreviousResults || '',
    resultValidity: initialData.resultValidity || 1,
    affectedServicesCount: initialData.affectedServicesCount || 1,
    clientResultsDelivery: initialData.clientResultsDelivery || 1,
    contractualImpact: initialData.contractualImpact || 1,
    reputationRisk: initialData.reputationRisk || 1,
    previousNonConformWorks: (yesNoReverseMap[
      initialData.previousNonConformWorks as string
    ] ||
      initialData.previousNonConformWorks ||
      'No') as any,
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
      initialData.correctiveActionsEffectiveness || ''
  }

  const formik = useFormik<NonConformWorkReport>({
    initialValues,
    validationSchema: Yup.object({
      tncCode: Yup.string().required('Required'),
      tncAcceptance: Yup.string().required('Required'),
      registerDate: Yup.string().required('Required'),
      detectedBy: Yup.string().required('Required'),
      affectedArea: Yup.string().required('Required'),
      findingDescription: Yup.string().required('Required'),
      status: Yup.string().required('Required'),
      resultValidity: Yup.number().oneOf([1, 5]).required(),
      affectedServicesCount: Yup.number().oneOf([1, 5]).required(),
      clientResultsDelivery: Yup.number().oneOf([1, 5]).required(),
      contractualImpact: Yup.number().oneOf([1, 5]).required(),
      reputationRisk: Yup.number().oneOf([1, 5]).required(),
      nonConformityOccurrences: Yup.number().min(0).required(),
      previousNonConformWorks: Yup.string()
        .oneOf(['Sí', 'No'])
        .required('Required'),
      moreFindings: Yup.string().oneOf(['Sí', 'No']).required('Required')
      // Puedes agregar más validaciones requeridas según tu lógica de negocio
    }),
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
          riskLevel: riskLevelMap[riskLevel] || riskLevel
        }
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

  const impactWeight = useMemo(() => {
    if (impactScore >= 21) return 'Alta'
    if (impactScore >= 13) return 'Media'
    return 'Baja'
  }, [impactScore])

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
                Datos generales
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Código TNC'
                name='tncCode'
                value={formik.values.tncCode}
                onChange={formik.handleChange}
                error={formik.touched.tncCode && Boolean(formik.errors.tncCode)}
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
              <TextField
                fullWidth
                type='date'
                label='Fecha de registro'
                name='registerDate'
                value={formik.values.registerDate}
                onChange={formik.handleChange}
                error={
                  formik.touched.registerDate &&
                  Boolean(formik.errors.registerDate)
                }
                helperText={
                  formik.touched.registerDate && formik.errors.registerDate
                }
                InputLabelProps={{ shrink: true }}
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
                  formik.touched.detectedBy && Boolean(formik.errors.detectedBy)
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
                Servicio afectado
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Números de servicio/certificados'
                name='serviceNumbers'
                value={formik.values.serviceNumbers}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Clientes afectados'
                name='affectedClients'
                value={formik.values.affectedClients}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Magnitud/procedimiento involucrado'
                name='involvedProcedure'
                value={formik.values.involvedProcedure}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Resultados entregados'
                name='resultsDelivered'
                value={formik.values.resultsDelivered}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
            </Grid>
            {/* Evaluación y análisis */}
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
                Evaluación y análisis
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Resultados previos revisados'
                name='previousResultsReviewed'
                value={formik.values.previousResultsReviewed}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Certificados evaluados'
                name='evaluatedCertificates'
                value={formik.values.evaluatedCertificates}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='¿Se encontraron más afectaciones?'
                name='moreFindings'
                value={formik.values.moreFindings}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Acción sobre resultados previos'
                name='actionOnPreviousResults'
                value={formik.values.actionOnPreviousResults}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
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
                Impacto
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
                Probabilidad
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
                Matriz de Riesgos
              </Typography>
              <Typography variant='body2' color='textSecondary' mb={2}>
                El nivel de riesgo se calcula automáticamente según la matriz de
                riesgos.
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
                Acciones tomadas
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
              <TextField
                fullWidth
                label='Fecha de corrección'
                name='correctionDate'
                value={formik.values.correctionDate}
                onChange={formik.handleChange}
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
              <TextField
                fullWidth
                label='Fecha de acción correctiva'
                name='correctiveActionDate'
                value={formik.values.correctiveActionDate}
                onChange={formik.handleChange}
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
                Comunicación
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
              <TextField
                fullWidth
                label='Fecha de notificación'
                name='notificationDate'
                value={formik.values.notificationDate}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Resumen de comunicación'
                name='communicationSummary'
                value={formik.values.communicationSummary}
                onChange={formik.handleChange}
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
                Reanudación del trabajo
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
              <TextField
                fullWidth
                label='Fecha de autorización de reanudación'
                name='resumptionAuthorizationDate'
                value={formik.values.resumptionAuthorizationDate}
                onChange={formik.handleChange}
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
                Cierre
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Fecha de cierre'
                name='closingDate'
                value={formik.values.closingDate}
                onChange={formik.handleChange}
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
                Seguimiento
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
  )
}

export default NonConformWorkReportForm
