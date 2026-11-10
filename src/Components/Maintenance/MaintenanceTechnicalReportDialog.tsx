import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Add,
  DeleteOutline,
  Engineering,
  Science,
  PictureAsPdf
} from '@mui/icons-material'
import type {
  MaintenanceProtocolTemplate,
  MaintenanceTechnicalReport,
  MaintenanceTechnicalReportPart,
  MaintenanceTechnicalReportRequest,
  MaintenanceTechnicalReportTest,
  MaintenanceTechnicalReportTool,
  MaintenanceToolEquipmentSummary
} from '../../types/maintenance'
import {
  useMaintenanceProtocolTemplates,
  useMaintenanceToolEquipmentSearch
} from '../../hooks/useMaintenance'
import { neutral, intent, brand } from 'src/theme/designTokens'
import { confirmDialog } from 'src/utils/confirm'
import FormTabs, { FormTab } from 'src/Components/Common/FormTabs'
import FormErrorSummary from 'src/Components/Common/FormErrorSummary'
import { getTechnicalReportCompletion } from './technicalReportCompletion'

interface Props {
  open: boolean
  onClose: () => void
  report: MaintenanceTechnicalReport | undefined
  equipmentType?: string
  loading?: boolean
  saving?: boolean
  generatingPdf?: boolean
  onSave: (data: MaintenanceTechnicalReportRequest) => Promise<void> | void
  onGeneratePdf: () => void
}

type ReportTab = 'general' | 'diagnosis' | 'verification' | 'closing'

const ERROR_TAB: Record<string, ReportTab> = {
  finalDiagnosis: 'diagnosis',
  rootCause: 'diagnosis',
  activities: 'diagnosis',
  verificationProtocolType: 'verification',
  verificationTools: 'verification',
  verificationTests: 'verification'
}

interface ValidationState {
  finalDiagnosis?: string
  rootCause?: string
  activities?: string
  verificationProtocolType?: string
  verificationTools?: string
  verificationTests?: string
}

const defaultReportState: MaintenanceTechnicalReportRequest = {
  maintenanceType: 'corrective',
  serviceFinalStatus: 'OPERATIVO',
  deliveryStatus: 'OPERATIVO',
  riskClass: '',
  finalDiagnosis: '',
  rootCause: '',
  activities: [''],
  parts: [{ description: '', quantity: 1, code: '', notes: '' }],
  verificationProtocolType: '',
  verificationTools: [
    {
      name: '',
      serial: '',
      calibrationDue: null,
      internalCode: null,
      location: null
    }
  ],
  verificationTests: [{ parameter: '', result: 'PASA', value: '', notes: '' }],
  recommendations: '',
  nextMaintenanceDate: null,
  warrantyDays: 90,
  warrantyTerms: '',
  scopeClause: '',
  responsibilityClause: ''
}

const toEditableReport = (
  report?: MaintenanceTechnicalReport
): MaintenanceTechnicalReportRequest => {
  if (!report) return defaultReportState

  return {
    maintenanceType: report.maintenanceType || 'corrective',
    serviceFinalStatus: report.serviceFinalStatus || 'OPERATIVO',
    deliveryStatus: report.deliveryStatus || 'OPERATIVO',
    riskClass: report.riskClass || '',
    finalDiagnosis: report.finalDiagnosis || '',
    rootCause: report.rootCause || '',
    activities: report.activities.length ? report.activities : [''],
    parts: report.parts.length
      ? report.parts
      : [{ description: '', quantity: 1, code: '', notes: '' }],
    verificationProtocolType: report.verificationProtocolType || '',
    verificationTools: report.verificationTools.length
      ? report.verificationTools
      : [
          {
            name: '',
            serial: '',
            calibrationDue: null,
            internalCode: null,
            location: null
          }
        ],
    verificationTests: report.verificationTests.length
      ? report.verificationTests
      : [{ parameter: '', result: 'PASA', value: '', notes: '' }],
    recommendations: report.recommendations || '',
    nextMaintenanceDate: report.nextMaintenanceDate || null,
    warrantyDays: report.warrantyDays ?? 90,
    warrantyTerms: report.warrantyTerms || '',
    scopeClause: report.scopeClause || '',
    responsibilityClause: report.responsibilityClause || ''
  }
}

const sectionCardSx = {
  p: 2,
  borderRadius: '12px',
  border: `1px solid ${neutral.border}`,
  boxShadow: 'none',
  backgroundColor: neutral.surface
}

const getCompletionTone = (pct: number) => {
  if (pct >= 80) return { label: 'Listo para PDF', color: 'success' as const }
  if (pct >= 45) return { label: 'En construcción', color: 'primary' as const }
  return { label: 'Base creada', color: 'default' as const }
}

const MaintenanceTechnicalReportDialog: React.FC<Props> = ({
  open,
  onClose,
  report,
  equipmentType,
  loading = false,
  saving = false,
  generatingPdf = false,
  onSave,
  onGeneratePdf
}) => {
  const { data: protocolTemplates = [] } = useMaintenanceProtocolTemplates()
  const [formData, setFormData] =
    useState<MaintenanceTechnicalReportRequest>(defaultReportState)
  const [errors, setErrors] = useState<ValidationState>({})
  const [tab, setTab] = useState<ReportTab>('general')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [toolSearch, setToolSearch] = useState('')
  const { data: toolEquipmentOptions = [], isFetching: toolSearchLoading } =
    useMaintenanceToolEquipmentSearch(toolSearch)

  const activeProtocols = React.useMemo(
    () => protocolTemplates.filter((protocol) => protocol.isActive),
    [protocolTemplates]
  )

  const matchedProtocol = React.useMemo(
    () =>
      activeProtocols.find(
        (protocol) => protocol.code === formData.verificationProtocolType
      ) || null,
    [activeProtocols, formData.verificationProtocolType]
  )

  useEffect(() => {
    if (open) {
      setFormData(toEditableReport(report))
      setErrors({})
      setTab('general')
    }
  }, [open, report])

  const suggestedProtocol = React.useMemo(() => {
    const normalizedType = (equipmentType || '').toLowerCase()
    return (
      activeProtocols.find((protocol) =>
        protocol.appliesTo.some((keyword) =>
          normalizedType.includes(keyword.toLowerCase())
        )
      ) || null
    )
  }, [activeProtocols, equipmentType])

  const baseline = React.useMemo(() => toEditableReport(report), [report])
  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(baseline)

  // Cerrar con cambios sin guardar pide confirmación para no perder lo digitado
  const handleRequestClose = async () => {
    if (!hasUnsavedChanges) {
      onClose()
      return
    }
    const { isConfirmed } = await confirmDialog({
      title: '¿Cerrar sin guardar?',
      text: 'Hay cambios en el reporte técnico que aún no se han guardado. Si cierras ahora, se perderán.',
      confirmLabel: 'Cerrar sin guardar',
      cancelLabel: 'Seguir editando',
      tone: 'danger'
    })
    if (isConfirmed) onClose()
  }

  const applyProtocol = (protocol: MaintenanceProtocolTemplate) => {
    if (!protocol) return

    setFormData((prev) => ({
      ...prev,
      verificationProtocolType: protocol.code,
      riskClass: protocol.riskClass || prev.riskClass,
      verificationTools: protocol.tools.length
        ? protocol.tools
        : prev.verificationTools,
      verificationTests: protocol.tests.length
        ? protocol.tests
        : prev.verificationTests,
      recommendations: prev.recommendations || protocol.recommendations || ''
    }))
  }

  // Aplicar un protocolo reemplaza herramientas y pruebas: si ya hay digitadas, se pregunta antes
  const requestApplyProtocol = async (
    protocol: MaintenanceProtocolTemplate
  ) => {
    const replacesTools =
      protocol.tools.length > 0 &&
      formData.verificationTools.some((tool) => tool.name?.trim())
    const replacesTests =
      protocol.tests.length > 0 &&
      formData.verificationTests.some((test) => test.parameter.trim())

    if (replacesTools || replacesTests) {
      const { isConfirmed } = await confirmDialog({
        title: `¿Aplicar el protocolo "${protocol.name}"?`,
        text: 'Las herramientas y pruebas que ya digitaste se reemplazarán por las del protocolo.',
        confirmLabel: 'Aplicar protocolo',
        cancelLabel: 'Cancelar'
      })
      if (!isConfirmed) return
    }
    applyProtocol(protocol)
  }

  const handleFieldChange = (
    field: keyof MaintenanceTechnicalReportRequest,
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleActivityChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.map((activity, idx) =>
        idx === index ? value : activity
      )
    }))
  }

  const addActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [...prev.activities, '']
    }))
  }

  const removeActivity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      activities:
        prev.activities.length > 1
          ? prev.activities.filter((_, idx) => idx !== index)
          : ['']
    }))
  }

  const handlePartChange = (
    index: number,
    field: keyof MaintenanceTechnicalReportPart,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.map((part, idx) =>
        idx === index ? { ...part, [field]: value } : part
      )
    }))
  }

  const addPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [
        ...prev.parts,
        { description: '', quantity: 1, code: '', notes: '' }
      ]
    }))
  }

  const removePart = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parts:
        prev.parts.length > 1
          ? prev.parts.filter((_, idx) => idx !== index)
          : [{ description: '', quantity: 1, code: '', notes: '' }]
    }))
  }

  const handleToolChange = (
    index: number,
    field: keyof MaintenanceTechnicalReportTool,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      verificationTools: prev.verificationTools.map((tool, idx) =>
        idx === index ? { ...tool, [field]: value } : tool
      )
    }))
  }

  const addTool = () => {
    setFormData((prev) => ({
      ...prev,
      verificationTools: [
        ...prev.verificationTools,
        {
          name: '',
          serial: '',
          calibrationDue: null,
          internalCode: null,
          location: null
        }
      ]
    }))
  }

  const removeTool = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      verificationTools:
        prev.verificationTools.length > 1
          ? prev.verificationTools.filter((_, idx) => idx !== index)
          : [
              {
                name: '',
                serial: '',
                calibrationDue: null,
                internalCode: null,
                location: null
              }
            ]
    }))
  }

  const handleTestChange = (
    index: number,
    field: keyof MaintenanceTechnicalReportTest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      verificationTests: prev.verificationTests.map((test, idx) =>
        idx === index ? { ...test, [field]: value } : test
      )
    }))
  }

  const addTest = () => {
    setFormData((prev) => ({
      ...prev,
      verificationTests: [
        ...prev.verificationTests,
        { parameter: '', result: 'PASA', value: '', notes: '' }
      ]
    }))
  }

  const removeTest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      verificationTests:
        prev.verificationTests.length > 1
          ? prev.verificationTests.filter((_, idx) => idx !== index)
          : [{ parameter: '', result: 'PASA', value: '', notes: '' }]
    }))
  }

  const handleSave = async () => {
    const nextErrors: ValidationState = {}
    const normalizedActivities = formData.activities
      .map((item) => item.trim())
      .filter(Boolean)
    const normalizedTools = formData.verificationTools.filter((tool) =>
      tool.name?.trim()
    )
    const normalizedTests = formData.verificationTests.filter((test) =>
      test.parameter.trim()
    )

    if (!formData.finalDiagnosis?.trim()) {
      nextErrors.finalDiagnosis = 'Registra el diagnóstico técnico final.'
    }

    if (!formData.rootCause?.trim()) {
      nextErrors.rootCause = 'Registra la causa raíz de la intervención.'
    }

    if (!normalizedActivities.length) {
      nextErrors.activities = 'Agrega al menos una actividad ejecutada.'
    }

    if (!formData.verificationProtocolType?.trim()) {
      nextErrors.verificationProtocolType =
        'Define el protocolo de verificación aplicado.'
    }

    if (!normalizedTools.length) {
      nextErrors.verificationTools =
        'Agrega al menos una herramienta o equipo de medición.'
    }

    if (!normalizedTests.length) {
      nextErrors.verificationTests = 'Agrega al menos una prueba post-servicio.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      const firstWithError = Object.keys(nextErrors)[0]
      setTab(ERROR_TAB[firstWithError] ?? 'general')
      return
    }

    const payload: MaintenanceTechnicalReportRequest = {
      ...formData,
      activities: normalizedActivities,
      parts: formData.parts.filter((part) => part.description.trim()),
      verificationTools: normalizedTools,
      verificationTests: normalizedTests
    }

    await onSave(payload)
  }

  const countErrors = (tabKey: ReportTab) =>
    Object.keys(errors).filter(
      (key) => errors[key as keyof ValidationState] && ERROR_TAB[key] === tabKey
    ).length
  const tabs: FormTab[] = [
    { key: 'general', label: 'General' },
    {
      key: 'diagnosis',
      label: 'Diagnóstico e intervención',
      errorCount: countErrors('diagnosis')
    },
    {
      key: 'verification',
      label: 'Verificación',
      errorCount: countErrors('verification')
    },
    { key: 'closing', label: 'Conclusiones' }
  ]
  const totalErrors = Object.values(errors).filter(Boolean).length
  const tabSx = (key: ReportTab) => ({
    display: tab === key ? 'block' : 'none'
  })

  const completionPct = getTechnicalReportCompletion(formData)
  const completionTone = getCompletionTone(completionPct)

  return (
    <Dialog
      open={open}
      onClose={handleRequestClose}
      maxWidth='lg'
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={1.5}
        >
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              Reporte Técnico de Mantenimiento
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Documento técnico de cierre con diagnóstico, intervención,
              verificación y conclusiones.
            </Typography>
          </Box>
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Chip
              size='small'
              color={completionPct >= 75 ? 'success' : 'primary'}
              label={`${completionPct}% diligenciado`}
            />
            <Chip
              size='small'
              color={completionTone.color}
              variant='outlined'
              label={completionTone.label}
            />
            <Chip
              size='small'
              color='success'
              label={report?.serviceFinalStatus || 'OPERATIVO'}
            />
            {report?.verificationProtocolType && (
              <Chip
                size='small'
                variant='outlined'
                label={report.verificationProtocolType}
              />
            )}
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: neutral.surfaceAlt }}>
        {loading && (
          <SignalLoader message='Cargando estructura del reporte técnico...' />
        )}

        <FormTabs
          tabs={tabs}
          value={tab}
          onChange={(k) => setTab(k as ReportTab)}
        />
        <FormErrorSummary count={totalErrors} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: totalErrors ? 2 : 0
          }}
        >
          <Paper
            sx={{
              ...sectionCardSx,
              ...tabSx('general'),
              backgroundColor: neutral.surfaceAlt
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Resumen de diligenciamiento
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Completa diagnóstico, actividades, verificación y conclusiones
                  para dejar el PDF listo para entrega.
                </Typography>
              </Box>
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                <Chip
                  size='small'
                  variant='outlined'
                  label={
                    formData.verificationProtocolType?.trim()
                      ? `Protocolo: ${matchedProtocol?.name || formData.verificationProtocolType}`
                      : 'Protocolo pendiente'
                  }
                />
                <Chip
                  size='small'
                  variant='outlined'
                  label={
                    formData.deliveryStatus?.trim()
                      ? `Entrega: ${formData.deliveryStatus.replace(/_/g, ' ')}`
                      : 'Entrega pendiente'
                  }
                />
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('general') }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1.5 }}>
              Asistente de Protocolo
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Puedes cargar una estructura base según el tipo de equipo y luego
              afinar el reporte.
            </Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap'>
              {activeProtocols.map((protocol) => (
                <Button
                  key={protocol.id}
                  size='small'
                  variant={
                    suggestedProtocol?.id === protocol.id
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() => requestApplyProtocol(protocol)}
                  sx={{ mb: 1 }}
                >
                  {protocol.name}
                </Button>
              ))}
            </Stack>
            {suggestedProtocol && (
              <Alert severity='info' sx={{ mt: 1 }}>
                Sugerencia automática para este equipo: {suggestedProtocol.name}
                .
              </Alert>
            )}
            {!activeProtocols.length && (
              <Alert severity='warning' sx={{ mt: 1 }}>
                No hay protocolos activos cargados. Puedes administrarlos desde
                el menú de mantenimiento.
              </Alert>
            )}
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('general') }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2 }}>
              Resumen Técnico
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label='Estado final'
                  value={formData.serviceFinalStatus || ''}
                  onChange={(e) =>
                    handleFieldChange('serviceFinalStatus', e.target.value)
                  }
                >
                  <MenuItem value='OPERATIVO'>Operativo</MenuItem>
                  <MenuItem value='OPERATIVO_CON_RESTRICCION'>
                    Operativo con restricción
                  </MenuItem>
                  <MenuItem value='FUERA_DE_SERVICIO'>
                    Fuera de servicio
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label='Estado de entrega'
                  value={formData.deliveryStatus || ''}
                  onChange={(e) =>
                    handleFieldChange('deliveryStatus', e.target.value)
                  }
                >
                  <MenuItem value='OPERATIVO'>Operativo</MenuItem>
                  <MenuItem value='OPERATIVO_CON_RESTRICCION'>
                    Operativo con restricción
                  </MenuItem>
                  <MenuItem value='FUERA_DE_SERVICIO'>
                    Fuera de servicio
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label='Clase de riesgo'
                  value={formData.riskClass || ''}
                  onChange={(e) =>
                    handleFieldChange('riskClass', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type='number'
                  label='Garantía (días)'
                  value={formData.warrantyDays ?? 90}
                  onChange={(e) =>
                    handleFieldChange(
                      'warrantyDays',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('diagnosis') }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2 }}>
              Diagnóstico
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Diagnóstico técnico final'
                value={formData.finalDiagnosis || ''}
                error={Boolean(errors.finalDiagnosis)}
                helperText={errors.finalDiagnosis}
                onChange={(e) =>
                  handleFieldChange('finalDiagnosis', e.target.value)
                }
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Causa raíz'
                value={formData.rootCause || ''}
                error={Boolean(errors.rootCause)}
                helperText={errors.rootCause}
                onChange={(e) => handleFieldChange('rootCause', e.target.value)}
              />
            </Stack>
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('diagnosis') }}>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              mb={2}
            >
              <Box display='flex' alignItems='center' gap={1}>
                <Engineering fontSize='small' sx={{ color: intent.action }} />
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Intervención Realizada
                </Typography>
              </Box>
              <Button size='small' startIcon={<Add />} onClick={addActivity}>
                Actividad
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {formData.activities.map((activity, index) => (
                <Box key={`activity-${index}`} display='flex' gap={1}>
                  <TextField
                    fullWidth
                    label={`Actividad ${index + 1}`}
                    value={activity}
                    onChange={(e) =>
                      handleActivityChange(index, e.target.value)
                    }
                  />
                  <Tooltip title='Quitar actividad'>
                    <IconButton
                      onClick={() => removeActivity(index)}
                      aria-label={`Quitar actividad ${index + 1}`}
                      sx={{ alignSelf: 'center' }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
            {errors.activities && (
              <Alert severity='warning' sx={{ mt: 1.5 }}>
                {errors.activities}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              mb={2}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                Repuestos / Materiales
              </Typography>
              <Button size='small' startIcon={<Add />} onClick={addPart}>
                Repuesto
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {formData.parts.map((part, index) => (
                <Grid container spacing={1} key={`part-${index}`}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Descripción'
                      value={part.description}
                      onChange={(e) =>
                        handlePartChange(index, 'description', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Cantidad'
                      value={part.quantity}
                      onChange={(e) =>
                        handlePartChange(
                          index,
                          'quantity',
                          Number(e.target.value) || 1
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={8} md={3}>
                    <TextField
                      fullWidth
                      label='Código / Referencia'
                      value={part.code || ''}
                      onChange={(e) =>
                        handlePartChange(index, 'code', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label='Notas'
                      value={part.notes || ''}
                      onChange={(e) =>
                        handlePartChange(index, 'notes', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Tooltip title='Quitar repuesto'>
                      <IconButton
                        onClick={() => removePart(index)}
                        aria-label={`Quitar repuesto ${index + 1}`}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('verification') }}>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              mb={2}
            >
              <Box display='flex' alignItems='center' gap={1}>
                <Science fontSize='small' sx={{ color: brand.ink }} />
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Validación Técnica y Metrología
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Tipo de protocolo'
                  value={formData.verificationProtocolType || ''}
                  error={Boolean(errors.verificationProtocolType)}
                  helperText={
                    errors.verificationProtocolType ||
                    matchedProtocol?.description ||
                    'Selecciona un protocolo del catálogo.'
                  }
                  onChange={(e) => {
                    const selectedProtocol = activeProtocols.find(
                      (protocol) => protocol.code === e.target.value
                    )

                    if (selectedProtocol) {
                      requestApplyProtocol(selectedProtocol)
                      return
                    }

                    handleFieldChange(
                      'verificationProtocolType',
                      e.target.value
                    )
                  }}
                >
                  {activeProtocols.map((protocol) => (
                    <MenuItem key={protocol.id} value={protocol.code}>
                      {protocol.name}
                    </MenuItem>
                  ))}
                  {formData.verificationProtocolType &&
                    !activeProtocols.some(
                      (protocol) =>
                        protocol.code === formData.verificationProtocolType
                    ) && (
                      <MenuItem value={formData.verificationProtocolType}>
                        {formData.verificationProtocolType}
                      </MenuItem>
                    )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type='date'
                  label='Próximo mantenimiento'
                  InputLabelProps={{ shrink: true }}
                  value={formData.nextMaintenanceDate || ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'nextMaintenanceDate',
                      e.target.value || null
                    )
                  }
                />
              </Grid>
            </Grid>

            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              mb={1}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                Herramientas usadas
              </Typography>
              <Button size='small' startIcon={<Add />} onClick={addTool}>
                Herramienta
              </Button>
            </Box>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {formData.verificationTools.map((tool, index) => (
                <Grid container spacing={1} key={`tool-${index}`}>
                  <Grid item xs={12} md={5}>
                    <Autocomplete<
                      MaintenanceToolEquipmentSummary,
                      false,
                      false,
                      true
                    >
                      freeSolo
                      options={toolEquipmentOptions}
                      loading={toolSearchLoading}
                      value={null}
                      inputValue={tool.name || ''}
                      onInputChange={(_, value) => {
                        setToolSearch(value)
                        handleToolChange(index, 'name', value)
                      }}
                      onChange={(_, value) => {
                        if (!value || typeof value === 'string') return

                        handleToolChange(index, 'name', value.equipmentName)
                        handleToolChange(
                          index,
                          'serial',
                          value.serialNumber || ''
                        )
                        handleToolChange(
                          index,
                          'internalCode',
                          value.internalCode || ''
                        )
                        handleToolChange(
                          index,
                          'location',
                          value.location || ''
                        )
                        handleToolChange(
                          index,
                          'calibrationDue',
                          value.nextCalibrationDate
                            ? String(value.nextCalibrationDate).slice(0, 10)
                            : null
                        )
                      }}
                      getOptionLabel={(option) =>
                        typeof option === 'string'
                          ? option
                          : `${option.internalCode} - ${option.equipmentName}`
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label='Nombre'
                          helperText='Busca un equipo del inventario o escribe manualmente.'
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component='li' {...props}>
                          <Box>
                            <Typography variant='body2' fontWeight={700}>
                              {option.internalCode} - {option.equipmentName}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {option.brand} {option.model} | Serie:{' '}
                              {option.serialNumber}
                              {option.nextCalibrationDate
                                ? ` | Vence: ${new Date(option.nextCalibrationDate).toLocaleDateString('es-CO')}`
                                : ''}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label='Serie'
                      value={tool.serial || ''}
                      onChange={(e) =>
                        handleToolChange(index, 'serial', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type='date'
                      label='Vence calibración'
                      InputLabelProps={{ shrink: true }}
                      value={tool.calibrationDue || ''}
                      onChange={(e) =>
                        handleToolChange(
                          index,
                          'calibrationDue',
                          e.target.value || null
                        )
                      }
                    />
                  </Grid>
                  {(tool.internalCode || tool.location) && (
                    <Grid item xs={12} md={11}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        {tool.internalCode && (
                          <Chip
                            size='small'
                            color='primary'
                            variant='outlined'
                            label={`Código interno: ${tool.internalCode}`}
                          />
                        )}
                        {tool.location && (
                          <Typography variant='caption' color='text.secondary'>
                            Ubicación: {tool.location}
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  )}
                  <Grid item xs={12} md={1}>
                    <Tooltip title='Quitar herramienta'>
                      <IconButton
                        onClick={() => removeTool(index)}
                        aria-label={`Quitar herramienta ${index + 1}`}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))}
            </Stack>
            {errors.verificationTools && (
              <Alert severity='warning' sx={{ mt: 1, mb: 2 }}>
                {errors.verificationTools}
              </Alert>
            )}

            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              mb={1}
            >
              <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                Pruebas ejecutadas
              </Typography>
              <Button size='small' startIcon={<Add />} onClick={addTest}>
                Prueba
              </Button>
            </Box>
            <Stack spacing={1.5}>
              {formData.verificationTests.map((test, index) => (
                <Grid container spacing={1} key={`test-${index}`}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Parámetro'
                      value={test.parameter}
                      onChange={(e) =>
                        handleTestChange(index, 'parameter', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <TextField
                      select
                      fullWidth
                      label='Resultado'
                      value={test.result}
                      onChange={(e) =>
                        handleTestChange(index, 'result', e.target.value)
                      }
                    >
                      <MenuItem value='PASA'>PASA</MenuItem>
                      <MenuItem value='NO PASA'>NO PASA</MenuItem>
                      <MenuItem value='OBSERVADO'>OBSERVADO</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={8} md={2}>
                    <TextField
                      fullWidth
                      label='Valor'
                      value={test.value || ''}
                      onChange={(e) =>
                        handleTestChange(index, 'value', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label='Observaciones'
                      value={test.notes || ''}
                      onChange={(e) =>
                        handleTestChange(index, 'notes', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Tooltip title='Quitar prueba'>
                      <IconButton
                        onClick={() => removeTest(index)}
                        aria-label={`Quitar prueba ${index + 1}`}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))}
            </Stack>
            {errors.verificationTests && (
              <Alert severity='warning' sx={{ mt: 1 }}>
                {errors.verificationTests}
              </Alert>
            )}
          </Paper>

          <Paper sx={{ ...sectionCardSx, ...tabSx('closing') }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 2 }}>
              Conclusiones y Cláusulas
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Recomendaciones técnicas'
                value={formData.recommendations || ''}
                onChange={(e) =>
                  handleFieldChange('recommendations', e.target.value)
                }
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Términos de garantía'
                value={formData.warrantyTerms || ''}
                onChange={(e) =>
                  handleFieldChange('warrantyTerms', e.target.value)
                }
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Alcance de la intervención'
                value={formData.scopeClause || ''}
                onChange={(e) =>
                  handleFieldChange('scopeClause', e.target.value)
                }
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Responsabilidad y uso del equipo'
                value={formData.responsibilityClause || ''}
                onChange={(e) =>
                  handleFieldChange('responsibilityClause', e.target.value)
                }
              />
            </Stack>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleRequestClose} color='inherit'>
          Cerrar
        </Button>
        <Button
          variant='outlined'
          startIcon={<PictureAsPdf />}
          onClick={onGeneratePdf}
          disabled={generatingPdf}
        >
          {generatingPdf ? 'Generando...' : 'Ver PDF técnico'}
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar reporte'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MaintenanceTechnicalReportDialog
