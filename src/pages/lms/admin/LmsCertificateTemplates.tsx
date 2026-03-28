import React, { useMemo, useState } from 'react'
import {
  Alert,
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
    name: 'certificateNumber',
    label: 'Numero de certificado',
    type: 'text',
    required: true,
    description: 'Identificador unico del certificado'
  }
]

const DEFAULT_TEMPLATE_HTML = `
<div style="width: 100%; max-width: 900px; margin: 0 auto; padding: 48px; background: #ffffff; border: 8px solid #1f2937; border-radius: 24px; text-align: center; font-family: Arial, sans-serif;">
  <p style="font-size: 16px; letter-spacing: 4px; color: #059669; margin-bottom: 16px;">MMCS LMS</p>
  <h1 style="font-size: 42px; color: #111827; margin-bottom: 12px;">CERTIFICADO DE FINALIZACION</h1>
  <p style="font-size: 18px; color: #4b5563; margin-bottom: 32px;">Se certifica que</p>
  <h2 style="font-size: 34px; color: #059669; margin-bottom: 24px;">{{userName}}</h2>
  <p style="font-size: 18px; color: #4b5563; margin-bottom: 16px;">completo satisfactoriamente el curso</p>
  <h3 style="font-size: 28px; color: #111827; margin-bottom: 28px;">{{courseTitle}}</h3>
  <p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;">Fecha de finalizacion: {{completionDate}}</p>
  <p style="font-size: 14px; color: #9ca3af;">Certificado N. {{certificateNumber}}</p>
</div>
`.trim()

const emptyFormState = (): TemplateFormState => ({
  name: '',
  templateHtml: DEFAULT_TEMPLATE_HTML,
  isDefault: false,
  variables: DEFAULT_VARIABLES
})

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

const normalizeTemplate = (template: CertificateTemplate): TemplateFormState => ({
  name: template.name || '',
  templateHtml: template.templateHtml || template.template_html || '',
  isDefault: template.isDefault ?? template.is_default ?? false,
  variables:
    template.variables?.length > 0
      ? template.variables.map((variable) => ({
          ...variable,
          defaultValue: variable.defaultValue ?? variable.default_value ?? ''
        }))
      : DEFAULT_VARIABLES
})

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

    acc[variable.name] = variable.label || variable.name
    return acc
  }, {})

  return templateHtml.replace(/\{\{(\w+)\}\}/g, (_, variableName: string) => sampleValues[variableName] || '')
}

const LmsCertificateTemplates: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null)
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
    () => sanitizeHtml(buildSamplePreviewHtml(form.templateHtml, form.variables), 'richText'),
    [form.templateHtml, form.variables]
  )

  const serverPreviewHtml = useMemo(
    () => sanitizeHtml(previewData?.html || '', 'richText'),
    [previewData?.html]
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
    const confirmed = window.confirm(
      `Vas a eliminar la plantilla "${template.name}". Esta accion no se puede deshacer.`
    )

    if (!confirmed) {
      return
    }

    await deleteTemplateMutation.mutateAsync(template.id)
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
        Esta pantalla ya usa el backend real. La plantilla por defecto es la que se usara
        automaticamente al emitir certificados nuevos.
      </Alert>

      <Alert severity='warning' sx={{ mb: 3 }}>
        Variables obligatorias recomendadas: <strong>{'{{userName}}'}</strong>,{' '}
        <strong>{'{{courseTitle}}'}</strong>, <strong>{'{{completionDate}}'}</strong> y{' '}
        <strong>{'{{certificateNumber}}'}</strong>.
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
            <Tab label='General' />
            <Tab label='HTML' />
            <Tab label='Variables' />
            <Tab label='Vista previa' />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
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
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
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
                        <TextField
                          fullWidth
                          label='Nombre'
                          value={variable.name}
                          onChange={(event) =>
                            updateVariable(index, 'name', event.target.value)
                          }
                          placeholder='userName'
                        />
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
                maxHeight: 600
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: localPreviewHtml }}
                style={{ transform: 'scale(0.88)', transformOrigin: 'top left', width: '114%' }}
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
              <div
                dangerouslySetInnerHTML={{ __html: serverPreviewHtml }}
                style={{ transform: 'scale(0.9)', transformOrigin: 'top center', width: '111%' }}
              />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
          <Button onClick={() => refetch()}>Refrescar listado</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCertificateTemplates
