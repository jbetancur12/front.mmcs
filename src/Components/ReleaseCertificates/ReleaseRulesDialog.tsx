import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  CheckRounded,
  CloseRounded,
  DeleteOutline,
  EditOutlined
} from '@mui/icons-material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import {
  ReleaseRule,
  ReleaseRuleType,
  useReleaseCatalogs,
  useReleaseRules,
  useRuleActions
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

interface TabConfig {
  type: ReleaseRuleType
  label: string
  help: string
  /** Se puede agregar y borrar (las etiquetas de campo solo se editan). */
  editableList: boolean
  patternsLabel: string
}

const TABS: TabConfig[] = [
  {
    type: 'instrument_device',
    label: 'Equivalencias',
    help: 'Qué tipo de equipo corresponde al instrumento que dice el PDF. Se llena sola cuando liberas con «Recordar», y aquí la puedes corregir.',
    editableList: true,
    patternsLabel: 'Instrumento tal como sale en el PDF'
  },
  {
    type: 'document_type',
    label: 'Tipos de documento',
    help: 'Frases del título que identifican el tipo de documento y si se trata como principal, anexo o de tercero.',
    editableList: true,
    patternsLabel: 'Frases del título'
  },
  {
    type: 'magnitude_prefix',
    label: 'Magnitud por prefijo',
    help: 'Magnitud de respaldo según el prefijo del número (BIO, M, P…), cuando el PDF no trae «Magnitud».',
    editableList: true,
    patternsLabel: ''
  },
  {
    type: 'field_label',
    label: 'Etiquetas de campo',
    help: 'Palabras que el sistema busca en el PDF antes de los dos puntos para leer cada campo. Se escriben sin tildes ni mayúsculas.',
    editableList: false,
    patternsLabel: 'Etiquetas'
  }
]

const FIELD_LABELS: Record<string, string> = {
  magnitud: 'Magnitud',
  instrumento: 'Instrumento',
  fabricante: 'Fabricante',
  modelo: 'Modelo',
  serie: 'Serie',
  ubicacion: 'Ubicación',
  rango: 'Rango de medida',
  resolucion: 'Resolución',
  codigo_interno: 'Código interno (activo fijo)',
  solicitante: 'Cliente (solicitante)',
  direccion: 'Dirección del cliente',
  f_calibracion: 'Fecha de calibración',
  f_emision: 'Fecha de emisión',
  f_recepcion: 'Fecha de recepción'
}

const KIND_LABELS: Record<string, string> = {
  principal: 'Principal',
  anexo: 'Anexo',
  tercero: 'De tercero'
}

const splitPhrases = (text: string) =>
  text
    .split(/[\n;]/)
    .map((part) => part.trim())
    .filter(Boolean)

interface ReleaseRulesDialogProps {
  open: boolean
  onClose: () => void
}

/** Reglas de lectura de PDF como datos: se editan sin pedir un cambio de programa. */
const ReleaseRulesDialog: React.FC<ReleaseRulesDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { data: rules, isLoading } = useReleaseRules(open)
  const { data: catalogs } = useReleaseCatalogs(open)
  const actions = useRuleActions()
  const [tab, setTab] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftPatterns, setDraftPatterns] = useState('')
  const [draftValue, setDraftValue] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newPatterns, setNewPatterns] = useState('')
  const [newValue, setNewValue] = useState('principal')

  const config = TABS[tab]
  const deviceNames = useMemo(
    () => new Map((catalogs?.devices ?? []).map((d) => [String(d.id), d.name])),
    [catalogs]
  )
  const visible = (rules ?? []).filter((rule) => rule.ruleType === config.type)

  const fail = (message: string) => (error: unknown) =>
    notify.error(message, getApiErrorReason(error) ?? undefined)

  const keyLabel = (rule: ReleaseRule) =>
    rule.ruleType === 'field_label'
      ? FIELD_LABELS[rule.key] ?? rule.key
      : rule.ruleType === 'instrument_device'
        ? deviceNames.get(rule.key) ?? `Tipo de equipo ${rule.key}`
        : rule.ruleType === 'document_type'
          ? rule.key.replace(/_/g, ' ').toLowerCase()
          : rule.key

  const startEdit = (rule: ReleaseRule) => {
    setEditingId(rule.id)
    setDraftPatterns(rule.patterns.join('\n'))
    setDraftValue(rule.value ?? '')
  }

  const saveEdit = (rule: ReleaseRule) =>
    actions.update.mutate(
      {
        id: rule.id,
        patterns:
          rule.ruleType === 'magnitude_prefix'
            ? undefined
            : splitPhrases(draftPatterns),
        value: rule.ruleType === 'field_label' ? undefined : draftValue
      },
      {
        onSuccess: () => {
          setEditingId(null)
          notify.success('Regla guardada')
        },
        onError: fail('No se pudo guardar la regla')
      }
    )

  const toggle = (rule: ReleaseRule) =>
    actions.update.mutate(
      { id: rule.id, active: !rule.active },
      { onError: fail('No se pudo cambiar la regla') }
    )

  const remove = (rule: ReleaseRule) =>
    actions.remove.mutate(rule.id, {
      onSuccess: () => notify.success('Regla eliminada'),
      onError: fail('No se pudo eliminar la regla')
    })

  const add = () =>
    actions.create.mutate(
      {
        ruleType: config.type,
        key: newKey,
        patterns: splitPhrases(newPatterns),
        value: config.type === 'document_type' ? newValue : newValue || null
      },
      {
        onSuccess: () => {
          setNewKey('')
          setNewPatterns('')
          notify.success('Regla agregada')
        },
        onError: fail('No se pudo agregar la regla')
      }
    )

  const canAdd =
    newKey.trim() !== '' &&
    (config.type === 'magnitude_prefix'
      ? newValue.trim() !== ''
      : splitPhrases(newPatterns).length > 0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      fullScreen={fullScreen}
    >
      <DialogTitle>Reglas de lectura de certificados</DialogTitle>
      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_event, value: number) => {
            setTab(value)
            setEditingId(null)
            setNewKey('')
            setNewPatterns('')
            setNewValue(TABS[value].type === 'document_type' ? 'principal' : '')
          }}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            mb: 2,
            '& .MuiTabs-indicator': { backgroundColor: '#00BFA5' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
          }}
        >
          {TABS.map((item) => (
            <Tab key={item.type} label={item.label} />
          ))}
        </Tabs>
        <Alert severity='info' sx={{ mb: 2 }}>
          {config.help} Los cambios rigen desde el próximo certificado que se
          cargue.
        </Alert>

        {config.editableList && (
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              mb: 2
            }}
          >
            {config.type === 'instrument_device' ? (
              <TextField
                select
                size='small'
                label='Tipo de equipo'
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                sx={{ minWidth: 220, flex: 1 }}
              >
                {(catalogs?.devices ?? []).map((device) => (
                  <MenuItem key={device.id} value={String(device.id)}>
                    {device.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                size='small'
                label={
                  config.type === 'magnitude_prefix'
                    ? 'Prefijo (BIO, M, P…)'
                    : 'Nombre (VERIFICACION…)'
                }
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                sx={{ width: 190 }}
              />
            )}
            {config.type !== 'magnitude_prefix' && (
              <TextField
                size='small'
                multiline
                label={`${config.patternsLabel} (una por línea)`}
                value={newPatterns}
                onChange={(event) => setNewPatterns(event.target.value)}
                sx={{ minWidth: 220, flex: 2 }}
              />
            )}
            {config.type === 'document_type' ? (
              <TextField
                select
                size='small'
                label='Se trata como'
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                sx={{ width: 150 }}
              >
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            ) : config.type === 'magnitude_prefix' ? (
              <TextField
                size='small'
                label='Magnitud'
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                sx={{ minWidth: 200, flex: 1 }}
              />
            ) : null}
            <Button
              variant='contained'
              disabled={!canAdd || actions.create.isLoading}
              onClick={add}
              sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
            >
              Agregar
            </Button>
          </Box>
        )}

        {isLoading ? (
          <SignalLoader message='Cargando reglas' />
        ) : visible.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            Aún no hay reglas de este tipo.
          </Typography>
        ) : (
          visible.map((rule) => {
            const editing = editingId === rule.id
            return (
              <Box
                key={rule.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  py: 1.25,
                  borderBottom: '1px solid #e5e7eb',
                  opacity: rule.active ? 1 : 0.55
                }}
              >
                <Box sx={{ width: { xs: '100%', sm: 190 }, flexShrink: 0 }}>
                  <Typography variant='body2' fontWeight={600}>
                    {keyLabel(rule)}
                  </Typography>
                  {rule.ruleType === 'document_type' && !editing && (
                    <Typography variant='caption' color='text.secondary'>
                      {KIND_LABELS[rule.value ?? ''] ?? rule.value}
                    </Typography>
                  )}
                  {rule.ruleType === 'magnitude_prefix' && !editing && (
                    <Typography variant='caption' color='text.secondary'>
                      {rule.value}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  {editing ? (
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {rule.ruleType !== 'magnitude_prefix' && (
                        <TextField
                          size='small'
                          multiline
                          fullWidth
                          label={`${config.patternsLabel} (una por línea)`}
                          value={draftPatterns}
                          onChange={(event) =>
                            setDraftPatterns(event.target.value)
                          }
                        />
                      )}
                      {rule.ruleType === 'document_type' && (
                        <TextField
                          select
                          size='small'
                          label='Se trata como'
                          value={draftValue}
                          onChange={(event) =>
                            setDraftValue(event.target.value)
                          }
                        >
                          {Object.entries(KIND_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                      {rule.ruleType === 'magnitude_prefix' && (
                        <TextField
                          size='small'
                          label='Magnitud'
                          value={draftValue}
                          onChange={(event) =>
                            setDraftValue(event.target.value)
                          }
                        />
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {rule.patterns.map((pattern) => (
                        <Chip key={pattern} size='small' label={pattern} />
                      ))}
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  {editing ? (
                    <>
                      <Tooltip title='Guardar'>
                        <IconButton
                          aria-label={`Guardar ${keyLabel(rule)}`}
                          sx={{ color: '#00695C' }}
                          disabled={actions.update.isLoading}
                          onClick={() => saveEdit(rule)}
                        >
                          <CheckRounded />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Cancelar'>
                        <IconButton
                          aria-label='Cancelar edición'
                          onClick={() => setEditingId(null)}
                        >
                          <CloseRounded />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      {rule.ruleType !== 'field_label' && (
                        <Tooltip title={rule.active ? 'Activa' : 'Desactivada'}>
                          <Switch
                            size='small'
                            checked={rule.active}
                            onChange={() => toggle(rule)}
                            inputProps={{
                              'aria-label': `Regla ${keyLabel(rule)} activa`
                            }}
                          />
                        </Tooltip>
                      )}
                      <Tooltip title='Editar'>
                        <IconButton
                          aria-label={`Editar ${keyLabel(rule)}`}
                          sx={{ color: '#2563eb' }}
                          onClick={() => startEdit(rule)}
                        >
                          <EditOutlined fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {config.editableList && (
                        <Tooltip title='Eliminar'>
                          <IconButton
                            aria-label={`Eliminar ${keyLabel(rule)}`}
                            sx={{ color: '#b91c1c' }}
                            onClick={() => remove(rule)}
                          >
                            <DeleteOutline fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            )
          })
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseRulesDialog
