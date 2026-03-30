import React, { useMemo, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Preview as PreviewIcon
} from '@mui/icons-material'
import SignaturePad from '../../../Components/Maintenance/SignaturePad'
import {
  useCertificateTemplates,
  useCreateCertificateTemplate,
  useDeleteCertificateTemplate,
  usePreviewCertificateTemplate,
  useUpdateCertificateTemplate
} from '../../../hooks/useLms'
import type {
  CertificateTemplate,
  CertificateTemplateVariable,
  SaveCertificateTemplateRequest
} from '../../../services/lmsService'
import { sanitizeHtml } from '../../../utils/htmlSanitizer'
import certificateTemplateBackground from 'src/assets/template.png'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface TemplateFormState {
  name: string
  templateHtml: string
  isDefault: boolean
  variables: CertificateTemplateVariable[]
}

const DEFAULT_VARIABLES: CertificateTemplateVariable[] = [
  {
    name: 'userName',
    label: 'Nombre del usuario',
    type: 'text',
    required: true,
    description: 'Nombre completo del estudiante'
  },
  {
    name: 'courseTitle',
    label: 'Nombre del curso',
    type: 'text',
    required: true,
    description: 'Titulo del curso completado'
  },
  {
    name: 'completionDate',
    label: 'Fecha de finalizacion',
    type: 'date',
    required: true,
    description: 'Fecha en que se completo el curso'
  },
  {
    name: 'courseDuration',
    label: 'Duracion del curso',
    type: 'text',
    required: false,
    description: 'Texto libre para la duracion visible en el certificado'
  },
  {
    name: 'certificateBackgroundImage',
    label: 'Fondo oficial del certificado',
    type: 'text',
    required: false,
    defaultValue: '/images/template.png',
    description: 'Imagen base que se usara como arte principal del certificado'
  },
  {
    name: 'leftSignatureImage',
    label: 'Firma izquierda',
    type: 'text',
    required: false,
    description: 'Imagen base64 de la firma izquierda'
  },
  {
    name: 'leftSignatureDisplay',
    label: 'Visualizacion de firma izquierda',
    type: 'text',
    required: false,
    defaultValue: 'none',
    description: 'Control interno para mostrar u ocultar la firma izquierda'
  },
  {
    name: 'leftSignerName',
    label: 'Nombre izquierda',
    type: 'text',
    required: false,
    defaultValue: 'Daniel Paredes',
    description: 'Nombre que se mostrara bajo la firma izquierda'
  },
  {
    name: 'leftSignerRole',
    label: 'Cargo izquierda',
    type: 'text',
    required: false,
    defaultValue: 'Instructor',
    description: 'Cargo que se mostrara bajo la firma izquierda'
  },
  {
    name: 'rightSignatureImage',
    label: 'Firma derecha',
    type: 'text',
    required: false,
    description: 'Imagen base64 de la firma derecha'
  },
  {
    name: 'rightSignatureDisplay',
    label: 'Visualizacion de firma derecha',
    type: 'text',
    required: false,
    defaultValue: 'none',
    description: 'Control interno para mostrar u ocultar la firma derecha'
  },
  {
    name: 'rightSignerName',
    label: 'Nombre derecha',
    type: 'text',
    required: false,
    defaultValue: 'Andres Felipe Espitia',
    description: 'Nombre que se mostrara bajo la firma derecha'
  },
  {
    name: 'rightSignerRole',
    label: 'Cargo derecha',
    type: 'text',
    required: false,
    defaultValue: 'Director Tecnico',
    description: 'Cargo que se mostrara bajo la firma derecha'
  },
  {
    name: 'certificateNumber',
    label: 'Numero de certificado',
    type: 'text',
    required: true,
    description: 'Identificador unico del certificado'
  }
]

