import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material'
//import ClientDeviceAssignment from "./ClientDeviceAssignment";
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from 'react-query'

import useAxiosPrivate from '@utils/use-axios-private'
import { DeviceIot } from '../types'
import { Link } from 'react-router-dom'
import { CustomerData } from 'src/Components/TableCustomers'
import ClientDeviceAssignment from './ClientDeviceAssignment'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import EmailNotificationSettings from '../emails/EmailNotificationSettings'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'

const CustomersManagement: React.FC = () => {
  const queryClient = useQueryClient()
  const axiosPrivate = useAxiosPrivate()
  const MySwal = withReactContent(Swal)

  // Estado para mostrar detalles del cliente
  const [selectedClient, setSelectedClient] = useState<CustomerData | null>(
    null
  )
  const [tabValue, setTabValue] = useState(0)

  // Consulta para obtener todos los clientes
  const {
    data: clients,
    isLoading,
    error
  } = useQuery<CustomerData[]>({
    queryKey: ['/customers/available-modules'],
    queryFn: async () => {
      const response = await axiosPrivate('/customers/available-modules')

      return response.data
    }
  })

  // Consulta para obtener todos los dispositivos
  const { data: allDevices, isLoading: isLoadingDevices } = useQuery<
    DeviceIot[]
  >({
    queryKey: ['/devicesIot/without-customer'],
    queryFn: async () => {
      const response = await axiosPrivate.get('/devicesIot/without-customer')

      return response.data
    },
    enabled: !!selectedClient // Solo carga cuando hay un cliente seleccionado
  })

  // Consulta para obtener los dispositivos de un cliente específico
  const { data: clientDevices, isLoading: isLoadingClientDevices } = useQuery<
    DeviceIot[]
  >({
    queryKey: ['/devicesIot/customer', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return []
      const response = await axiosPrivate.get(
        `/devicesIot/customer/${selectedClient.id}`
      )

      return response.data
    },
    enabled: !!selectedClient // Solo carga cuando hay un cliente seleccionado
  })

  // Mutación para actualizar el cliente de un dispositivo
  const updateDeviceClientMutation = useMutation({
    mutationFn: async ({
      deviceId,
      clientId
    }: {
      deviceId: number
      clientId: number | null
    }) => {
      return await axiosPrivate.put(`/devicesIot/${deviceId}`, {
        customerId: clientId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/devicesIot/without-customer']
      })
      // Actualizar también la consulta específica para este cliente
      if (selectedClient) {
        queryClient.invalidateQueries({
          queryKey: ['/devicesIot/customer', selectedClient.id]
        })
      }
      MySwal.fire({
        title: <p>Dispositivo actualizado</p>,
        html: <span>El dispositivo se ha asignado correctamente</span>,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      })
    },
    onError: (error) => {
      console.error('Error al actualizar el cliente del dispositivo:', error)
      MySwal.fire({
        title: <p>Error</p>,
        html: <span>No se pudo asignar el dispositivo al cliente</span>,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      })
    }
  })

  // Función para manejar la selección de un cliente para ver sus detalles
  const handleSelectClient = (client: CustomerData) => {
    setSelectedClient(client)
    setTabValue(0) // Reset a la primera pestaña
  }

  // Función para manejar el cambio de pestaña en la vista de cliente
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Función para asignar un dispositivo a un cliente
  const handleAssignDevice = (deviceId: number, clientId: number | null) => {
    console.log('🚀 ~ handleAssignDevice ~ clientId:', clientId)
    console.log('🚀 ~ handleAssignDevice ~ deviceId:', deviceId)
    updateDeviceClientMutation.mutate({ deviceId, clientId })
  }

  // Función para cerrar el diálogo de asignación de dispositivo

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Gestión de Clientes'
        subtitle='Administra los clientes y sus dispositivos IoT'
        icon={<BusinessIcon />}
        actions={
          <Link to='/iot/map'>
            <Button variant='outlined' sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
              Volver al mapa
            </Button>
          </Link>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Clientes con IoT' value={clients?.length ?? 0} icon={<BusinessIcon />} tone='teal' />
        </Grid>
      </Grid>

      {/* Lista de clientes */}
      <Box sx={{ mb: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            Error al cargar los clientes. Por favor, intenta de nuevo.
          </Alert>
        ) : clients && clients.length > 0 ? (
          <Grid container spacing={3}>
            {clients.map((client) => (
              <Grid item xs={12} sm={6} md={4} key={client.id}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BusinessIcon color='primary' sx={{ mr: 1 }} />
                      <Typography variant='h6' component='h2'>
                        {client.nombre}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <EmailIcon
                          fontSize='small'
                          sx={{ color: 'text.secondary', mr: 1 }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {client.email}
                        </Typography>
                      </Box>
                      {client.telefono && (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <PhoneIcon
                            fontSize='small'
                            sx={{ color: 'text.secondary', mr: 1 }}
                          />
                          <Typography variant='body2' color='text.secondary'>
                            {client.telefono}
                          </Typography>
                        </Box>
                      )}
                      {client.direccion && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon
                            fontSize='small'
                            sx={{ color: 'text.secondary', mr: 1 }}
                          />
                          <Typography variant='body2' color='text.secondary'>
                            {client.direccion}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button
                      variant='outlined'
                      size='small'
                      color='primary'
                      onClick={() => handleSelectClient(client)}
                    >
                      Ver Detalles
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='body1' color='text.secondary'>
              No hay clientes registrados. Crea tu primer cliente haciendo clic
              en "Nuevo Cliente".
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Vista detallada de cliente */}
      {selectedClient && (
        <Dialog
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BusinessIcon color='primary' sx={{ mr: 1 }} />
              <Typography variant='h6'>{selectedClient.nombre}</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label='client tabs'
              >
                <Tab label='Información del Cliente' />
                <Tab label='Dispositivos Asignados' />
                <Tab label='Notificaciones por Correo' />
              </Tabs>
            </Box>

            {/* Información del Cliente */}
            {tabValue === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant='subtitle1' fontWeight='bold' gutterBottom>
                  Información de Contacto
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon
                        fontSize='small'
                        sx={{ mr: 1, color: 'primary.main' }}
                      />
                      <Typography variant='body1'>
                        {selectedClient.email}
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedClient.telefono && (
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <PhoneIcon
                          fontSize='small'
                          sx={{ mr: 1, color: 'primary.main' }}
                        />
                        <Typography variant='body1'>
                          {selectedClient.telefono}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {selectedClient.direccion && (
                    <Grid item xs={12}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <LocationIcon
                          fontSize='small'
                          sx={{ mr: 1, color: 'primary.main' }}
                        />
                        <Typography variant='body1'>
                          {selectedClient.direccion}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Dispositivos Asignados */}
            {tabValue === 1 && (
              <Box sx={{ p: 2 }}>
                {selectedClient && (
                  <ClientDeviceAssignment
                    client={selectedClient}
                    clientDevices={clientDevices}
                    allDevices={allDevices}
                    isLoadingDevices={isLoadingDevices}
                    isLoadingClientDevices={isLoadingClientDevices}
                    onAssignDevice={handleAssignDevice}
                  />
                )}
              </Box>
            )}
            {tabValue === 2 && (
              <>
                <EmailNotificationSettings customerId={selectedClient.id} />
                <Paper sx={{ p: 3, mt: 4 }}>
                  <Typography variant='h6' gutterBottom>
                    Acerca de las notificaciones por correo
                  </Typography>

                  <Typography variant='body2' color='text.secondary' paragraph>
                    El sistema de notificaciones envía correos electrónicos
                    automáticos cuando se activan o desactivan alarmas en los
                    dispositivos monitoreados. Estos correos contienen
                    información detallada sobre la condición que activó la
                    alarma, su severidad y otros datos relevantes.
                  </Typography>

                  <Typography variant='body2' color='text.secondary' paragraph>
                    Características del sistema de notificaciones:
                  </Typography>

                  <ul>
                    <li>
                      <Typography variant='body2' color='text.secondary'>
                        Notifica activación y desactivación de alarmas
                      </Typography>
                    </li>
                    <li>
                      <Typography variant='body2' color='text.secondary'>
                        Incluye detalles como el nombre del dispositivo,
                        métrica, umbral y severidad
                      </Typography>
                    </li>
                    <li>
                      <Typography variant='body2' color='text.secondary'>
                        En las notificaciones de desactivación, incluye el
                        tiempo que la alarma estuvo activa
                      </Typography>
                    </li>
                    <li>
                      <Typography variant='body2' color='text.secondary'>
                        Diseño visual que destaca la severidad mediante colores
                      </Typography>
                    </li>
                  </ul>
                </Paper>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedClient(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  )
}

export default CustomersManagement
