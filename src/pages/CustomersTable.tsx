import React, { useState, useEffect, useMemo } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Paper
} from '@mui/material'
import {
  Add,
  Business,
  Visibility,
  Edit,
  Delete,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { useNavigate } from 'react-router-dom'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import CreateCustomerModal from '../Components/CreateCustomerModal.tsx'
import EditCustomerModal from '../Components/EditCustomerModal.tsx'

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

const CustomersTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  )

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/customers`, {})

      if (response.statusText === 'OK') {
        const filteredData = response.data.filter(
          (customer: CustomerData) => customer.rol !== 'admin'
        )
        setCustomers(filteredData)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los clientes',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleCreateCustomer = async (customerData: CustomerData) => {
    try {
      const updatedValues = { ...customerData }
      delete updatedValues.id

      const response = await axiosPrivate.post(`/customers`, updatedValues, {})

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: '¡Cliente Creado!',
          text: 'El cliente ha sido creado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        fetchCustomers()
        setCreateModalOpen(false)
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el cliente. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleEditCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setEditModalOpen(true)
  }

  const handleUpdateCustomer = async (customerData: CustomerData) => {
    try {
      const response = await axiosPrivate.put(
        `/customers/${customerData.id}`,
        customerData,
        {}
      )

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: '¡Cliente Actualizado!',
          text: 'El cliente ha sido actualizado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        fetchCustomers()
        setEditModalOpen(false)
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el cliente. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleDeleteCustomer = async (customer: CustomerData) => {
    const result = await Swal.fire({
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
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#grey',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    })

    if (!result.isConfirmed) return

    try {
      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espera mientras se elimina el cliente',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const response = await axiosPrivate.delete(
        `/customers/${customer.id}`,
        {}
      )

      if (response.status === 204) {
        fetchCustomers()

        Swal.fire({
          title: '¡Eliminado!',
          text: 'El cliente ha sido eliminado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error)

      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el cliente. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`)
  }

  const columns = useMemo<MRT_ColumnDef<CustomerData>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Cliente',
        size: 200,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#00BFA5',
                width: 32,
                height: 32
              }}
            >
              <Business sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant='body2' fontWeight='600'>
                {row.original.nombre}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                ID: {row.original.identificacion}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant='body2'>{cell.getValue<string>()}</Typography>
          </Box>
        )
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
        size: 150,
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant='body2'>{cell.getValue<string>()}</Typography>
          </Box>
        )
      },
      {
        accessorKey: 'ciudad',
        header: 'Ubicación',
        size: 180,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant='body2'>
              {row.original.ciudad}, {row.original.departamento}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        size: 100,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? 'Activo' : 'Inactivo'}
            size='small'
            color={cell.getValue<boolean>() ? 'success' : 'default'}
            variant='outlined'
          />
        )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {/* Header Section */}
      <Box component='header' sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Typography variant='h4' component='h1' fontWeight='bold'>
              Clientes - Vista Tabla
            </Typography>
          </Box>

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
            aria-label='Crear nuevo cliente'
          >
            Crear Cliente
          </Button>
        </Box>
      </Box>

      {/* Table Section */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          columns={columns}
          data={customers}
          localization={MRT_Localization_ES}
          state={{
            isLoading: loading
          }}
          enableRowActions
          positionActionsColumn='last'
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title='Ver detalles'>
                <IconButton
                  size='small'
                  onClick={() => handleViewCustomer(row.original.id!)}
                  sx={{
                    color: '#00BFA5',
                    '&:hover': {
                      bgcolor: 'rgba(0, 191, 165, 0.1)'
                    }
                  }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title='Editar'>
                <IconButton
                  size='small'
                  color='primary'
                  onClick={() => handleEditCustomer(row.original)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => handleDeleteCustomer(row.original)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          muiTableProps={{
            sx: {
              '& .MuiTableHead-root': {
                '& .MuiTableCell-root': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 600
                }
              },
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root:hover': {
                  backgroundColor: 'rgba(0, 191, 165, 0.04)'
                }
              }
            }
          }}
          muiSearchTextFieldProps={{
            placeholder: 'Buscar clientes...',
            sx: { minWidth: '300px' },
            variant: 'outlined'
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: '#fafafa',
              '& .MuiBox-root': {
                gap: 2
              }
            }
          }}
          muiBottomToolbarProps={{
            sx: {
              backgroundColor: '#fafafa'
            }
          }}
          initialState={{
            density: 'comfortable',
            pagination: {
              pageSize: 10,
              pageIndex: 0
            }
          }}
          enableColumnFilterModes
          enableColumnOrdering
          enableGrouping
          enableFacetedValues
          enableRowSelection={false}
          enableStickyHeader
          muiTableContainerProps={{
            sx: {
              maxHeight: '600px'
            }
          }}
        />
      </Paper>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        open={editModalOpen}
        customer={selectedCustomer}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedCustomer(null)
        }}
        onSubmit={handleUpdateCustomer}
      />
    </Container>
  )
}

export default CustomersTable