const DEFAULT_TEMPLATE_HTML = `
<div class="certificate-layout certificate-template-official" style="background-image: url('{{certificateBackgroundImage}}');">
  <div class="certificate-official-field certificate-official-recipient">
    <span class="certificate-official-field-text certificate-official-recipient-text">{{userName}}</span>
  </div>

  <div class="certificate-official-copy">
    <p>Se certifica que:</p>
    <p>Ha participado y aprobado satisfactoriamente la capacitacion en:</p>
  </div>

  <div class="certificate-official-field certificate-official-course">
    <span class="certificate-official-field-text certificate-official-course-text">{{courseTitle}}</span>
  </div>

  <div class="certificate-official-summary">
    con una intensidad de <strong>{{courseDuration}}</strong>, realizada el dia <strong>{{completionDate}}</strong>
  </div>

  <div class="certificate-official-verification">
    <div class="certificate-official-verification-label">Codigo de verificacion</div>
    <div class="certificate-official-verification-value">{{certificateNumber}}</div>
  </div>

  <div class="certificate-official-signature certificate-official-signature--left">
    <div class="certificate-official-signature-image-shell" style="display: {{leftSignatureDisplay}};">
      <img class="certificate-official-signature-image" src="{{leftSignatureImage}}" alt="Firma izquierda" />
    </div>
    <div class="certificate-official-signature-mask">
      <div class="certificate-official-signature-line"></div>
      <div class="certificate-official-signature-name">{{leftSignerName}}</div>
      <div class="certificate-official-signature-role">{{leftSignerRole}}</div>
    </div>
  </div>

  <div class="certificate-official-signature certificate-official-signature--right">
    <div class="certificate-official-signature-image-shell" style="display: {{rightSignatureDisplay}};">
      <img class="certificate-official-signature-image" src="{{rightSignatureImage}}" alt="Firma derecha" />
    </div>
    <div class="certificate-official-signature-mask">
      <div class="certificate-official-signature-line"></div>
      <div class="certificate-official-signature-name">{{rightSignerName}}</div>
      <div class="certificate-official-signature-role">{{rightSignerRole}}</div>
    </div>
  </div>
</div>
`.trim()

const CERTIFICATE_HTML_SNIPPETS = [
  { label: 'Nombre del usuario', token: '{{userName}}' },
  { label: 'Curso', token: '{{courseTitle}}' },
  { label: 'Fecha', token: '{{completionDate}}' },
  { label: 'Duracion', token: '{{courseDuration}}' },
  { label: 'Fondo', token: '{{certificateBackgroundImage}}' },
  { label: 'Firma izquierda', token: '{{leftSignatureImage}}' },
  { label: 'Firma derecha', token: '{{rightSignatureImage}}' },
  { label: 'Certificado', token: '{{certificateNumber}}' }
]

const VARIABLE_NAME_SUGGESTIONS = [
  'userName',
  'courseTitle',
  'completionDate',
  'courseDuration',
  'courseDurationDisplay',
  'certificateMetaGridColumns',
  'certificateNumber',
  'organizationName',
  'organizationLogo',
  'certificateBackgroundImage',
  'leftSignatureImage',
  'leftSignatureDisplay',
  'leftSignerName',
  'leftSignerRole',
  'rightSignatureImage',
  'rightSignatureDisplay',
  'rightSignerName',
  'rightSignerRole',
  'organizationSignature',
  'organizationSignatureDisplay'
]

const emptyFormState = (): TemplateFormState => ({
  name: '',
  templateHtml: DEFAULT_TEMPLATE_HTML,
  isDefault: false,
  variables: DEFAULT_VARIABLES
})

const ensureVariable = (
  variables: CertificateTemplateVariable[],
  variableName: string,
  fallback: CertificateTemplateVariable
) => {
  const existingIndex = variables.findIndex((variable) => variable.name === variableName)
  if (existingIndex >= 0) {
    const nextVariables = [...variables]
    nextVariables[existingIndex] = {
      ...fallback,
      ...nextVariables[existingIndex]
    }
    return nextVariables
  }

  return [...variables, fallback]
}

const setManagedVariable = (
  variables: CertificateTemplateVariable[],
  variableName: string,
  fallback: CertificateTemplateVariable,
  nextValue: string
) =>
  ensureVariable(variables, variableName, fallback).map((variable) =>
    variable.name === variableName
      ? {
          ...variable,
          defaultValue: nextValue
        }
      : variable
  )

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`certificate-template-tabpanel-${index}`}
      aria-labelledby={`certificate-template-tab-${index}`}
      {...other}
    >
      {value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null}
    </div>
  )
}

