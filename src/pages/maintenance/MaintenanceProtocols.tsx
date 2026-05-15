import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import {
  Add,
  ArrowBack,
  DeleteOutline,
  EditOutlined,
  PlaylistAddCheck
} from '@mui/icons-material'
import {
  useCreateMaintenanceProtocolTemplate,
  useDeleteMaintenanceProtocolTemplate,
  useMaintenanceProtocolTemplates,
  useMaintenanceToolEquipmentSearch,
  useUpdateMaintenanceProtocolTemplate
} from '../../hooks/useMaintenance'
import type {
  MaintenanceProtocolTemplate,
  MaintenanceProtocolTemplateRequest,
  MaintenanceTechnicalReportTest,
  MaintenanceTechnicalReportTool,
  MaintenanceToolEquipmentSummary
} from '../../types/maintenance'

const surfaceSx = {
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  backgroundColor: '#ffffff'
}

const emptyTool = (): MaintenanceTechnicalReportTool => ({
  name: '',
  serial: '',
  calibrationDue: null,
  internalCode: null,
  location: null
})

const emptyTest = (): MaintenanceTechnicalReportTest => ({
  parameter: '',
  result: 'PASA',
  value: '',
  notes: ''
})

const defaultFormState = {
  name: '',
  code: '',
  description: '',
  appliesToText: '',
  riskClass: '',
  recommendations: '',
  sortOrder: 0,
  isActive: true,
  tools: [emptyTool()],
  tests: [emptyTest()]
}

const toFormState = (protocol?: MaintenanceProtocolTemplate | null) => {
  if (!protocol) return defaultFormState

  return {
    name: protocol.name,
    code: protocol.code,
    description: protocol.description || '',
    appliesToText: protocol.appliesTo.join(', '),
    riskClass: protocol.riskClass || '',
    recommendations: protocol.recommendations || '',
    sortOrder: protocol.sortOrder || 0,
    isActive: protocol.isActive,
    tools: protocol.tools.length ? protocol.tools : [emptyTool()],
    tests: protocol.tests.length ? protocol.tests : [emptyTest()]
  }
}

