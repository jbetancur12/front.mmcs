import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  Divider,
  Alert,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  FileCopy as CopyIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material'

interface CertificateTemplate {
  id: number
  name: string
  description: string
  template_html: string
  variables: TemplateVariable[]
  is_default: boolean
  created_at: string
  updated_at: string
}

interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'date' | 'number'
  required: boolean
  default_value?: string
  description?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const LmsCertificateTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_html: '',
    variables: [] as TemplateVariable[],
    is_default: false
  })

  // Mock data for templates
  const mockTemplates: CertificateTemplate[] = [
    {
      id: 1,
      name: 'Certificado Estándar',
      description: 'Plantilla por defecto para certificados de curso',
      template_html: `
        <div style="width: 800px; height: 600px; border: 2px solid #2196F3; padding: 40px; font-family: Arial, sans-serif; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
          <h1 style="color: #2196F3; margin-bottom: 20px; font-size: 36px;">CERTIFICADO DE FINALIZACIÓN</h1>
          <div style="margin: 40px 0;">
            <p style="font-size: 18px; margin-bottom: 10px;">Se certifica que</p>
            <h2 style="color: #333; font-size: 28px; margin: 20px 0; border-bottom: 2px solid #2196F3; padding-bottom: 10px;">{{user_name}}</h2>
            <p style="font-size: 18px; margin-bottom: 10px;">ha completado exitosamente el curso</p>
            <h3 style="color: #2196F3; font-size: 24px; margin: 20px 0;">{{course_name}}</h3>
          </div>
          <div style="margin: 40px 0;">
            <p style="font-size: 16px;">Fecha de finalización: {{completion_date}}</p>
            <p style="font-size: 14px; color: #666;">Certificado N°: {{certificate_number}}</p>
          </div>
          <div style="margin-top: 60px;">
            <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 10px;">
              <p style="font-size: 14px; margin: 0;">Firma Autorizada</p>
            </div>
          </div>
        </div>
      `,
      variables: [
        { name: 'user_name', label: 'Nombre del Usuario', type: 'text', required: true, description: 'Nombre completo del estudiante' },
        { name: 'course_name', label: 'Nombre del Curso', type: 'text', required: true, description: 'Título del curso completado' },
        { name: 'completion_date', label: 'Fecha de Finalización', type: 'date', required: true, description: 'Fecha en que se completó el curso' },
        { name: 'certificate_number', label: 'Número de Certificado', type: 'text', required: true, description: 'Identificador único del certificado' }
      ],
      is_default: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Certificado Corporativo',
      description: 'Plantilla formal para certificados empresariales',
      template_html: `
        <div style="width: 800px; height: 600px; border: 3px solid #1976D2; padding: 30px; font-family: 'Times New Roman', serif; background: white;">
          <div style="text-align: center; border: 1px solid #1976D2; padding: 30px; height: 100%;">
            <div style="border-top: 3px solid #1976D2; border-bottom: 3px solid #1976D2; padding: 20px 0; margin-bottom: 30px;">
              <h1 style="color: #1976D2; font-size: 32px; margin: 0; letter-spacing: 2px;">CERTIFICADO</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">DE CAPACITACIÓN PROFESIONAL</p>
            </div>
            <div style="margin: 40px 0;">
              <p style="font-size: 16px; margin-bottom: 20px;">Por medio del presente se certifica que</p>
              <h2 style="color: #333; font-size: 26px; margin: 25px 0; text-transform: uppercase; letter-spacing: 1px;">{{user_name}}</h2>
              <p style="font-size: 16px; margin: 20px 0;">ha completado satisfactoriamente el programa de capacitación</p>
              <h3 style="color: #1976D2; font-size: 22px; margin: 25px 0; font-style: italic;">{{course_name}}</h3>
              <p style="font-size: 14px; margin: 20px 0;">con una duración de {{course_duration}} horas académicas</p>
            </div>
            <div style="margin: 40px 0; display: flex; justify-content: space-between; align-items: center;">
              <div style="text-align: left;">
                <p style="font-size: 14px; margin: 0;">Otorgado el {{completion_date}}</p>
                <p style="font-size: 12px; color: #666; margin: 5px 0;">Certificado N°: {{certificate_number}}</p>
              </div>
              <div style="text-align: right;">
                <div style="border-top: 1px solid #333; width: 150px; padding-top: 5px;">
                  <p style="font-size: 12px; margin: 0;">Director de Capacitación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      variables: [
        { name: 'user_name', label: 'Nombre del Usuario', type: 'text', required: true, description: 'Nombre completo del participante' },
        { name: 'course_name', label: 'Nombre del Curso', type: 'text', required: true, description: 'Título del programa de capacitación' },
        { name: 'completion_date', label: 'Fecha de Finalización', type: 'date', required: true, description: 'Fecha de otorgamiento del certificado' },
        { name: 'certificate_number', label: 'Número de Certificado', type: 'text', required: true, description: 'Código único de identificación' },
        { name: 'course_duration', label: 'Duración del Curso', type: 'number', required: false, description: 'Horas académicas del curso' }
      ],
      is_default: false,
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-22T09:15:00Z'
    }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/lms/certificate-templates')
      // const data = await response.json()
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setFormData({
      name: '',
      description: '',
      template_html: '',
      variables: [],
      is_default: false
    })
    setIsCreateDialogOpen(true)
  }

  const handleEditTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      template_html: template.template_html,
      variables: [...template.variables],
      is_default: template.is_default
    })
    setIsEditDialogOpen(true)
  }

  const handlePreviewTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      if (selectedTemplate) {
        // Update existing template
        console.log('Updating template:', formData)
      } else {
        // Create new template
        console.log('Creating template:', formData)
      }
      
      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      setLoading(true)
      try {
        // TODO: Replace with actual API call
        console.log('Deleting template:', templateId)
        loadTemplates()
      } catch (error) {
        console.error('Error deleting template:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDuplicateTemplate = (template: CertificateTemplate) => {
    setFormData({
      name: `${template.name} (Copia)`,
      description: template.description,
      template_html: template.template_html,
      variables: [...template.variables],
      is_default: false
    })
    setSelectedTemplate(null)
    setIsCreateDialogOpen(true)
  }

  const addVariable = () => {
    const newVariable: TemplateVariable = {
      name: '',
      label: '',
      type: 'text',
      required: true,
      description: ''
    }
    setFormData({
      ...formData,
      variables: [...formData.variables, newVariable]
    })
  }

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    const updatedVariables = [...formData.variables]
    updatedVariables[index] = { ...updatedVariables[index], [field]: value }
    setFormData({ ...formData, variables: updatedVariables })
  }

  const removeVariable = (index: number) => {
    const updatedVariables = formData.variables.filter((_, i) => i !== index)
    setFormData({ ...formData, variables: updatedVariables })
  }

  const generatePreviewHtml = (template: CertificateTemplate) => {
    let html = template.template_html
    template.variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`
      let sampleValue = ''
      
      switch (variable.type) {
        case 'text':
          sampleValue = variable.name === 'user_name' ? 'Juan Pérez García' :
                       variable.name === 'course_name' ? 'Curso de Ejemplo' :
                       variable.name === 'certificate_number' ? 'CERT-2024-001' :
                       'Valor de ejemplo'
          break
        case 'date':
          sampleValue = new Date().toLocaleDateString('es-ES')
          break
        case 'number':
          sampleValue = '40'
          break
        default:
          sampleValue = 'Valor de ejemplo'
      }
      
      html = html.replace(new RegExp(placeholder, 'g'), sampleValue)
    })
    return html
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Plantillas de Certificados
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Nueva Plantilla
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Las plantillas de certificados permiten personalizar el diseño y contenido de los certificados que se generan automáticamente al completar cursos.
          Utiliza variables como {'{'}{'{'} user_name {'}'}{'}'},  {'{'}{'{'} course_name {'}'}{'}'},  {'{'}{'{'} completion_date {'}'}{'}'}  para insertar datos dinámicos.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                    {template.is_default && (
                      <Chip label="Por defecto" color="primary" size="small" />
                    )}
                  </Box>
                }
                action={
                  <Box>
                    <Tooltip title="Vista previa">
                      <IconButton onClick={() => handlePreviewTemplate(template)}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEditTemplate(template)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicar">
                      <IconButton onClick={() => handleDuplicateTemplate(template)}>
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    {!template.is_default && (
                      <Tooltip title="Eliminar">
                        <IconButton 
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                
                <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                  Variables disponibles: {template.variables.length}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {template.variables.slice(0, 3).map((variable) => (
                    <Chip
                      key={variable.name}
                      label={variable.label}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {template.variables.length > 3 && (
                    <Chip
                      label={`+${template.variables.length - 3} más`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Actualizado: {new Date(template.updated_at).toLocaleDateString('es-ES')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
   
   {/* Create/Edit Template Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Certificado'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Información General" />
              <Tab label="Diseño HTML" />
              <Tab label="Variables" />
              <Tab label="Vista Previa" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre de la Plantilla"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      />
                    }
                    label="Plantilla por defecto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Utiliza HTML y CSS inline para diseñar tu certificado. 
                    Las variables se insertan usando la sintaxis: <code>{'{'}{'{'} nombre_variable {'}'}{'}'}  </code>
                  </Typography>
                </Alert>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Consejos de Diseño
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" component="div">
                      <ul>
                        <li>Usa un contenedor con ancho fijo (ej: 800px) para mantener proporciones</li>
                        <li>Aplica estilos CSS inline para mejor compatibilidad</li>
                        <li>Considera el tamaño de impresión (A4: 210mm x 297mm)</li>
                        <li>Usa fuentes web-safe como Arial, Times New Roman, etc.</li>
                        <li>Incluye márgenes y padding adecuados</li>
                      </ul>
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
              
              <TextField
                fullWidth
                label="Código HTML del Certificado"
                value={formData.template_html}
                onChange={(e) => setFormData({ ...formData, template_html: e.target.value })}
                multiline
                rows={15}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Variables de la Plantilla</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addVariable}
                >
                  Agregar Variable
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Las variables permiten insertar datos dinámicos en el certificado. 
                  Cada variable debe tener un nombre único que se usará en el HTML como {'{'}{'{'} nombre_variable {'}'}{'}'}  .
                </Typography>
              </Alert>

              <List>
                {formData.variables.map((variable, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Nombre de Variable"
                            value={variable.name}
                            onChange={(e) => updateVariable(index, 'name', e.target.value)}
                            placeholder="ej: user_name"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Etiqueta"
                            value={variable.label}
                            onChange={(e) => updateVariable(index, 'label', e.target.value)}
                            placeholder="ej: Nombre del Usuario"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                              value={variable.type}
                              onChange={(e) => updateVariable(index, 'type', e.target.value)}
                              label="Tipo"
                            >
                              <MenuItem value="text">Texto</MenuItem>
                              <MenuItem value="date">Fecha</MenuItem>
                              <MenuItem value="number">Número</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={variable.required}
                                onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                                size="small"
                              />
                            }
                            label="Requerido"
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <IconButton
                            onClick={() => removeVariable(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Descripción (opcional)"
                            value={variable.description || ''}
                            onChange={(e) => updateVariable(index, 'description', e.target.value)}
                            placeholder="Descripción de la variable"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < formData.variables.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {formData.variables.length === 0 && (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay variables definidas. Haz clic en "Agregar Variable" para comenzar.
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Vista Previa del Certificado
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Esta es una vista previa con datos de ejemplo. El certificado real utilizará los datos del usuario y curso correspondientes.
                  </Typography>
                </Alert>
              </Box>

              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  border: '1px solid',
                  borderColor: 'grey.300',
                  overflow: 'auto',
                  maxHeight: '600px'
                }}
              >
                {formData.template_html ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generatePreviewHtml({
                        id: selectedTemplate?.id || 0,
                        name: formData.name,
                        description: formData.description,
                        template_html: formData.template_html,
                        variables: formData.variables,
                        is_default: formData.is_default,
                        created_at: selectedTemplate?.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })
                    }}
                    style={{ 
                      transform: 'scale(0.8)', 
                      transformOrigin: 'top left',
                      width: '125%'
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Ingresa el código HTML en la pestaña "Diseño HTML" para ver la vista previa
                  </Typography>
                )}
              </Paper>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!formData.name || !formData.template_html || loading}
          >
            {loading ? 'Guardando...' : selectedTemplate ? 'Actualizar' : 'Crear'} Plantilla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Vista Previa: {selectedTemplate?.name}
            </Typography>
            <Box>
              <Tooltip title="Descargar como PDF">
                <IconButton>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Esta vista previa muestra cómo se verá el certificado con datos de ejemplo.
            </Typography>
          </Alert>
          
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: 'white', 
              border: '1px solid',
              borderColor: 'grey.300',
              overflow: 'auto',
              maxHeight: '70vh'
            }}
          >
            {selectedTemplate && (
              <div
                dangerouslySetInnerHTML={{
                  __html: generatePreviewHtml(selectedTemplate)
                }}
                style={{ 
                  transform: 'scale(0.9)', 
                  transformOrigin: 'top center',
                  width: '111%',
                  marginLeft: '-5.5%'
                }}
              />
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCertificateTemplates