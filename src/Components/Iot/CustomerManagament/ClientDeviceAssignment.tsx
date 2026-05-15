import React, { useState } from 'react'

import {
  Box,
  Typography,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandLess,
  ExpandMore,
  Search,
  Sensors as SensorsIcon
} from '@mui/icons-material'
import { DeviceIot } from '../types'
import { CustomerData } from 'src/Components/TableCustomers'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'

interface ClientDeviceAssignmentProps {
  client: CustomerData
  clientDevices: DeviceIot[] | undefined
  allDevices: DeviceIot[] | undefined
  isLoadingDevices: boolean
  isLoadingClientDevices: boolean
  onAssignDevice: (deviceId: number, clientId: number | null) => void
}

const ClientDeviceAssignment: React.FC<ClientDeviceAssignmentProps> = ({
  client,
  clientDevices,
  allDevices,
  isLoadingDevices,
  isLoadingClientDevices,
  onAssignDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [openAssigned, setOpenAssigned] = useState(true)
  const [openAvailable, setOpenAvailable] = useState(true)

  const filteredClientDevices =
    clientDevices?.filter((device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const filteredAllDevices =
    allDevices?.filter(
      (device) =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!device.customerId || device.customerId !== client.id)
    ) || []

  const Row = ({
    index,
    style,
    data
  }: ListChildComponentProps & { data: DeviceIot[] }) => {
    const device = data[index]

    const isAssigned = data === filteredClientDevices

    return (
      <ListItem
        style={style}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
        secondaryAction={
          isAssigned ? (
            <Button
              variant='outlined'
              color='error'
              size='small'
              startIcon={<DeleteIcon />}
              onClick={() => onAssignDevice(Number(device.id), null)}
            >
              Desasignar
            </Button>
          ) : (
            <Button
              variant='contained'
              color='success'
              size='small'
              startIcon={<AddIcon />}
              onClick={() =>
                onAssignDevice(Number(device.id), Number(client.id))
              }
            >
              Asignar
            </Button>
          )
        }
      >
        <ListItemIcon>
          <SensorsIcon color={device.isOnline ? 'success' : 'error'} />
        </ListItemIcon>
        <ListItemText
          primary={<Typography fontWeight='bold'>{device.name}</Typography>}
          secondary={
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant='body2' component='div' sx={{ mr: 1 }}>
                  Estado:
                </Typography>
                {device.isOnline ? (
                  <Chip size='small' color='success' label='En línea' />
                ) : (
                  <Chip size='small' color='error' label='Desconectado' />
                )}
              </Box>
              {!isAssigned && device.customerId && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 0.5 }}
                >
                  Asignado a otro cliente
                </Typography>
              )}
            </>
          }
        />
      </ListItem>
    )
  }

  return (
    <>
      {/* Dispositivos asignados al cliente */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant='outlined'
          placeholder='Buscar dispositivo por nombre...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ mb: 3 }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.3s',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'primary.dark' },
            p: 1,
            borderRadius: 1,
            backgroundColor: 'primary.main', // Mover el fondo aquí
            width: '100%' // Añadir ancho completo
          }}
          onClick={() => setOpenAssigned(!openAssigned)}
        >
          <Typography
            variant='h6'
            fontWeight='bold'
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.contrastText',
              flexGrow: 1 // Hacer que el texto ocupe el espacio disponible
            }}
          >
            Dispositivos Asignados a {client.nombre}
          </Typography>
          <IconButton size='small'>
            {openAssigned ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={openAssigned} timeout='auto' unmountOnExit>
          {isLoadingClientDevices ? (
            <CircularProgress />
          ) : filteredClientDevices.length > 0 ? (
            <List
              height={400}
              width='100%'
              itemSize={70}
              itemCount={filteredClientDevices.length}
              itemData={filteredClientDevices}
            >
              {Row}
            </List>
          ) : (
            <Alert severity='info'>No se encontraron dispositivos</Alert>
          )}
        </Collapse>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Dispositivos sin asignar o de otros clientes */}
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.3s',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'primary.dark' },
            p: 1,
            borderRadius: 1,
            backgroundColor: 'primary.main', // Mover el fondo aquí
            width: '100%'
          }}
          onClick={() => setOpenAvailable(!openAvailable)}
        >
          <Typography
            variant='h6'
            fontWeight='bold'
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.contrastText',
              flexGrow: 1 // Hacer que el texto ocupe el espacio disponible
            }}
          >
            Asignar Nuevos Dispositivos
          </Typography>
          <IconButton size='small' sx={{ color: 'primary.contrastText' }}>
            {openAvailable ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={openAvailable} timeout='auto' unmountOnExit>
          {isLoadingDevices ? (
            <CircularProgress />
          ) : filteredAllDevices.length > 0 ? (
            <List
              height={400}
              width='100%'
              itemSize={70}
              itemCount={filteredAllDevices.length}
              itemData={filteredAllDevices}
            >
              {Row}
            </List>
          ) : (
            <Alert severity='info'>No hay dispositivos disponibles</Alert>
          )}
        </Collapse>
      </Box>
    </>
  )
}

export default ClientDeviceAssignment
