import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Paper,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete
} from '@mui/material'
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { useCourses, useCreateAssignment } from '../../../hooks/useLms'

// Color palette
const colors = {
  primary: '#10b981',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937'
  }
}

interface BulkAssignmentToolsProps {
  onAssignmentComplete?: (results: any) => void
}

interface AssignmentTarget {
  type: 'role' | 'user' | 'all_employees'
  value: string | number
  label: string
}

interface AssignmentData {
  courseId: number
  courseTitle: string
  targets: AssignmentTarget[]
  deadline?: Date
  isMandatory: boolean
  sendNotification: boolean
}

const BulkAssignmentTools: React.FC<BulkAssignmentToolsProps> = ({
  onAssignmentComplete
}) => {
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [assignmentData, setAssignmentData] = useState<AssignmentData>({
    courseId: 0,
    courseTitle: '',
    targets: [],
    isMandatory: true,
    sendNotification: true
  })
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [selectedTargets, setSelectedTargets] = useState<AssignmentTarget[]>([])
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [previewResults, setPreviewResults] = useState<any>(null)

  // Fetch courses for selection
  const { data: coursesData } = useCourses({
    status: 'published',
    limit: 100
  })

  const createAssignmentMutation = useCreateAssignment()

  const courses = coursesData?.courses || []

  // Mock roles data - in real app, this would come from an API
  const availableRoles = [
    { id: 'admin', name: 'Administrador' },
    { id: 'doctor', name: 'Médico' },
    { id: 'nurse', name: 'Enfermero/a' },
    { id: 'technician', name: 'Técnico' },
    { id: 'receptionist', name: 'Recepcionista' },
    { id: 'manager', name: 'Gerente' }
  ]

  const steps = [
    'Seleccionar Curso',
    'Definir Destinatarios',
    'Configurar Opciones',
    'Revisar y Confirmar'
  ]

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    setAssignmentData({
      courseId: 0,
      courseTitle: '',
      targets: [],
      isMandatory: true,
      sendNotification: true
    })
    setSelectedCourse(null)
    setSelectedTargets([])
    setDeadline(null)
    setPreviewResults(null)
  }

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course)
    setAssignmentData(prev => ({
      ...prev,
      courseId: course.id,
      courseTitle: course.title
    }))
  }

  const handleAddTarget = (target: AssignmentTarget) => {
    const exists = selectedTargets.some(t => 
      t.type === target.type && t.value === target.value
    )
    
    if (!exists) {
      setSelectedTargets(prev => [...prev, target])
    }
  }

  const handleRemoveTarget = (index: number) => {
    setSelectedTargets(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddAllEmployees = () => {
    const allEmployeesTarget: AssignmentTarget = {
      type: 'all_employees',
      value: 'all',
      label: 'Todos los Empleados'
    }
    handleAddTarget(allEmployeesTarget)
  }

  const handleAddRole = (role: any) => {
    const roleTarget: AssignmentTarget = {
      type: 'role',
      value: role.id,
      label: `Rol: ${role.name}`
    }
    handleAddTarget(roleTarget)
  }

  const generatePreview = () => {
    // Mock preview calculation
    const estimatedUsers = selectedTargets.reduce((total, target) => {
      switch (target.type) {
        case 'all_employees':
          return total + 150 // Mock number
        case 'role':
          // Mock numbers based on role
          const roleCounts: Record<string, number> = {
            admin: 5,
            doctor: 25,
            nurse: 45,
            technician: 20,
            receptionist: 15,
            manager: 8
          }
          return total + (roleCounts[target.value as string] || 10)
        default:
          return total + 1
      }
    }, 0)

    setPreviewResults({
      estimatedUsers,
      targets: selectedTargets,
      course: selectedCourse,
      deadline,
      isMandatory: assignmentData.isMandatory,
      sendNotification: assignmentData.sendNotification
    })
  }

  const handleSubmit = async () => {
    try {
      const assignments = selectedTargets.map(target => ({
        course_id: selectedCourse.id,
        ...(target.type === 'role' && { role: target.value }),
        ...(target.type === 'all_employees' && { all_employees: true }),
        deadline: deadline?.toISOString(),
        is_mandatory: assignmentData.isMandatory
      }))

      // Create bulk assignments
      const results = await Promise.all(
        assignments.map(assignment => 
          createAssignmentMutation.mutateAsync(assignment)
        )
      )

      onAssignmentComplete?.(results)
      setOpen(false)
      handleReset()
    } catch (error) {
      console.error('Error creating bulk assignments:', error)
    }
  }

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0:
        return selectedCourse !== null
      case 1:
        return selectedTargets.length > 0
      case 2:
        return true
      case 3:
        return previewResults !== null
      default:
        return false
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.success} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`
            }
          }}
        >
          Asignación Masiva
        </Button>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AssignmentIcon color="primary" />
              Herramienta de Asignación Masiva
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Select Course */}
              <Step>
                <StepLabel>Seleccionar Curso</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Selecciona el curso que deseas asignar masivamente.
                  </Typography>
                  
                  <Autocomplete
                    options={courses}
                    getOptionLabel={(option) => option.title}
                    value={selectedCourse}
                    onChange={(_, newValue) => handleCourseSelect(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar curso"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.description}
                          </Typography>
                          <Box mt={0.5}>
                            <Chip
                              size="small"
                              label={option.is_mandatory ? 'Obligatorio' : 'Opcional'}
                              color={option.is_mandatory ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  />

                  {selectedCourse && (
                    <Paper sx={{ p: 2, mt: 2, backgroundColor: colors.gray[50] }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Curso Seleccionado:
                      </Typography>
                      <Typography variant="body2">
                        <strong>{selectedCourse.title}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {selectedCourse.description}
                      </Typography>
                    </Paper>
                  )}

                  <Box sx={{ mb: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                    >
                      Continuar
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Define Targets */}
              <Step>
                <StepLabel>Definir Destinatarios</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Selecciona los usuarios o roles que recibirán la asignación.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Opciones de Asignación
                        </Typography>
                        
                        <Stack spacing={1}>
                          <Button
                            variant="outlined"
                            startIcon={<GroupIcon />}
                            onClick={handleAddAllEmployees}
                            fullWidth
                          >
                            Todos los Empleados
                          </Button>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Typography variant="caption" color="textSecondary">
                            Por Rol:
                          </Typography>
                          
                          {availableRoles.map((role) => (
                            <Button
                              key={role.id}
                              variant="outlined"
                              size="small"
                              startIcon={<PersonIcon />}
                              onClick={() => handleAddRole(role)}
                              fullWidth
                            >
                              {role.name}
                            </Button>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Destinatarios Seleccionados ({selectedTargets.length})
                        </Typography>
                        
                        {selectedTargets.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">
                            No hay destinatarios seleccionados
                          </Typography>
                        ) : (
                          <List dense>
                            {selectedTargets.map((target, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  {target.type === 'all_employees' ? <GroupIcon /> : <PersonIcon />}
                                </ListItemIcon>
                                <ListItemText primary={target.label} />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleRemoveTarget(index)}
                                  >
                                    <CloseIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 1, mt: 2 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                    >
                      Continuar
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Configure Options */}
              <Step>
                <StepLabel>Configurar Opciones</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Configura las opciones adicionales para la asignación.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MuiDatePicker
                        label="Fecha límite (opcional)"
                        value={deadline}
                        onChange={(newValue) => setDeadline(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={assignmentData.isMandatory}
                            onChange={(e) => setAssignmentData(prev => ({
                              ...prev,
                              isMandatory: e.target.checked
                            }))}
                          />
                        }
                        label="Marcar como entrenamiento obligatorio"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={assignmentData.sendNotification}
                            onChange={(e) => setAssignmentData(prev => ({
                              ...prev,
                              sendNotification: e.target.checked
                            }))}
                          />
                        }
                        label="Enviar notificaciones automáticas"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 1, mt: 2 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        generatePreview()
                        handleNext()
                      }}
                    >
                      Generar Vista Previa
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 4: Review and Confirm */}
              <Step>
                <StepLabel>Revisar y Confirmar</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    Revisa los detalles de la asignación antes de confirmar.
                  </Typography>

                  {previewResults && (
                    <Paper sx={{ p: 2, backgroundColor: colors.gray[50] }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Resumen de Asignación
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Curso:</strong> {previewResults.course.title}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Usuarios estimados:</strong> {previewResults.estimatedUsers}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Fecha límite:</strong> {
                              previewResults.deadline 
                                ? previewResults.deadline.toLocaleDateString()
                                : 'Sin fecha límite'
                            }
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Tipo:</strong> {
                              previewResults.isMandatory ? 'Obligatorio' : 'Opcional'
                            }
                          </Typography>
                          <Typography variant="body2">
                            <strong>Notificaciones:</strong> {
                              previewResults.sendNotification ? 'Sí' : 'No'
                            }
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Destinatarios:
                      </Typography>
                      <List dense>
                        {previewResults.targets.map((target: AssignmentTarget, index: number) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {target.type === 'all_employees' ? <GroupIcon /> : <PersonIcon />}
                            </ListItemIcon>
                            <ListItemText primary={target.label} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  <Box sx={{ mb: 1, mt: 2 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSubmit}
                      disabled={createAssignmentMutation.isLoading}
                      sx={{
                        background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`
                      }}
                    >
                      {createAssignmentMutation.isLoading ? 'Creando...' : 'Confirmar Asignación'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            {activeStep === steps.length - 1 && (
              <Button onClick={handleReset}>
                Reiniciar
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default BulkAssignmentTools
