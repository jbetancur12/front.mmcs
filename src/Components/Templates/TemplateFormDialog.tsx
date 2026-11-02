import React, { useEffect, useState } from 'react'
import { Alert, TextField } from '@mui/material'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import { TemplateData, TemplatesData, TemplateValidationErrors } from './types'
import {
  formatCellReference,
  validateField,
  validateTemplateComprehensive
} from './validation'

export type TemplateFormMode = 'create' | 'edit' | 'duplicate'

const EMPTY: TemplateData = {
  name: '',
  description: '',
  password: '',
  city: '',
  location: '',
  sede: '',
  activoFijo: '',
  serie: '',
  solicitante: '',
  instrumento: '',
  calibrationDate: ''
}

const TEXT_FIELDS: Array<keyof TemplateData> = [
  'name',
  'description',
  'password'
]

const fromTemplate = (template: TemplatesData): TemplateData => ({
  name: template.name || '',
  description: template.description || '',
  password: template.password || '',
  city: template.city || '',
  location: template.location || '',
  sede: template.sede || '',
  activoFijo: template.activoFijo || '',
  serie: template.serie || '',
  solicitante: template.solicitante || '',
  instrumento: template.instrumento || '',
  calibrationDate: template.calibrationDate || ''
})

/** Nombre de la copia: "X - Copia", y "X - Copia 2", 3... si ya existe. */
export const generateDuplicateName = (
  originalName: string,
  existingTemplates: TemplatesData[] = []
): string => {
  const baseName = `${originalName} - Copia`
  const existing = existingTemplates.map((t) => t.name?.toLowerCase() || '')
  if (!existing.includes(baseName.toLowerCase())) return baseName
  let counter = 2
  while (existing.includes(`${baseName} ${counter}`.toLowerCase())) {
    counter += 1
  }
  return `${baseName} ${counter}`
}

const TEXTS: Record<
  TemplateFormMode,
  { title: string; submit: string; intro: (name?: string) => string }
> = {
  create: {
    title: 'Crear plantilla',
    submit: 'Crear plantilla',
    intro: () =>
      'Una plantilla dice en qué celda del Excel está cada dato. Si la ciudad está en E45, escribe E45 en Ciudad. Así se leen automáticamente archivos con el mismo formato.'
  },
  edit: {
    title: 'Editar plantilla',
    submit: 'Guardar cambios',
    intro: () => ''
  },
  duplicate: {
    title: 'Duplicar plantilla',
    submit: 'Crear copia',
    intro: (name) =>
      `Se crea una copia de "${name}" con todas sus referencias de celdas. Puedes cambiarlas antes de guardar.`
  }
}

interface TemplateFormDialogProps {
  open: boolean
  mode: TemplateFormMode
  /** Plantilla de origen: la que se edita o la que se copia. */
  template?: TemplatesData | null
  /** Para no repetir nombre al duplicar. */
  existingTemplates?: TemplatesData[]
  onClose: () => void
  /** Devuelve `false` si falló, para dejar el diálogo abierto con lo escrito. */
  onSubmit: (data: TemplateData) => Promise<boolean | void> | boolean | void
}

/** Diálogo único para crear, editar y duplicar plantillas de mapeo de Excel. */
const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
  open,
  mode,
  template,
  existingTemplates,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<TemplateData>(EMPTY)
  const [errors, setErrors] = useState<TemplateValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const texts = TEXTS[mode]

  // Al abrir se parte de la plantilla de origen (o vacío al crear)
  useEffect(() => {
    if (!open) return
    setErrors({})
    if (mode === 'create' || !template) {
      setFormData(EMPTY)
      return
    }
    const data = fromTemplate(template)
    setFormData(
      mode === 'duplicate'
        ? {
            ...data,
            name: generateDuplicateName(template.name, existingTemplates)
          }
        : data
    )
    // existingTemplates cambia de identidad en cada render del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, template])

  const handleChange =
    (field: keyof TemplateData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value
      // Las referencias de celda van siempre en mayúsculas y sin espacios
      if (!TEXT_FIELDS.includes(field) && value) {
        value = formatCellReference(value)
      }
      const updated = { ...formData, [field]: value }
      setFormData(updated)
      const fieldError = validateField(field, value, updated)
      setErrors((prev) => {
        const next = { ...prev }
        if (fieldError) next[field] = fieldError
        else delete next[field]
        return next
      })
    }

  const handleSubmit = async () => {
    const found = validateTemplateComprehensive(formData)
    // Al editar, un dato viejo que no cumple la regla actual no bloquea el
    // guardado mientras no se toque (p. ej. un nombre con paréntesis)
    const blocking =
      mode === 'edit' && template
        ? Object.fromEntries(
            Object.entries(found).filter(
              ([field]) =>
                formData[field as keyof TemplateData] !==
                fromTemplate(template)[field as keyof TemplateData]
            )
          )
        : found
    setErrors(blocking)
    if (Object.keys(blocking).length > 0) return

    setSubmitting(true)
    try {
      const result = await onSubmit(formData)
      if (result !== false) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    name: keyof TemplateData,
    label: string,
    options: {
      help?: string
      placeholder?: string
      required?: boolean
      fullWidth?: boolean
      type?: string
      multiline?: boolean
    } = {}
  ) => (
    <TextField
      label={label}
      value={formData[name]}
      onChange={handleChange(name)}
      error={Boolean(errors[name])}
      helperText={errors[name] || options.help}
      placeholder={options.placeholder}
      required={options.required}
      type={options.type}
      multiline={options.multiline}
      minRows={options.multiline ? 3 : undefined}
      fullWidth
      sx={options.fullWidth ? { gridColumn: '1 / -1' } : undefined}
    />
  )

  const intro = texts.intro(template?.name)

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={texts.title}
      subtitle={
        mode === 'edit' ? template?.name : 'Plantilla de lectura de Excel'
      }
      submitLabel={texts.submit}
      onSubmit={handleSubmit}
      loading={submitting}
      maxWidth='md'
    >
      {intro ? (
        <Alert severity='info' variant='outlined' sx={{ mb: 3 }}>
          {intro}
        </Alert>
      ) : null}

      <FormDialogSection title='Datos de la plantilla'>
        {field('name', 'Nombre', {
          required: true,
          fullWidth: true,
          placeholder: 'Ej: Calibración equipos médicos',
          help:
            mode === 'duplicate'
              ? 'Se agregó " - Copia" al nombre original.'
              : undefined
        })}
        {field('description', 'Descripción', {
          required: true,
          fullWidth: true,
          multiline: true,
          placeholder: 'Para qué se usa esta plantilla'
        })}
        {field('password', 'Contraseña del Excel', {
          type: 'password',
          help: 'Opcional. Solo si el archivo viene protegido.'
        })}
      </FormDialogSection>

      <FormDialogSection
        title='Celdas de ubicación'
        description='Celda del Excel donde está cada dato, por ejemplo E45.'
      >
        {field('city', 'Ciudad', { required: true, placeholder: 'E45' })}
        {field('location', 'Ubicación', { required: true, placeholder: 'F23' })}
        {field('sede', 'Sede', { required: true, placeholder: 'G12' })}
        {field('solicitante', 'Solicitante', {
          required: true,
          placeholder: 'S10'
        })}
      </FormDialogSection>

      <FormDialogSection
        title='Celdas del equipo'
        description='Activo fijo, serie y fecha son opcionales.'
      >
        {field('instrumento', 'Instrumento', {
          required: true,
          placeholder: 'P7'
        })}
        {field('activoFijo', 'Activo fijo', { placeholder: 'L14' })}
        {field('serie', 'Serie', { placeholder: 'K15' })}
        {field('calibrationDate', 'Fecha de calibración', {
          placeholder: 'V12'
        })}
      </FormDialogSection>
    </FormDialog>
  )
}

export default TemplateFormDialog
