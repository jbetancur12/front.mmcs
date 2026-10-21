import React, { useState, useMemo } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Avatar,
  Tooltip
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
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import { useNavigate } from 'react-router-dom'
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer
} from 'src/hooks/customers/useCustomers'
import Swal from 'sweetalert2'
import CreateCustomerModal from '../Components/CreateCustomerModal.tsx'
import EditCustomerModal from '../Components/EditCustomerModal.tsx'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
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
  const navigate = useNavigate()
  const canCreate = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_CREATE)
  const canUpdate = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_UPDATE)
  const canDelete = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_DELETE)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(
    null
  )

  const { data: customers = [], isLoading: loading } =
    useCustomers<CustomerData>(
      { scope: 'all' },
      {
        onError: (error) => {
          console.error('Error fetching customer data:', error)
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los clientes',
            icon: 'error',
            confirmButtonText: 'Entendido'
          })
        }
      }
    )
  const createCustomer = useCreateCustomer<CustomerData>()
  const updateCustomer = useUpdateCustomer<CustomerData>()
  const deleteCustomer = useDeleteCustomer()

  const handleCreateCustomer = async (customerData: CustomerData) => {
    try {
      const updatedValues = { ...customerData }
      delete updatedValues.id

      const response = await createCustomer.mutateAsync(updatedValues)

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: '¡Cliente Creado!',
          text: 'El cliente ha sido creado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
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
      const response = await updateCustomer.mutateAsync({
        id: customerData.id as number,
        values: customerData
      })

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          title: '¡Cliente Actualizado!',
          text: 'El cliente ha sido actualizado exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
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

      const response = await deleteCustomer.mutateAsync(customer.id as number)

      if (response.status === 204) {
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
        size: 210,
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
        header: 'Correo',
        size: 190,
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
              {cell.getValue<string>()}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
        size: 120,
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
        size: 150,
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
        size: 90,
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
              Clientes
            </Typography>
          </Box>

          {canCreate && (
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
              Crear cliente
            </Button>
          )}
        </Box>
      </Box>

      {/* Table Section */}
      <DataTable
        columns={columns}
        data={customers}
        itemLabel={['cliente', 'clientes']}
        searchPlaceholder='Buscar clientes'
        state={{
          isLoading: loading
        }}
        initialState={{
          pagination: {
            pageSize: 10,
            pageIndex: 0
          }
        }}
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Ver detalles'>
              <IconButton
                size='small'
                aria-label={`Ver ${row.original.nombre}`}
                onClick={() => handleViewCustomer(row.original.id!)}
                sx={{
                  color: '#00695C',
                  '&:hover': {
                    bgcolor: 'rgba(0, 191, 165, 0.1)'
                  }
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            {canUpdate && (
              <Tooltip title='Editar'>
                <IconButton
                  size='small'
                  aria-label={`Editar ${row.original.nombre}`}
                  onClick={() => handleEditCustomer(row.original)}
                  sx={{ color: '#2563eb' }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title='Eliminar'>
                <IconButton
                  size='small'
                  color='error'
                  aria-label={`Eliminar ${row.original.nombre}`}
                  onClick={() => handleDeleteCustomer(row.original)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

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