const MaintenanceProtocols = () => {
  const navigate = useNavigate()
  const { data: protocols = [], isLoading } = useMaintenanceProtocolTemplates()
  const createProtocolMutation = useCreateMaintenanceProtocolTemplate()
  const updateProtocolMutation = useUpdateMaintenanceProtocolTemplate()
  const deleteProtocolMutation = useDeleteMaintenanceProtocolTemplate()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentProtocol, setCurrentProtocol] =
    useState<MaintenanceProtocolTemplate | null>(null)
  const [formState, setFormState] = useState(defaultFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [toolSearch, setToolSearch] = useState('')
  const { data: toolEquipmentOptions = [], isFetching: toolSearchLoading } =
    useMaintenanceToolEquipmentSearch(toolSearch)

  const activeCount = useMemo(
    () => protocols.filter((protocol) => protocol.isActive).length,
    [protocols]
  )

  const resetDialog = () => {
    setCurrentProtocol(null)
    setFormState(defaultFormState)
    setFormError(null)
    setDialogOpen(false)
  }

  const openCreateDialog = () => {
    setCurrentProtocol(null)
    setFormState(defaultFormState)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (protocol: MaintenanceProtocolTemplate) => {
    setCurrentProtocol(protocol)
    setFormState(toFormState(protocol))
    setFormError(null)
    setDialogOpen(true)
  }

  const updateTool = (
    index: number,
    field: keyof MaintenanceTechnicalReportTool,
    value: string | null
  ) => {
    setFormState((prev) => ({
      ...prev,
      tools: prev.tools.map((tool, idx) =>
        idx === index ? { ...tool, [field]: value } : tool
      )
    }))
  }

  const updateTest = (
    index: number,
    field: keyof MaintenanceTechnicalReportTest,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      tests: prev.tests.map((test, idx) =>
        idx === index ? { ...test, [field]: value } : test
      )
    }))
  }

  const buildPayload = (): MaintenanceProtocolTemplateRequest => ({
    name: formState.name.trim(),
    code: formState.code.trim(),
    description: formState.description.trim() || null,
    appliesTo: formState.appliesToText
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    riskClass: formState.riskClass.trim() || null,
    recommendations: formState.recommendations.trim() || null,
    sortOrder: Number(formState.sortOrder) || 0,
    isActive: formState.isActive,
    tools: formState.tools
      .map((tool) => ({
        name: tool.name.trim(),
        serial: tool.serial?.trim() || null,
        calibrationDue: tool.calibrationDue || null,
        internalCode: tool.internalCode?.trim() || null,
        location: tool.location?.trim() || null
      }))
      .filter((tool) => tool.name),
    tests: formState.tests
      .map((test) => ({
        parameter: test.parameter.trim(),
        result: (test.result || 'PASA').trim().toUpperCase(),
        value: test.value?.trim() || '',
        notes: test.notes?.trim() || ''
      }))
      .filter((test) => test.parameter)
  })

  const handleSave = async () => {
    const payload = buildPayload()

    if (!payload.name) {
      setFormError('El nombre del protocolo es obligatorio.')
      return
    }

    if (!payload.code) {
      setFormError('El código del protocolo es obligatorio.')
      return
    }

    try {
      if (currentProtocol) {
        await updateProtocolMutation.mutateAsync({
          id: currentProtocol.id,
          data: payload
        })
      } else {
        await createProtocolMutation.mutateAsync(payload)
      }
      resetDialog()
    } catch (error: any) {
      setFormError(
        error?.response?.data?.error ||
          error?.message ||
          'No se pudo guardar el protocolo.'
      )
    }
  }

  const handleDelete = async (protocol: MaintenanceProtocolTemplate) => {
    const confirmed = window.confirm(
      `¿Eliminar el protocolo "${protocol.name}"?`
    )

    if (!confirmed) return

    try {
      await deleteProtocolMutation.mutateAsync(protocol.id)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent='space-between'
          spacing={2}
        >
          <Stack direction='row' spacing={2} alignItems='center'>
            <IconButton onClick={() => navigate('/maintenance')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 800 }}>
                Protocolos de Mantenimiento
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Catálogo editable de protocolos para el reporte técnico.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Nuevo protocolo
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...surfaceSx, p: 2.5 }}>
            <Typography variant='overline' color='text.secondary'>
              Total protocolos
            </Typography>
            <Typography variant='h4' sx={{ fontWeight: 800 }}>
              {protocols.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...surfaceSx, p: 2.5 }}>
            <Typography variant='overline' color='text.secondary'>
              Activos
            </Typography>
            <Typography variant='h4' sx={{ fontWeight: 800 }}>
              {activeCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...surfaceSx, p: 2.5 }}>
            <Typography variant='overline' color='text.secondary'>
              Uso esperado
            </Typography>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              Disponibles como presets del reporte técnico
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {isLoading ? (
        <Alert severity='info'>Cargando protocolos...</Alert>
      ) : protocols.length === 0 ? (
        <Alert severity='warning'>
          No hay protocolos registrados. Puedes crear el primero desde aquí.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {protocols.map((protocol) => (
            <Grid item xs={12} md={6} lg={4} key={protocol.id}>
              <Paper sx={{ ...surfaceSx, p: 2.5, height: '100%' }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  spacing={1}
                >
                  <Box>
                    <Typography variant='h6' sx={{ fontWeight: 700 }}>
                      {protocol.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {protocol.code}
                    </Typography>
                  </Box>
                  <Chip
                    size='small'
                    color={protocol.isActive ? 'success' : 'default'}
                    label={protocol.isActive ? 'Activo' : 'Inactivo'}
                  />
                </Stack>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 1.5, minHeight: 42 }}
                >
                  {protocol.description || 'Sin descripción registrada.'}
                </Typography>

                <Stack
                  direction='row'
                  spacing={1}
                  flexWrap='wrap'
                  sx={{ mt: 1.5 }}
                >
                  {protocol.riskClass && (
                    <Chip
                      size='small'
                      variant='outlined'
                      label={protocol.riskClass}
                    />
                  )}
                  <Chip
                    size='small'
                    variant='outlined'
                    label={`${protocol.tools.length} herramienta(s)`}
                  />
                  <Chip
                    size='small'
                    variant='outlined'
                    label={`${protocol.tests.length} prueba(s)`}
                  />
                </Stack>

                <Box sx={{ mt: 1.5 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Aplica a:
                  </Typography>
                  <Stack
                    direction='row'
                    spacing={1}
                    flexWrap='wrap'
                    sx={{ mt: 0.75 }}
                  >
                    {protocol.appliesTo.length ? (
                      protocol.appliesTo.map((keyword) => (
                        <Chip
                          key={`${protocol.id}-${keyword}`}
                          size='small'
                          label={keyword}
                        />
                      ))
                    ) : (
                      <Chip size='small' label='Sin keywords' />
                    )}
                  </Stack>
                </Box>

                <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
                  <Button
                    size='small'
                    startIcon={<EditOutlined />}
                    onClick={() => openEditDialog(protocol)}
                  >
                    Editar
                  </Button>
                  <Button
                    size='small'
                    color='error'
                    startIcon={<DeleteOutline />}
                    onClick={() => handleDelete(protocol)}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={resetDialog} fullWidth maxWidth='lg'>
        <DialogTitle>
          {currentProtocol ? 'Editar protocolo' : 'Nuevo protocolo'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity='error'>{formError}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label='Nombre'
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Código'
                  value={formState.code}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type='number'
                  label='Orden'
                  value={formState.sortOrder}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      sortOrder: Number(e.target.value) || 0
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formState.isActive}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          isActive: e.target.checked
                        }))
                      }
                    />
                  }
                  label='Activo'
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label='Descripción'
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Clase de riesgo'
                  value={formState.riskClass}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      riskClass: e.target.value
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label='Aplica a'
                  helperText='Separa keywords por coma. Ej: monitor, signos vitales, spo2'
                  value={formState.appliesToText}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      appliesToText: e.target.value
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label='Recomendaciones por defecto'
                  value={formState.recommendations}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      recommendations: e.target.value
                    }))
                  }
                />
              </Grid>
            </Grid>

            <Paper variant='outlined' sx={{ p: 2 }}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                sx={{ mb: 2 }}
              >
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Herramientas por defecto
                </Typography>
                <Button
                  size='small'
                  startIcon={<Add />}
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      tools: [...prev.tools, emptyTool()]
                    }))
                  }
                >
                  Herramienta
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {formState.tools.map((tool, index) => (
                  <Grid container spacing={1} key={`protocol-tool-${index}`}>
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
                          updateTool(index, 'name', value)
                        }}
                        onChange={(_, value) => {
                          if (!value || typeof value === 'string') return

                          updateTool(index, 'name', value.equipmentName)
                          updateTool(index, 'serial', value.serialNumber || '')
                          updateTool(
                            index,
                            'internalCode',
                            value.internalCode || ''
                          )
                          updateTool(index, 'location', value.location || '')
                          updateTool(
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
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label='Serie'
                        value={tool.serial || ''}
                        onChange={(e) =>
                          updateTool(index, 'serial', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type='date'
                        label='Calibración vence'
                        InputLabelProps={{ shrink: true }}
                        value={tool.calibrationDue || ''}
                        onChange={(e) =>
                          updateTool(
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
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Ubicación: {tool.location}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    )}
                    <Grid item xs={12} md={1}>
                      <IconButton
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            tools:
                              prev.tools.length > 1
                                ? prev.tools.filter((_, idx) => idx !== index)
                                : [emptyTool()]
                          }))
                        }
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Paper>

            <Paper variant='outlined' sx={{ p: 2 }}>
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                sx={{ mb: 2 }}
              >
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                  Pruebas por defecto
                </Typography>
                <Button
                  size='small'
                  startIcon={<PlaylistAddCheck />}
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      tests: [...prev.tests, emptyTest()]
                    }))
                  }
                >
                  Prueba
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {formState.tests.map((test, index) => (
                  <Grid container spacing={1} key={`protocol-test-${index}`}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label='Parámetro'
                        value={test.parameter}
                        onChange={(e) =>
                          updateTest(index, 'parameter', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        select
                        fullWidth
                        label='Resultado'
                        value={test.result}
                        onChange={(e) =>
                          updateTest(index, 'result', e.target.value)
                        }
                      >
                        <MenuItem value='PASA'>PASA</MenuItem>
                        <MenuItem value='NO PASA'>NO PASA</MenuItem>
                        <MenuItem value='OBSERVADO'>OBSERVADO</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label='Valor'
                        value={test.value || ''}
                        onChange={(e) =>
                          updateTest(index, 'value', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label='Notas'
                        value={test.notes || ''}
                        onChange={(e) =>
                          updateTest(index, 'notes', e.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            tests:
                              prev.tests.length > 1
                                ? prev.tests.filter((_, idx) => idx !== index)
                                : [emptyTest()]
                          }))
                        }
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetDialog}>Cancelar</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={
              createProtocolMutation.isLoading ||
              updateProtocolMutation.isLoading
            }
          >
            {currentProtocol ? 'Guardar cambios' : 'Crear protocolo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MaintenanceProtocols
