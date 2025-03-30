import React, { useState } from 'react'
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Alarm as AlarmIcon,
  History as HistoryIcon
} from '@mui/icons-material'

import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { DeviceAlarm } from '../../DeviceIotMap/types'
import { AlarmSeverity } from '../../DeviceIotMap/constants'
import useAxiosPrivate from '@utils/use-axios-private'
import DeviceAlarmDialog from './DeviceAlarmDialog'

interface DeviceAlarmsPanelProps {
  deviceId: number
}

const DeviceAlarmsPanel: React.FC<DeviceAlarmsPanelProps> = ({ deviceId }) => {
  const axiosPrivate = useAxiosPrivate()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAlarm, setEditingAlarm] = useState<DeviceAlarm | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const queryClient = useQueryClient()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const {
    data: alarms = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/devicesIot', deviceId, 'alarms'],
    queryFn: async () => {
      if (!deviceId) return []
      const response = await axiosPrivate.get(`/devicesIot/${deviceId}/alarms`)

      return response.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (alarmId: number) => {
      const response = await fetch(`/api/alarms/${alarmId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Error deleting alarm')
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/devicesIot', deviceId, 'alarms']
      })
    }
  })

  const handleAddAlarm = () => {
    setEditingAlarm(null)
    setOpenDialog(true)
  }

  const handleEditAlarm = (alarm: DeviceAlarm) => {
    setEditingAlarm(alarm)
    setOpenDialog(true)
  }

  const handleDeleteAlarm = (alarmId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta alarma?')) {
      deleteMutation.mutate(alarmId)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAlarm(null)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case AlarmSeverity.INFO:
        return 'info'
      case AlarmSeverity.WARNING:
        return 'warning'
      case AlarmSeverity.CRITICAL:
        return 'error'
      default:
        return 'default'
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'temperature':
        return 'Temperatura'
      case 'humidity':
        return 'Humedad'
      case 'battery':
        return 'Batería'
      default:
        return metric
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'above':
        return '>'
      case 'below':
        return '<'
      case 'equal':
        return '='
      default:
        return condition
    }
  }

  if (isLoading) {
    return <Typography>Cargando alarmas...</Typography>
  }

  if (error) {
    return <Typography color='error'>Error al cargar las alarmas.</Typography>
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h6' component='div'>
          Gestión de Alarmas
        </Typography>
        <Button
          variant='contained'
          size='small'
          startIcon={<AddIcon />}
          onClick={handleAddAlarm}
        >
          Agregar Alarma
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='fullWidth'
          aria-label='alarm tabs'
        >
          <Tab
            icon={<AlarmIcon />}
            label='Configuración'
            id='alarm-tab-0'
            aria-controls='alarm-tabpanel-0'
          />
          <Tab
            icon={<HistoryIcon />}
            label='Historial de Eventos'
            id='alarm-tab-1'
            aria-controls='alarm-tabpanel-1'
          />
        </Tabs>
      </Box>

      <div
        role='tabpanel'
        hidden={tabValue !== 0}
        id='alarm-tabpanel-0'
        aria-labelledby='alarm-tab-0'
      >
        {tabValue === 0 && (
          <>
            {alarms.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                No hay alarmas configuradas para este dispositivo.
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                variant='outlined'
              >
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Métrica</TableCell>
                      <TableCell>Condición</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Severidad</TableCell>
                      <TableCell>Última activación</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alarms.map((alarm: DeviceAlarm) => (
                      <TableRow key={alarm.id}>
                        <TableCell>{alarm.name}</TableCell>
                        <TableCell>{getMetricLabel(alarm.metric)}</TableCell>
                        <TableCell>
                          {getConditionLabel(alarm.condition)} {alarm.threshold}
                        </TableCell>
                        <TableCell>
                          {alarm.enabled ? (
                            <Chip
                              size='small'
                              label={alarm.active ? 'Activa' : 'Inactiva'}
                              color={alarm.active ? 'success' : 'default'}
                            />
                          ) : (
                            <Chip
                              size='small'
                              label='Deshabilitada'
                              color='default'
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={alarm.severity}
                            color={getSeverityColor(alarm.severity)}
                          />
                        </TableCell>
                        <TableCell>
                          {alarm.lastTriggered ? (
                            <Tooltip
                              title={format(
                                new Date(alarm.lastTriggered),
                                'dd/MM/yyyy HH:mm:ss'
                              )}
                            >
                              <Box
                                sx={{ display: 'flex', alignItems: 'center' }}
                              >
                                <WarningIcon
                                  fontSize='small'
                                  color='warning'
                                  sx={{ mr: 1 }}
                                />
                                {format(
                                  new Date(alarm.lastTriggered),
                                  'dd/MM/yyyy'
                                )}
                              </Box>
                            </Tooltip>
                          ) : (
                            'Nunca'
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size='small'
                            onClick={() => handleEditAlarm(alarm)}
                            aria-label='editar'
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteAlarm(alarm.id)}
                            aria-label='eliminar'
                            color='error'
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </div>

      {/* <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="alarm-tabpanel-1"
        aria-labelledby="alarm-tab-1"
      >
        {tabValue === 1 && (
          <DeviceAlarmEventsTable deviceId={deviceId} />
        )}
      </div> */}

      <DeviceAlarmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        deviceId={deviceId}
        alarm={editingAlarm}
      />
    </Box>
  )
}

export default DeviceAlarmsPanel