const normalizeTemplate = (template: CertificateTemplate): TemplateFormState => {
  const normalizedVariables =
    template.variables?.length > 0
      ? template.variables.map((variable) => ({
          ...variable,
          defaultValue: variable.defaultValue ?? variable.default_value ?? ''
        }))
      : DEFAULT_VARIABLES

  const legacySignature = normalizedVariables.find((variable) => variable.name === 'organizationSignature')
  const withBackground = ensureVariable(normalizedVariables, 'certificateBackgroundImage', {
    name: 'certificateBackgroundImage',
    label: 'Fondo oficial del certificado',
    type: 'text',
    required: false,
    defaultValue: '/images/template.png',
    description: 'Imagen base que se usara como arte principal del certificado'
  })
  const withLeftSignature = ensureVariable(withBackground, 'leftSignatureImage', {
    name: 'leftSignatureImage',
    label: 'Firma izquierda',
    type: 'text',
    required: false,
    defaultValue: legacySignature?.defaultValue || '',
    description: 'Imagen base64 de la firma izquierda'
  })
  const withLeftDisplay = ensureVariable(withLeftSignature, 'leftSignatureDisplay', {
    name: 'leftSignatureDisplay',
    label: 'Visualizacion de firma izquierda',
    type: 'text',
    required: false,
    defaultValue: legacySignature?.defaultValue ? 'flex' : 'none',
    description: 'Control interno para mostrar u ocultar la firma izquierda'
  })
  const withSignerMeta = ([
    {
      name: 'leftSignerName',
      label: 'Nombre izquierda',
      type: 'text',
      required: false,
      defaultValue: 'Daniel Paredes',
      description: 'Nombre que se mostrara bajo la firma izquierda'
    },
    {
      name: 'leftSignerRole',
      label: 'Cargo izquierda',
      type: 'text',
      required: false,
      defaultValue: 'Instructor',
      description: 'Cargo que se mostrara bajo la firma izquierda'
    },
    {
      name: 'rightSignatureImage',
      label: 'Firma derecha',
      type: 'text',
      required: false,
      defaultValue: '',
      description: 'Imagen base64 de la firma derecha'
    },
    {
      name: 'rightSignatureDisplay',
      label: 'Visualizacion de firma derecha',
      type: 'text',
      required: false,
      defaultValue: 'none',
      description: 'Control interno para mostrar u ocultar la firma derecha'
    },
    {
      name: 'rightSignerName',
      label: 'Nombre derecha',
      type: 'text',
      required: false,
      defaultValue: 'Andres Felipe Espitia',
      description: 'Nombre que se mostrara bajo la firma derecha'
    },
    {
      name: 'rightSignerRole',
      label: 'Cargo derecha',
      type: 'text',
      required: false,
      defaultValue: 'Director Tecnico',
      description: 'Cargo que se mostrara bajo la firma derecha'
    }
  ] as CertificateTemplateVariable[]).reduce(
    (acc, variable) => ensureVariable(acc, variable.name, variable),
    withLeftDisplay
  )

  return {
    name: template.name || '',
    templateHtml: template.templateHtml || template.template_html || '',
    isDefault: template.isDefault ?? template.is_default ?? false,
    variables: withSignerMeta
  }
}

const buildSamplePreviewHtml = (templateHtml: string, variables: CertificateTemplateVariable[]) => {
  const sampleValues = variables.reduce<Record<string, string>>((acc, variable) => {
    if (variable.defaultValue || variable.default_value) {
      acc[variable.name] = variable.defaultValue || variable.default_value || ''
      return acc
    }

    if (variable.type === 'date') {
      acc[variable.name] = new Date().toLocaleDateString('es-CO')
      return acc
    }

    if (variable.type === 'number') {
      acc[variable.name] = '40'
      return acc
    }

    if (variable.name === 'userName') {
      acc[variable.name] = 'Laura Betancur'
      return acc
    }

    if (variable.name === 'courseTitle') {
      acc[variable.name] = 'Curso de Seguridad y Calidad'
      return acc
    }

    if (variable.name === 'certificateNumber') {
      acc[variable.name] = 'MMCS-PREVIEW-001'
      return acc
    }

    if (variable.name === 'courseDuration') {
      acc[variable.name] = '40 horas'
      return acc
    }

    if (variable.name === 'courseDurationDisplay') {
      acc[variable.name] = 'flex'
      return acc
    }

    if (variable.name === 'certificateMetaGridColumns') {
      acc[variable.name] = 'repeat(3, minmax(0, 1fr))'
      return acc
    }

    if (variable.name === 'organizationLogo') {
      acc[variable.name] = 'http://localhost:5173/images/logo2.png'
      return acc
    }

    if (variable.name === 'certificateBackgroundImage') {
      acc[variable.name] = certificateTemplateBackground
      return acc
    }

    if (variable.name === 'leftSignatureImage' || variable.name === 'rightSignatureImage' || variable.name === 'organizationSignature') {
      acc[variable.name] =
        variable.defaultValue ||
        variable.default_value ||
        ''
      return acc
    }

    if (variable.name === 'leftSignatureDisplay') {
      const signatureValue = acc.leftSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    if (variable.name === 'rightSignatureDisplay') {
      const signatureValue = acc.rightSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    if (variable.name === 'organizationSignatureDisplay') {
      const signatureValue = acc.organizationSignature || acc.leftSignatureImage
      acc[variable.name] = signatureValue ? 'flex' : 'none'
      return acc
    }

    acc[variable.name] = variable.label || variable.name
    return acc
  }, {})

  const renderedHtml = templateHtml.replace(/\{\{(\w+)\}\}/g, (_, variableName: string) => sampleValues[variableName] || '')
  const shellClass = renderedHtml.includes('certificate-template-official')
    ? 'certificate-preview-shell certificate-preview-shell--artwork'
    : 'certificate-preview-shell'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #eef6f1;
      font-family: Arial, sans-serif;
    }

    .certificate-preview-shell {
      width: 100%;
      min-height: 620px;
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(49, 177, 99, 0.14), transparent 30%),
        radial-gradient(circle at bottom left, rgba(24, 49, 83, 0.10), transparent 32%),
        linear-gradient(180deg, #fbfffc 0%, #eef7f2 100%);
      border: 4px solid #1f3958;
      border-radius: 18px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }

    .certificate-preview-shell--artwork {
      padding: 0;
      border: none;
      border-radius: 0;
      background: #ffffff;
      min-height: 680px;
    }

    .certificate-template-official {
      position: relative;
      width: 100%;
      min-height: 680px;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
      font-family: Arial, sans-serif;
      color: #073b28;
    }

    .certificate-official-field {
      position: absolute;
      left: 23.5%;
      width: 52%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px 24px;
      border: 3px solid rgba(4, 76, 55, 0.95);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 12px rgba(7, 59, 40, 0.15);
      box-sizing: border-box;
    }

    .certificate-official-field-text {
      display: block;
      width: 100%;
    }

    .certificate-official-recipient {
      top: 40.8%;
      min-height: 9.5%;
    }

    .certificate-official-recipient-text {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 38px;
      line-height: 1.08;
      font-style: italic;
      font-weight: 700;
      color: #0a563f;
    }

    .certificate-official-copy {
      position: absolute;
      top: 32.6%;
      left: 23%;
      width: 54%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      text-align: center;
      font-size: 18px;
      color: #102b22;
    }

    .certificate-official-course {
      top: 56.6%;
      min-height: 8.2%;
    }

    .certificate-official-course-text {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 34px;
      line-height: 1.12;
      font-weight: 700;
      text-transform: uppercase;
      color: #0b4f38;
    }

    .certificate-official-summary {
      position: absolute;
      top: 67.8%;
      left: 19%;
      width: 62%;
      text-align: center;
      font-size: 18px;
      line-height: 1.4;
      color: #102b22;
    }

    .certificate-official-summary strong {
      color: #0b4f38;
    }

    .certificate-official-verification {
      position: absolute;
      bottom: 7.5%;
      left: 39%;
      width: 22%;
      padding: 16px 20px 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.9);
      border: 3px solid rgba(6, 72, 52, 0.82);
      text-align: center;
      box-shadow: 0 6px 16px rgba(7, 59, 40, 0.14);
      box-sizing: border-box;
    }

    .certificate-official-verification-label {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #1a513f;
      margin-bottom: 6px;
    }

    .certificate-official-verification-value {
      font-size: 18px;
      font-weight: 700;
      color: #083d2b;
    }

    .certificate-official-signature {
      position: absolute;
      bottom: 6.4%;
      width: 24%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .certificate-official-signature--left {
      left: 4.4%;
    }

    .certificate-official-signature--right {
      right: 4.6%;
    }

    .certificate-official-signature-image-shell {
      min-height: 72px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      width: 100%;
    }

    .certificate-official-signature-image {
      max-width: 210px;
      max-height: 72px;
      object-fit: contain;
      object-position: center bottom;
      background: transparent;
    }

    .certificate-official-signature-mask {
      width: 100%;
      padding: 10px 14px 8px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.9));
      border-radius: 12px;
      text-align: center;
      box-sizing: border-box;
    }

    .certificate-official-signature-line {
      border-top: 1px solid rgba(160, 116, 40, 0.95);
      margin-bottom: 6px;
    }

    .certificate-official-signature-name {
      font-size: 18px;
      line-height: 1.12;
      color: #102b22;
    }

    .certificate-official-signature-role {
      font-size: 14px;
      line-height: 1.15;
      font-weight: 700;
      color: #0d6b49;
    }
  </style>
</head>
<body>
  <div class="${shellClass}">
    ${sanitizeHtml(renderedHtml, 'richText')}
  </div>
</body>
</html>`
}

const LmsCertificateTemplates: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<CertificateTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormState>(emptyFormState)

  const { data: templates = [], isLoading, refetch } = useCertificateTemplates()
  const createTemplateMutation = useCreateCertificateTemplate({
    onSuccess: () => handleCloseEditor()
  })
  const updateTemplateMutation = useUpdateCertificateTemplate({
    onSuccess: () => handleCloseEditor()
  })
  const deleteTemplateMutation = useDeleteCertificateTemplate()
  const {
    data: previewData,
    isLoading: isPreviewLoading
  } = usePreviewCertificateTemplate(previewTemplate?.id, {
    enabled: !!previewTemplate?.id
  })

  const localPreviewHtml = useMemo(
    () => buildSamplePreviewHtml(form.templateHtml, form.variables),
    [form.templateHtml, form.variables]
  )

  const serverPreviewHtml = useMemo(
    () => previewData?.fullHtml || previewData?.html || '',
    [previewData?.fullHtml, previewData?.html]
  )

  const isSaving =
    createTemplateMutation.isLoading ||
    updateTemplateMutation.isLoading ||
    deleteTemplateMutation.isLoading

  const templateCards = useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        normalized: normalizeTemplate(template)
      })),
    [templates]
  )

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingTemplate(null)
    setForm(emptyFormState())
    setTab(0)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setForm(emptyFormState())
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template)
    setForm(normalizeTemplate(template))
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleDuplicate = (template: CertificateTemplate) => {
    const normalized = normalizeTemplate(template)
    setEditingTemplate(null)
    setForm({
      ...normalized,
      name: `${normalized.name} (Copia)`,
      isDefault: false
    })
    setTab(0)
    setIsEditorOpen(true)
  }

  const handleDelete = async (template: CertificateTemplate) => {
    setTemplateToDelete(template)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) {
      return
    }

    await deleteTemplateMutation.mutateAsync(templateToDelete.id)
    setTemplateToDelete(null)
  }

  const handleSave = async () => {
    const payload: SaveCertificateTemplateRequest = {
      name: form.name.trim(),
      templateHtml: form.templateHtml.trim(),
      isDefault: form.isDefault,
      variables: form.variables
        .filter((variable) => variable.name.trim())
        .map((variable) => ({
          ...variable,
          name: variable.name.trim(),
          label: variable.label.trim() || variable.name.trim(),
          defaultValue: variable.defaultValue?.trim() || ''
        }))
    }

    if (editingTemplate) {
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: payload
      })
      return
    }

    await createTemplateMutation.mutateAsync(payload)
  }

  const updateVariable = (
    index: number,
    field: keyof CertificateTemplateVariable,
    value: string | boolean
  ) => {
    const nextVariables = [...form.variables]
    nextVariables[index] = {
      ...nextVariables[index],
      [field]: value
    }
    setForm((current) => ({
      ...current,
      variables: nextVariables
    }))
  }

  const addVariable = () => {
    setForm((current) => ({
      ...current,
      variables: [
        ...current.variables,
        {
          name: '',
          label: '',
          type: 'text',
          required: true,
          defaultValue: '',
          description: ''
        }
      ]
    }))
  }

  const removeVariable = (index: number) => {
    setForm((current) => ({
      ...current,
      variables: current.variables.filter((_, variableIndex) => variableIndex !== index)
    }))
  }

  const handleSignatureChange = (
    signatureName: 'leftSignatureImage' | 'rightSignatureImage',
    displayName: 'leftSignatureDisplay' | 'rightSignatureDisplay',
    nextValue: string | null
  ) => {
    setForm((current) => {
      const signatureLabel = signatureName === 'leftSignatureImage' ? 'Firma izquierda' : 'Firma derecha'
      const displayLabel =
        displayName === 'leftSignatureDisplay'
          ? 'Visualizacion de firma izquierda'
          : 'Visualizacion de firma derecha'

      const withSignature = ensureVariable(current.variables, signatureName, {
        name: signatureName,
        label: signatureLabel,
        type: 'text',
        required: false,
        defaultValue: nextValue || '',
        description: `Imagen base64 de la ${signatureLabel.toLowerCase()}`
      })

      const withDisplay = ensureVariable(withSignature, displayName, {
        name: displayName,
        label: displayLabel,
        type: 'text',
        required: false,
        defaultValue: nextValue ? 'flex' : 'none',
        description: `Control interno para mostrar u ocultar la ${signatureLabel.toLowerCase()}`
      }).map((variable) => {
        if (variable.name === signatureName) {
          return {
            ...variable,
            defaultValue: nextValue || ''
          }
        }

        if (variable.name === displayName) {
          return {
            ...variable,
            defaultValue: nextValue ? 'flex' : 'none'
          }
        }

        return variable
      })

      return {
        ...current,
        variables: withDisplay
      }
    })
  }

  const updateManagedTextVariable = (
    variableName: string,
    fallback: CertificateTemplateVariable,
    nextValue: string
  ) => {
    setForm((current) => ({
      ...current,
      variables: setManagedVariable(current.variables, variableName, fallback, nextValue)
    }))
  }

  const leftSignatureVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignatureImage'),
    [form.variables]
  )
  const rightSignatureVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignatureImage'),
    [form.variables]
  )
  const leftSignerNameVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignerName'),
    [form.variables]
  )
  const leftSignerRoleVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'leftSignerRole'),
    [form.variables]
  )
  const rightSignerNameVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignerName'),
    [form.variables]
  )
  const rightSignerRoleVariable = useMemo(
    () => form.variables.find((variable) => variable.name === 'rightSignerRole'),
    [form.variables]
  )

  const applyVariableSuggestion = (index: number, value: string) => {
    const matchingDefault = DEFAULT_VARIABLES.find((variable) => variable.name === value)
    if (matchingDefault) {
      const nextVariables = [...form.variables]
      nextVariables[index] = {
        ...nextVariables[index],
        ...matchingDefault,
        defaultValue: nextVariables[index].defaultValue || matchingDefault.defaultValue || ''
      }
      setForm((current) => ({
        ...current,
        variables: nextVariables
      }))
      return
    }

    updateVariable(index, 'name', value)
  }

  const insertTokenIntoHtml = (token: string) => {
    setForm((current) => ({
      ...current,
      templateHtml: `${current.templateHtml}\n${token}`
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Plantillas de Certificados
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Administra el diseno base de los certificados generados por el LMS.
          </Typography>
        </Box>

        <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
          Nueva Plantilla
        </Button>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Gestiona aquí el diseño oficial del certificado. La plantilla marcada como{' '}
        <strong>por defecto</strong> se usará automáticamente al emitir nuevos certificados.
      </Alert>

      {isLoading ? (
        <Typography color='text.secondary'>Cargando plantillas...</Typography>
      ) : templateCards.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No hay plantillas registradas
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Crea la primera plantilla para controlar el formato de los certificados.
          </Typography>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
            Crear Plantilla
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {templateCards.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant='h6'>{template.name}</Typography>
                      {template.isDefault || template.is_default ? (
                        <Chip label='Por defecto' color='primary' size='small' />
                      ) : null}
                    </Box>
                  }
                  action={
                    <Box>
                      <Tooltip title='Vista previa'>
                        <IconButton onClick={() => setPreviewTemplate(template)}>
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Editar'>
                        <IconButton onClick={() => handleEdit(template)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Duplicar'>
                        <IconButton onClick={() => handleDuplicate(template)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Eliminar'>
                        <span>
                          <IconButton
                            color='error'
                            onClick={() => handleDelete(template)}
                            disabled={template.isDefault || template.is_default}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Variables configuradas: {template.normalized.variables.length}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {template.normalized.variables.slice(0, 4).map((variable) => (
                      <Chip
                        key={`${template.id}-${variable.name}`}
                        label={variable.label}
                        size='small'
                        variant='outlined'
                      />
                    ))}
                  </Box>

                  <Typography variant='caption' color='text.secondary'>
                    Actualizada:{' '}
                    {new Date(
                      template.updatedAt || template.updated_at || template.createdAt || template.created_at || Date.now()
                    ).toLocaleDateString('es-CO')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={isEditorOpen} onClose={handleCloseEditor} fullWidth maxWidth='lg'>
        <DialogTitle>
          {editingTemplate ? 'Editar Plantilla de Certificado' : 'Nueva Plantilla de Certificado'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 1 }}>
            <Tab label='Ficha' />
            <Tab label='Diseño' />
            <Tab label='Variables' />
            <Tab label='Vista previa' />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity='info'>
                  Define primero el nombre interno de la plantilla y si será la opción base para
                  certificados nuevos.
                </Alert>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label='Nombre'
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isDefault}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isDefault: event.target.checked }))
                      }
                    />
                  }
                  label='Plantilla por defecto'
                />
              </Grid>
              <Grid item xs={12}>
                <Card variant='outlined'>
                  <CardHeader
                    title='Plantilla oficial y firmas'
                    subheader='La base del certificado usa una imagen oficial y dos bloques de firma configurables para nombre, cargo e imagen.'
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Alert severity='success'>
                          Fondo oficial activo: <strong>/images/template.png</strong>. Si mañana
                          cambian las personas, solo actualizas nombre, cargo o la firma
                          correspondiente.
                        </Alert>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Firma izquierda'
                            subheader='Normalmente usada para instructor o responsable academico.'
                          />
                          <CardContent>
                            <SignaturePad
                              value={
                                leftSignatureVariable?.defaultValue ||
                                leftSignatureVariable?.default_value ||
                                ''
                              }
                              onChange={(nextValue) =>
                                handleSignatureChange(
                                  'leftSignatureImage',
                                  'leftSignatureDisplay',
                                  nextValue
                                )
                              }
                              label='Firma izquierda'
                              helperText='Puedes dibujarla o subir una imagen con fondo transparente.'
                              height={150}
                            />
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Nombre'
                                  value={
                                    leftSignerNameVariable?.defaultValue ||
                                    leftSignerNameVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'leftSignerName',
                                      {
                                        name: 'leftSignerName',
                                        label: 'Nombre izquierda',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Daniel Paredes',
                                        description: 'Nombre que se mostrara bajo la firma izquierda'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Cargo'
                                  value={
                                    leftSignerRoleVariable?.defaultValue ||
                                    leftSignerRoleVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'leftSignerRole',
                                      {
                                        name: 'leftSignerRole',
                                        label: 'Cargo izquierda',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Instructor',
                                        description: 'Cargo que se mostrara bajo la firma izquierda'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card variant='outlined'>
                          <CardHeader
                            title='Firma derecha'
                            subheader='Normalmente usada para director tecnico, gerente o aprobador final.'
                          />
                          <CardContent>
                            <SignaturePad
                              value={
                                rightSignatureVariable?.defaultValue ||
                                rightSignatureVariable?.default_value ||
                                ''
                              }
                              onChange={(nextValue) =>
                                handleSignatureChange(
                                  'rightSignatureImage',
                                  'rightSignatureDisplay',
                                  nextValue
                                )
                              }
                              label='Firma derecha'
                              helperText='Puedes dibujarla o subir una imagen con fondo transparente.'
                              height={150}
                            />
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Nombre'
                                  value={
                                    rightSignerNameVariable?.defaultValue ||
                                    rightSignerNameVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'rightSignerName',
                                      {
                                        name: 'rightSignerName',
                                        label: 'Nombre derecha',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Andres Felipe Espitia',
                                        description: 'Nombre que se mostrara bajo la firma derecha'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Cargo'
                                  value={
                                    rightSignerRoleVariable?.defaultValue ||
                                    rightSignerRoleVariable?.default_value ||
                                    ''
                                  }
                                  onChange={(event) =>
                                    updateManagedTextVariable(
                                      'rightSignerRole',
                                      {
                                        name: 'rightSignerRole',
                                        label: 'Cargo derecha',
                                        type: 'text',
                                        required: false,
                                        defaultValue: 'Director Tecnico',
                                        description: 'Cargo que se mostrara bajo la firma derecha'
                                      },
                                      event.target.value
                                    )
                                  }
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <AlertTitle>Tokens rápidos</AlertTitle>
              Inserta variables conocidas sin escribirlas a mano. Usa este paso solo para ajustar
              el diseño del certificado.
            </Alert>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {CERTIFICATE_HTML_SNIPPETS.map((snippet) => (
                <Chip
                  key={snippet.token}
                  label={snippet.label}
                  clickable
                  variant='outlined'
                  onClick={() => insertTokenIntoHtml(snippet.token)}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={18}
              label='HTML del certificado'
              value={form.templateHtml}
              onChange={(event) =>
                setForm((current) => ({ ...current, templateHtml: event.target.value }))
              }
            />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <AlertTitle>Variables guiadas</AlertTitle>
              Usa primero nombres conocidos del sistema para evitar que el certificado quede con
              campos sin reemplazar.
            </Alert>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography variant='h6'>Variables dinamicas</Typography>
              <Button variant='outlined' startIcon={<AddIcon />} onClick={addVariable}>
                Agregar variable
              </Button>
            </Box>

            <List disablePadding>
              {form.variables.map((variable, index) => (
                <React.Fragment key={`${variable.name || 'new'}-${index}`}>
                  <ListItem disableGutters sx={{ py: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Nombre</InputLabel>
                          <Select
                            value={variable.name}
                            label='Nombre'
                            onChange={(event) =>
                              applyVariableSuggestion(index, event.target.value)
                            }
                          >
                            <MenuItem value=''>
                              <em>Seleccionar sugerencia</em>
                            </MenuItem>
                            {VARIABLE_NAME_SUGGESTIONS.map((suggestion) => (
                              <MenuItem key={suggestion} value={suggestion}>
                                {suggestion}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label='Etiqueta'
                          value={variable.label}
                          onChange={(event) =>
                            updateVariable(index, 'label', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={variable.type}
                            label='Tipo'
                            onChange={(event) =>
                              updateVariable(index, 'type', event.target.value)
                            }
                          >
                            <MenuItem value='text'>Texto</MenuItem>
                            <MenuItem value='date'>Fecha</MenuItem>
                            <MenuItem value='number'>Numero</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label='Valor de ejemplo'
                          value={variable.defaultValue || ''}
                          onChange={(event) =>
                            updateVariable(index, 'defaultValue', event.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={1.5}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={variable.required}
                              onChange={(event) =>
                                updateVariable(index, 'required', event.target.checked)
                              }
                            />
                          }
                          label='Req.'
                        />
                      </Grid>
                      <Grid item xs={12} md={0.5}>
                        <IconButton color='error' onClick={() => removeVariable(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Descripcion'
                          value={variable.description || ''}
                          onChange={(event) =>
                            updateVariable(index, 'description', event.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                  {index < form.variables.length - 1 ? <Divider /> : null}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Alert severity='info' sx={{ mb: 2 }}>
              La vista previa del editor usa datos de ejemplo locales para que puedas iterar antes
              de guardar.
            </Alert>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.300',
                overflow: 'auto',
                maxHeight: 700
              }}
            >
              <Box
                component='iframe'
                title='Vista previa local del certificado'
                srcDoc={localPreviewHtml}
                sx={{
                  width: '100%',
                  minHeight: 680,
                  border: 'none',
                  bgcolor: 'common.white'
                }}
              />
            </Paper>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditor}>Cancelar</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={!form.name.trim() || !form.templateHtml.trim() || isSaving}
          >
            {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>{previewTemplate?.name || 'Vista previa de plantilla'}</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Esta vista previa viene del backend real y usa datos de ejemplo del servicio de
            certificados.
          </Alert>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.300',
              overflow: 'auto',
              minHeight: 320
            }}
          >
            {isPreviewLoading ? (
              <Typography color='text.secondary'>Generando vista previa...</Typography>
            ) : (
              <Box
                component='iframe'
                title='Vista previa del certificado'
                srcDoc={serverPreviewHtml}
                sx={{
                  width: '100%',
                  minHeight: 680,
                  border: 'none',
                  bgcolor: 'common.white'
                }}
              />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
          <Button onClick={() => refetch()}>Refrescar listado</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Eliminar plantilla</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mt: 1 }}>
            Vas a eliminar la plantilla "{templateToDelete?.name}". Esta acción no se puede
            deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateToDelete(null)}>Cancelar</Button>
          <Button
            color='error'
            variant='contained'
            onClick={handleConfirmDelete}
            disabled={deleteTemplateMutation.isLoading}
          >
            Eliminar plantilla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCertificateTemplates
