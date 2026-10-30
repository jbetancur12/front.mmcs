import React, { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import {
  BuildOutlined,
  FactCheckOutlined,
  ReportProblemOutlined,
  SpeedOutlined,
  TaskAltOutlined
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import {
  useCheckNonConformCode,
  useSaveNonConformWorkReport
} from '@hooks/nonConform/useNonConformWorkReports'
import FormPage from 'src/Components/Common/FormPage'
import FormTabs from 'src/Components/Common/FormTabs'
import FormSection, {
  FormGridItem,
  FormSubsection
} from 'src/Components/Common/FormSection'
import FormikField, {
  FormCheckboxField
} from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import FormErrorSummary from 'src/Components/Common/FormErrorSummary'
import ScoreSelect, { ScoreSummary } from 'src/Components/Common/ScoreSelect'
import RiskBadge from 'src/Components/Common/RiskBadge'
import { notify } from 'src/utils/notify'

import { logger } from 'src/utils/logger'
type TabKey = 'hallazgo' | 'evaluacion' | 'riesgo' | 'acciones' | 'cierre'

/** Pestañas del formulario y los campos validados que contiene cada una. */
const TABS: Array<{
  key: TabKey
  label: string
  icon: React.ReactElement
  fields: string[]
}> = [
  {
    key: 'hallazgo',
    label: 'Hallazgo',
    icon: <ReportProblemOutlined />,
    fields: [
      'tncCode',
      'tncAcceptance',
      'registerDate',
      'detectedBy',
      'affectedArea',
      'iso17025Clause',
      'status',
      'reviewFrequency',
      'customReviewDays',
      'findingDescription',
      'serviceNumbers',
      'affectedClients',
      'involvedProcedure',
      'resultsDelivered',
      'causeAnalysis'
    ]
  },
  {
    key: 'evaluacion',
    label: 'Evaluación',
    icon: <FactCheckOutlined />,
    fields: [
      'affectedPeriod',
      'certificateReview',
      'procedureReview',
      'recordReview',
      'metrologyInventoryCheck',
      'personnelCompetenceEvaluation',
      'resultValidity4_3',
      'affectedServicesCount4_3',
      'resultsDelivered4_3',
      'regulatoryOrContractualImpact4_3',
      'reputationRisk4_3'
    ]
  },
  {
    key: 'riesgo',
    label: 'Riesgo',
    icon: <SpeedOutlined />,
    fields: [
      'resultValidity',
      'affectedServicesCount',
      'clientResultsDelivery',
      'contractualImpact',
      'reputationRisk',
      'previousNonConformWorks',
      'nonConformityOccurrences'
    ]
  },
  {
    key: 'acciones',
    label: 'Acciones',
    icon: <BuildOutlined />,
    fields: []
  },
  {
    key: 'cierre',
    label: 'Cierre',
    icon: <TaskAltOutlined />,
    fields: []
  }
]

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
  const saveReport = useSaveNonConformWorkReport()
  const checkCodeExists = useCheckNonConformCode()

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
      .required('Requerido')
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
            return !(await checkCodeExists(value)) // true si NO existe
          } catch (error) {
            logger.error('Error checking TNC code:', error)
            return true // En caso de error, permitir continuar
          }
        }
      ),
    tncAcceptance: Yup.string().required('Requerido'),
    registerDate: Yup.string().required('Requerido'),
    detectedBy: Yup.string().required('Requerido'),
    affectedArea: Yup.string().required('Requerido'),
    findingDescription: Yup.string().required('Requerido'),
    status: Yup.string().required('Requerido'),
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
    causeAnalysis: Yup.string().required('Requerido'),
    affectedPeriod: Yup.string().required('Requerido'),
    certificateReview: Yup.string().required('Requerido'),
    procedureReview: Yup.string().required('Requerido'),
    recordReview: Yup.string().required('Requerido'),
    metrologyInventoryCheck: Yup.string().required('Requerido'),
    personnelCompetenceEvaluation: Yup.string().required('Requerido'),
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
      .required('Requerido'),
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
        const isEdit = Boolean(initialData && initialData.id)
        await saveReport.mutateAsync({ id: initialData.id, payload })
        await notify.success(
          isEdit ? '¡Edición exitosa!' : '¡Creación exitosa!',
          isEdit
            ? 'El reporte fue actualizado correctamente.'
            : 'El reporte fue creado correctamente.'
        )
        if (onSuccess) onSuccess()
        resetForm()
      } catch (error) {
        await notify.error(
          'No se pudo guardar',
          'Ocurrió un error al guardar el reporte. Inténtalo de nuevo.'
        )
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

  const [tab, setTab] = useState<TabKey>('hallazgo')

  const dateError = (name: keyof NonConformWorkReport) =>
    formik.touched[name] && formik.errors[name]
      ? String(formik.errors[name])
      : false

  const dateField = (name: keyof NonConformWorkReport, label: string) => (
    <FormDateField
      label={label}
      name={name}
      value={String(formik.values[name] ?? '')}
      onChange={(value) => formik.setFieldValue(name, value)}
      error={dateError(name)}
    />
  )

  const errorCount = (fields: string[]) =>
    fields.filter(
      (f) =>
        (formik.errors as Record<string, unknown>)[f] &&
        (formik.touched as Record<string, unknown>)[f]
    ).length

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const errors = (await formik.validateForm()) as Record<string, unknown>
    const firstWithErrors = TABS.find((t) => t.fields.some((f) => errors[f]))
    if (firstWithErrors) setTab(firstWithErrors.key)
    await formik.submitForm()
  }

  return (
    <FormPage
      title={initialData.id ? 'Editar reporte' : 'Nuevo reporte'}
      subtitle='Reporte de trabajo no conforme'
      icon={<ReportProblemOutlined />}
      tabs={
        <FormTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={TABS.map(({ key, label, icon, fields }) => ({
            key,
            label,
            icon,
            errorCount: errorCount(fields)
          }))}
        />
      }
      onSubmit={handleSubmit}
      onCancel={onCancel ?? (() => undefined)}
      submitLabel={initialData.id ? 'Guardar cambios' : 'Guardar reporte'}
      loading={formik.isSubmitting}
      notices={
        formik.submitCount > 0 ? (
          <FormErrorSummary count={Object.keys(formik.errors).length} />
        ) : null
      }
    >
      {tab === 'hallazgo' && (
        <>
          <FormSection
            title='1. Datos generales'
            description='Identificación del hallazgo y su estado.'
          >
            <FormikField formik={formik} name='tncCode' label='Código TNC' />
            <FormikField
              formik={formik}
              name='tncAcceptance'
              label='Aceptación TNC'
              options={tncAcceptanceOptions}
            />
            {dateField('registerDate', 'Fecha de registro')}
            <FormikField
              formik={formik}
              name='detectedBy'
              label='Detectado por'
            />
            <FormikField
              formik={formik}
              name='affectedArea'
              label='Área/proceso afectado'
            />
            <FormikField
              formik={formik}
              name='iso17025Clause'
              label='Numeral de ISO/IEC 17025 relacionado'
            />
            <FormikField
              formik={formik}
              name='status'
              label='Estatus'
              options={statusOptions}
            />
            <FormikField
              formik={formik}
              name='reviewFrequency'
              label='Periodicidad de revisión'
              options={reviewFrequencyOptions}
              disabled={formik.values.status !== 'Abierta'}
            />
            {formik.values.reviewFrequency === 'custom' && (
              <FormikField
                formik={formik}
                name='customReviewDays'
                type='number'
                label='Días para revisión personalizada'
                inputProps={{ min: 1 }}
              />
            )}
            <FormGridItem>
              <FormikField
                formik={formik}
                name='findingDescription'
                label='Descripción del hallazgo'
                multiline
              />
            </FormGridItem>
          </FormSection>

          <FormSection
            title='2. Servicio afectado'
            description='Qué servicios y clientes alcanzó el trabajo no conforme.'
          >
            <FormikField
              formik={formik}
              name='serviceNumbers'
              label='Números de servicio/certificados'
              multiline
            />
            <FormikField
              formik={formik}
              name='affectedClients'
              label='Clientes afectados'
              multiline
            />
            <FormikField
              formik={formik}
              name='involvedProcedure'
              label='Magnitud/procedimiento involucrado'
              multiline
            />
            <FormikField
              formik={formik}
              name='resultsDelivered'
              label='Resultados entregados'
              multiline
            />
          </FormSection>

          <FormSection title='3. Análisis de causa'>
            <FormGridItem>
              <FormikField
                formik={formik}
                name='causeAnalysis'
                label='Análisis de causa'
                multiline
              />
            </FormGridItem>
          </FormSection>
        </>
      )}
      {tab === 'evaluacion' && (
        <>
          <FormSection
            title='4. Evaluación de la importancia y análisis de resultados previos'
            description='Alcance, verificación de registros e importancia del trabajo no conforme.'
          >
            <FormSubsection title='4.1 Alcance'>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='affectedPeriod'
                  label='Identificación del período afectado por el trabajo no conforme'
                  multiline
                />
              </FormGridItem>
            </FormSubsection>

            <FormSubsection title='4.2 Verificación de registros'>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='certificateReview'
                  label='Revisión de certificados emitidos durante el período afectado'
                  multiline
                />
              </FormGridItem>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='procedureReview'
                  label='Revisión de procedimientos, políticas o formatos'
                  multiline
                />
              </FormGridItem>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='recordReview'
                  label='Revisión de registros del sistema de gestión (ambientales, hojas de trabajo, etc.)'
                  multiline
                />
              </FormGridItem>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='metrologyInventoryCheck'
                  label='Verificación del inventario metrológico afectado'
                  multiline
                />
              </FormGridItem>
              <FormGridItem>
                <FormikField
                  formik={formik}
                  name='personnelCompetenceEvaluation'
                  label='Evaluación de la competencia del personal involucrado'
                  multiline
                />
              </FormGridItem>
            </FormSubsection>

            <FormSubsection title='4.3 Importancia del trabajo no conforme'>
              <ScoreSelect
                label='Afectación a la validez del resultado'
                name='resultValidity4_3'
                value={formik.values.resultValidity4_3}
                options={[1, 5]}
                helperText='Hay o no afectación en la validez de los resultados'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Número de servicios afectados'
                name='affectedServicesCount4_3'
                value={formik.values.affectedServicesCount4_3}
                options={[1, 3, 5]}
                helperText='5 o menos (1), 10 o menos (3), más de 10 (5)'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='¿Resultados ya entregados?'
                name='resultsDelivered4_3'
                value={formik.values.resultsDelivered4_3}
                options={[1, 5]}
                helperText='Se entregaron los resultados'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Impacto normativo o contractual'
                name='regulatoryOrContractualImpact4_3'
                value={formik.values.regulatoryOrContractualImpact4_3}
                options={[1, 5]}
                helperText='Hay impacto normativo o contractual'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Riesgo a la reputación'
                name='reputationRisk4_3'
                value={formik.values.reputationRisk4_3}
                options={[1, 5]}
                helperText='Hay riesgo en la reputación'
                onChange={formik.handleChange}
              />
              <ScoreSummary
                items={[
                  { label: 'Total', value: tncImportanceScore },
                  {
                    label: 'Importancia del trabajo no conforme',
                    value: tncImportanceWeight
                  }
                ]}
              />
            </FormSubsection>
          </FormSection>
        </>
      )}
      {tab === 'riesgo' && (
        <>
          <FormSection
            title='5. Nivel de riesgo del trabajo no conforme'
            description='El nivel de riesgo se calcula automáticamente con el impacto y la probabilidad.'
          >
            <FormSubsection
              title='5.1 Impacto'
              description='Califique cada criterio según la descripción y la valoración sugerida.'
            >
              <ScoreSelect
                label='Validez del resultado'
                name='resultValidity'
                value={formik.values.resultValidity}
                options={impactOptions}
                helperText='¿Se afecta la trazabilidad o confiabilidad de los resultados de servicios? (1: No, 5: Sí)'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Cantidad de servicios/calibraciones afectadas'
                name='affectedServicesCount'
                value={formik.values.affectedServicesCount}
                options={impactOptions}
                helperText='¿Cuántos servicios están involucrados? (1: <5 servicios, 5: >=5 servicios)'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Entrega de resultados al cliente'
                name='clientResultsDelivery'
                value={formik.values.clientResultsDelivery}
                options={impactOptions}
                helperText='¿Los resultados ya fueron entregados? (1: no entregados, 5: entregados y con impacto en decisión del cliente)'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Impacto contractual / regulatorio'
                name='contractualImpact'
                value={formik.values.contractualImpact}
                options={impactOptions}
                helperText='¿Hay incumplimiento de requisitos normativos o legales? (1: interno, 5: legal/ISO/regulador)'
                onChange={formik.handleChange}
              />
              <ScoreSelect
                label='Riesgo a la reputación'
                name='reputationRisk'
                value={formik.values.reputationRisk}
                options={impactOptions}
                helperText='¿Afecta la imagen del laboratorio? (1: interno, 5: cliente clave o mercado externo)'
                onChange={formik.handleChange}
              />
              <ScoreSummary
                items={[
                  { label: 'Total de puntos', value: impactScore },
                  { label: 'Ponderación de impacto', value: impactWeight }
                ]}
              />
            </FormSubsection>

            <FormSubsection
              title='5.2 Probabilidad'
              description='Indique si se han presentado trabajos no conformes similares y cuántas veces se ha materializado el incumplimiento en los últimos dos años.'
            >
              <FormikField
                formik={formik}
                name='previousNonConformWorks'
                label='¿Se han presentado anteriormente trabajos no conformes similares?'
                options={['Sí', 'No']}
                helperText='Seleccione Sí o No'
              />
              <FormikField
                formik={formik}
                name='nonConformityOccurrences'
                type='number'
                label='¿Cuántas veces se ha materializado el incumplimiento al requisito en los dos últimos años?'
                helperText='Alta: >3 veces, Media: 1-3 veces, Baja: <1 vez'
              />
              <ScoreSummary
                items={[
                  { label: 'Probabilidad calculada', value: probability }
                ]}
              />
            </FormSubsection>

            <FormSubsection
              title='5.3 Matriz de riesgos'
              description='Resultado de cruzar impacto y probabilidad.'
            >
              <FormGridItem>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <RiskBadge label='Impacto' value={impactWeight} />
                  <RiskBadge label='Probabilidad' value={probability} />
                  <RiskBadge label='Nivel de riesgo' value={riskLevel} />
                </Box>
              </FormGridItem>
            </FormSubsection>
          </FormSection>
        </>
      )}
      {tab === 'acciones' && (
        <>
          <FormSection
            title='6. Acciones tomadas'
            description='Acciones inmediatas y correctivas aplicadas, responsables y fechas de ejecución.'
          >
            <FormikField
              formik={formik}
              name='immediateCorrection'
              label='Corrección inmediata'
              multiline
            />
            <FormikField
              formik={formik}
              name='correctionBy'
              label='Responsable de la corrección'
            />
            {dateField('correctionDate', 'Fecha de corrección')}
            <FormCheckboxField
              formik={formik}
              name='correctiveActionRequired'
              label='¿Requiere acción correctiva?'
            />
            <FormikField
              formik={formik}
              name='correctiveAction'
              label='Acción correctiva'
              multiline
            />
            <FormikField
              formik={formik}
              name='correctiveActionBy'
              label='Responsable de la acción correctiva'
            />
            {dateField('correctiveActionDate', 'Fecha de acción correctiva')}
          </FormSection>

          <FormSection title='7. Comunicación'>
            <FormCheckboxField
              formik={formik}
              name='clientNotified'
              label='¿Se notificó al cliente?'
            />
            <FormikField
              formik={formik}
              name='notificationMethod'
              label='Método de notificación'
            />
            {dateField('notificationDate', 'Fecha de notificación')}
            <FormikField
              formik={formik}
              name='communicationSummary'
              label='Resumen de comunicación'
              multiline
            />
          </FormSection>

          <FormSection title='8. Reanudación del trabajo'>
            <FormCheckboxField
              formik={formik}
              name='workSuspended'
              label='Fue necesario suspender el trabajo'
            />
            {dateField(
              'resumptionAuthorizationDate',
              'Fecha de autorización de reanudación'
            )}
            <FormikField
              formik={formik}
              name='authorizedBy'
              label='Autorizado por'
            />
          </FormSection>
        </>
      )}
      {tab === 'cierre' && (
        <>
          <FormSection title='9. Cierre'>
            {dateField('closingDate', 'Fecha de cierre')}
            <FormikField
              formik={formik}
              name='closingResponsible'
              label='Responsable de cierre'
            />
            <FormikField
              formik={formik}
              name='closingComments'
              label='Comentarios adicionales'
              multiline
            />
            <FormCheckboxField
              formik={formik}
              name='closingDeadlineExtended'
              label='¿Se amplió el plazo de cierre?'
            />
            <FormikField
              formik={formik}
              name='closingJustification'
              label='Justificación (si aplica)'
            />
          </FormSection>

          <FormSection title='10. Seguimiento'>
            <FormCheckboxField
              formik={formik}
              name='recurrence'
              label='¿Hubo reincidencia?'
            />
            <FormikField
              formik={formik}
              name='correctiveActionsEffectiveness'
              label='Evaluación de eficacia de acciones correctivas'
            />
          </FormSection>
        </>
      )}
    </FormPage>
  )
}

export default NonConformWorkReportForm
