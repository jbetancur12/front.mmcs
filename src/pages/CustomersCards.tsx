import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Fade,
  Chip,
  Avatar
} from '@mui/material'
import {
  Search,
  Clear,
  Add,
  Business,
  Email,
  Phone,
  LocationOn,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer
} from 'src/hooks/customers/useCustomers'
import CustomerFormDialog from '../Components/CustomerFormDialog'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'
import { busyDialog } from 'src/utils/confirm'

export interface CustomerData {
  id?: number
  nombre: string
  identificacion: string
  direccion: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  pais: string
  isActive: boolean
  rol: string
}

const CustomersCards: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  )

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: customers = [], isLoading: loading } =
    useCustomers<CustomerData>(undefined, {
      onError: (error) => {
        console.error('Error fetching customer data:', error)
        notify.error('Error', 'No se pudieron cargar los clientes')
      }
    })
  const createCustomer = useCreateCustomer<CustomerData>()
  const updateCustomer = useUpdateCustomer<CustomerData>()
  const deleteCustomer = useDeleteCustomer()

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchTerm) return customers

    return customers.filter(
      (customer) =>
        (customer.nombre || '')
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (customer.identificacion || '').includes(debouncedSearchTerm) ||
        (customer.email || '')
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (customer.telefono || '').includes(debouncedSearchTerm) ||
        (customer.ciudad || '')
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())
    )
  }, [customers, debouncedSearchTerm])

  const highlightText = useCallback(
    (text: string | null | undefined, highlight: string) => {
      if (!highlight || !text) return text || ''

      const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
      return parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Box
            component='span'
            key={index}
            sx={{ bgcolor: 'yellow', fontWeight: 'bold' }}
          >
            {part}
          </Box>
        ) : (
          part
        )
      )
    },
    []
  )

  const clearSearch = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
  }

  const handleCreateCustomer = async (customerData: CustomerData) => {
    try {
      const updatedValues = { ...customerData }
      delete updatedValues.id

      const response = await createCustomer.mutateAsync(updatedValues)

      if (response.status >= 200 && response.status < 300) {
        notify.success(
          '¡Cliente Creado!',
          'El cliente ha sido creado exitosamente'
        )
        setCreateModalOpen(false)
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      notify.error(
        'Error',
        'No se pudo crear el cliente. Por favor intenta nuevamente.'
      )
    }
  }

  const handleEditCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }

  const handleUpdateCustomer = async (customerData: CustomerData) => {
    try {
      const response = await updateCustomer.mutateAsync({
        id: customerData.id as number,
        values: customerData
      })

      if (response.status >= 200 && response.status < 300) {
        notify.success(
          '¡Cliente Actualizado!',
          'El cliente ha sido actualizado exitosamente'
        )
        setEditModalOpen(false)
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      notify.error(
        'Error',
        'No se pudo actualizar el cliente. Por favor intenta nuevamente.'
      )
    }
  }

  const handleDeleteCustomer = async (customer: CustomerData) => {
    const result = await confirmDialog({
      title: '¿Eliminar cliente?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${customer.nombre}</p>
          <p><strong>Identificación:</strong> ${customer.identificacion}</p>
          <p style="color: #d32f2f; margin-top: 15px;">
            <strong>⚠️ Esta acción no se puede deshacer</strong>
          </p>
        </div>
      `,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    })

    if (!result.isConfirmed) return

    try {
      busyDialog.show('Eliminando...', 'Por favor espera mientras se elimina el cliente')

      const response = await deleteCustomer.mutateAsync(customer.id as number)

      if (response.status === 204) {
        notify.success(
          '¡Eliminado!',
          'El cliente ha sido eliminado correctamente'
        )
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)

      notify.error(
        'Error',
        'No se pudo eliminar el cliente. Por favor intenta nuevamente.'
      )
    } finally {
      busyDialog.hide()
    }
  }

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`)
  }

  const SkeletonCard = () => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant='circular' width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant='text' width='60%' />
            <Skeleton variant='text' width='40%' />
          </Box>
        </Box>
        <Skeleton variant='text' width='80%' />
        <Skeleton variant='text' width='70%' />
        <Skeleton variant='text' width='90%' />
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Skeleton variant='rectangular' width={80} height={32} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant='rectangular' width={40} height={32} />
          <Skeleton variant='rectangular' width={40} height={32} />
        </Box>
      </CardActions>
    </Card>
  )

  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center'
      }}
    >
      <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant='h6' color='text.secondary' gutterBottom>
        No hay clientes registrados
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        {debouncedSearchTerm
          ? `No se encontraron clientes que coincidan con "${debouncedSearchTerm}"`
          : 'Comienza creando el primer cliente'}
      </Typography>
      {debouncedSearchTerm && (
        <Button variant='outlined' onClick={clearSearch} sx={{ mb: 2 }}>
          Limpiar búsqueda
        </Button>
      )}
      {!debouncedSearchTerm && (
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setCreateModalOpen(true)}
          sx={{
            bgcolor: '#00BFA5',
            '&:hover': {
              bgcolor: '#00ACC1'
            }
          }}
        >
          Crear Primer Cliente
        </Button>
      )}
    </Box>
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {/* Header Section */}
      <Box component='header' sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant='h4' component='h1' fontWeight='bold'>
            Clientes - Vista Cards
          </Typography>
        </Box>

        {/* Search and Create Section */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <TextField
            label='Buscar clientes'
            variant='outlined'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            aria-label='Campo de búsqueda de clientes'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search color={isSearching ? 'primary' : 'inherit'} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={clearSearch}
                    edge='end'
                    aria-label='Limpiar búsqueda'
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
            helperText={
              isSearching
                ? 'Buscando...'
                : searchTerm && !isSearching
                  ? `${filteredCustomers.length} resultado(s) encontrado(s)`
                  : ''
            }
          />
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              minWidth: 200,
              bgcolor: '#00BFA5',
              '&:hover': {
                bgcolor: '#00ACC1'
              }
            }}
            aria-label='Crear nuevo cliente'
          >
            Crear Cliente
          </Button>
        </Box>

        {/* Results Count */}
        {!loading && customers.length > 0 && (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            {filteredCustomers.length} de {customers.length} clientes
          </Typography>
        )}
      </Box>{' '}
      {/* 
Content Area */}
      <Box component='main' role='main' aria-label='Lista de clientes'>
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState />
        ) : (
          <Grid container spacing={3}>
            {filteredCustomers.map((customer) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
                <Fade in timeout={300}>
                  <Card
                    elevation={2}
                    role='article'
                    aria-label={`Cliente: ${customer.nombre}`}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: '#00BFA5',
                            mr: 2,
                            width: 40,
                            height: 40
                          }}
                        >
                          <Business />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant='h6'
                            noWrap
                            sx={{ fontWeight: 600 }}
                          >
                            {highlightText(
                              customer.nombre,
                              debouncedSearchTerm
                            )}
                          </Typography>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            noWrap
                          >
                            ID:{' '}
                            {highlightText(
                              customer.identificacion,
                              debouncedSearchTerm
                            )}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Email
                          sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                        />
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          noWrap
                        >
                          {highlightText(customer.email, debouncedSearchTerm)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <Phone
                          sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {highlightText(
                            customer.telefono,
                            debouncedSearchTerm
                          )}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <LocationOn
                          sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                        />
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          noWrap
                        >
                          {highlightText(
                            `${customer.ciudad}, ${customer.departamento}`,
                            debouncedSearchTerm
                          )}
                        </Typography>
                      </Box>

                      <Chip
                        label={customer.isActive ? 'Activo' : 'Inactivo'}
                        size='small'
                        color={customer.isActive ? 'success' : 'default'}
                        variant='outlined'
                      />
                    </CardContent>

                    <CardActions
                      sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}
                    >
                      <Button
                        size='small'
                        variant='contained'
                        startIcon={<Visibility />}
                        onClick={() => handleViewCustomer(customer.id!)}
                        sx={{
                          bgcolor: '#00BFA5',
                          '&:hover': {
                            bgcolor: '#00ACC1'
                          }
                        }}
                        aria-label={`Ver detalles de ${customer.nombre}`}
                      >
                        Ver
                      </Button>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => handleEditCustomer(customer)}
                          aria-label={`Editar ${customer.nombre}`}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDeleteCustomer(customer)}
                          aria-label={`Eliminar ${customer.nombre}`}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {/* Crear o editar cliente */}
      <CustomerFormDialog
        open={createModalOpen || editModalOpen}
        customer={editModalOpen ? selectedCustomer : null}
        onClose={() => {
          setCreateModalOpen(false)
          setEditModalOpen(false)
          setSelectedCustomer(null)
        }}
        onSubmit={editModalOpen ? handleUpdateCustomer : handleCreateCustomer}
      />
    </Container>
  )
}

export default CustomersCards
