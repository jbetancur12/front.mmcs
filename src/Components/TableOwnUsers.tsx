import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Skeleton,
  Chip,
  Alert,
  Fade,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material'

import {
  MaterialReactTable,
  MaterialReactTableProps,
  MRT_Cell,
  type MRT_ColumnDef
} from 'material-react-table'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { MRT_Localization_ES } from 'material-react-table/locales/es'

import { axiosPrivate } from '@utils/api'
import { useQuery } from 'react-query'
import { Delete, Edit, Search, Clear, FilterList, PersonAdd, Add } from '@mui/icons-material'
import {
  showDeleteConfirmation,
  showSuccessAlert,
  showLoadingAlert,
  closeLoadingAlert,
  handleErrorWithAlert
} from '../utils/sweetAlert'
import { useUsers, useUserMutations, QUERY_KEYS } from '../hooks/useUsers'

// Define interfaces
interface Role {
  id: number
  name: string
  description: string
}

export interface UserData {
  id: number
  nombre: string
  roles: Role[]
  email: string
  createdAt: string
}

const fetchRoles = async () => {
  const { data } = await axiosPrivate.get('/roles')
  return data
}

// Skeleton loader component for better loading UX
const TableSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header skeleton */}
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: '8px' }} />
    </Box>

    {/* Table header skeleton */}
    <Box sx={{ mb: 1, display: 'flex', gap: 2, px: 3, py: 2, backgroundColor: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
      <Skeleton variant="text" width={100} height={20} />
      <Skeleton variant="text" width={120} height={20} />
      <Skeleton variant="text" width={80} height={20} />
      <Skeleton variant="text" width={60} height={20} />
    </Box>

    {/* Table rows skeleton */}
    {Array.from({ length: 5 }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          gap: 2,
          px: 3,
          py: 2,
          borderBottom: '1px solid #f0f0f0',
          alignItems: 'center'
        }}
      >
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="text" width={180} height={24} />
        <Skeleton variant="text" width={90} height={24} />
        <Skeleton variant="text" width={150} height={24} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>
    ))}
  </Box>
)

// Loading state for buttons
const ButtonSkeleton: React.FC<{ width?: number }> = ({ width = 120 }) => (
  <Skeleton
    variant="rectangular"
    width={width}
    height={36}
    sx={{ borderRadius: '8px' }}
  />
)

// Loading state for form fields
const FormFieldSkeleton: React.FC = () => (
  <Box sx={{ mb: 2 }}>
    <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '8px' }} />
  </Box>
)





// Enhanced search component
const EnhancedSearch: React.FC<{
  globalFilter: string
  setGlobalFilter: (value: string) => void
  totalResults: number
}> = ({ globalFilter, setGlobalFilter, totalResults }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box sx={{
      mb: 3,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 2,
      alignItems: isMobile ? 'stretch' : 'center',
      p: isMobile ? 1.5 : 2,
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <TextField
        placeholder="Buscar usuarios por nombre, email o rol..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        variant="outlined"
        size="small"
        aria-label="Campo de búsqueda de usuarios"
        aria-describedby="search-help-text"
        InputProps={{
          startAdornment: (
            <Search sx={{ color: '#6b7280', mr: 1 }} aria-hidden="true" />
          ),
          endAdornment: globalFilter && (
            <IconButton
              onClick={() => setGlobalFilter('')}
              size="small"
              aria-label="Limpiar búsqueda"
              tabIndex={0}
              sx={{
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }
              }}
            >
              <Clear fontSize="small" />
            </IconButton>
          )
        }}
        sx={{
          flexGrow: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
              borderWidth: '2px'
            }
          }
        }}
      />

      {/* Hidden help text for search field */}
      <Box
        id="search-help-text"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        Escriba para filtrar usuarios por nombre, email o rol. Use la tecla Escape para limpiar la búsqueda.
      </Box>

      {/* Results counter and filter indicator - responsive layout */}
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 1,
        alignItems: isMobile ? 'stretch' : 'center'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          <FilterList sx={{ color: '#6b7280', fontSize: 16 }} />
          <span style={{
            fontSize: '0.875rem',
            color: '#374151',
            fontWeight: 500
          }}>
            {totalResults} {totalResults === 1 ? 'usuario' : 'usuarios'}
          </span>
        </Box>

        {/* Clear search indicator */}
        {globalFilter && (
          <Box sx={{
            px: 2,
            py: 1,
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-start',
            gap: 1
          }}>
            Filtrado activo
            <IconButton
              onClick={() => setGlobalFilter('')}
              size="small"
              sx={{
                color: '#1e40af',
                ml: 0.5,
                '&:hover': {
                  backgroundColor: '#bfdbfe'
                }
              }}
            >
              <Clear fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Empty state component when no users exist
const EmptyState: React.FC<{ onCreateUser: () => void }> = ({ onCreateUser }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 12,
      px: 4,
      textAlign: 'center',
      backgroundColor: '#fafbfc',
      borderRadius: '16px',
      border: '2px dashed #e1e5e9',
      minHeight: '400px'
    }}
  >
    <Box
      sx={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3
      }}
    >
      <PersonAdd sx={{ fontSize: 40, color: '#1976d2' }} />
    </Box>

    <h2 style={{
      margin: '0 0 12px 0',
      color: '#1a202c',
      fontSize: '1.5rem',
      fontWeight: 600
    }}>
      No hay usuarios registrados
    </h2>

    <p style={{
      margin: '0 0 32px 0',
      color: '#718096',
      fontSize: '1rem',
      lineHeight: '1.5',
      maxWidth: '400px'
    }}>
      Comienza creando tu primer usuario del sistema. Los usuarios podrán acceder y gestionar la plataforma según sus roles asignados.
    </p>

    <Button
      variant="contained"
      size="large"
      startIcon={<Add />}
      onClick={onCreateUser}
      sx={{
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        px: 4,
        py: 1.5,
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(25, 118, 210, 0.4)'
        }
      }}
    >
      Crear Primer Usuario
    </Button>

    <Box sx={{ mt: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#f0f9ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1
        }}>
          <span style={{ fontSize: '16px' }}>👤</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Gestión de usuarios</span>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#f0f9ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1
        }}>
          <span style={{ fontSize: '16px' }}>🔐</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Control de roles</span>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#f0f9ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1
        }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Acceso rápido</span>
      </Box>
    </Box>
  </Box>
)

// No results found component
const NoResultsFound: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db'
    }}
  >
    <Search sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
    <h3 style={{
      margin: '0 0 8px 0',
      color: '#374151',
      fontSize: '1.125rem',
      fontWeight: 600
    }}>
      No se encontraron resultados
    </h3>
    <p style={{
      margin: '0 0 16px 0',
      color: '#6b7280',
      fontSize: '0.875rem'
    }}>
      No hay usuarios que coincidan con "{searchTerm}"
    </p>
    <Button
      variant="outlined"
      size="small"
      onClick={() => window.location.reload()}
      sx={{
        borderRadius: '6px',
        textTransform: 'none',
        borderColor: '#d1d5db',
        color: '#6b7280',
        '&:hover': {
          borderColor: '#9ca3af',
          backgroundColor: '#f9fafb'
        }
      }}
    >
      Limpiar búsqueda
    </Button>
  </Box>
)

// Enhanced table styling with modern design system
const modernTableStyles = {
  // Container styling with modern appearance
  '& .MuiPaper-root': {
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    overflow: 'hidden'
  },

  // Header styling with modern colors and typography
  '& .MuiTableHead-root': {
    backgroundColor: '#f8fafc',
    '& .MuiTableCell-head': {
      fontWeight: 600,
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '0.875rem',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const
    }
  },

  // Row hover effects - simplified without extra animations
  '& .MuiTableBody-root .MuiTableRow-root': {
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },

  // Cell styling improvements
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f0f0f0',
    padding: '16px',
    '&:first-of-type': {
      paddingLeft: '24px'
    },
    '&:last-of-type': {
      paddingRight: '24px'
    }
  },

  // Action buttons container styling
  '& .action-buttons': {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Enhanced button styling with micro-interactions
  '& .MuiIconButton-root': {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '12px',
    padding: '10px',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
    },
    '&:active': {
      transform: 'translateY(-1px) scale(0.98)',
      transition: 'all 0.1s ease-out'
    },
    '&.edit-button': {
      color: '#1976d2',
      '&:hover': {
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '0',
          height: '0',
          borderRadius: '50%',
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          transform: 'translate(-50%, -50%)',
          animation: 'ripple 0.6s ease-out',
          '@keyframes ripple': {
            '0%': {
              width: '0',
              height: '0',
              opacity: 1
            },
            '100%': {
              width: '40px',
              height: '40px',
              opacity: 0
            }
          }
        }
      }
    },
    '&.delete-button': {
      color: '#d32f2f',
      '&:hover': {
        backgroundColor: '#ffebee',
        color: '#c62828',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '0',
          height: '0',
          borderRadius: '50%',
          backgroundColor: 'rgba(211, 47, 47, 0.3)',
          transform: 'translate(-50%, -50%)',
          animation: 'ripple 0.6s ease-out'
        }
      }
    }
  }
}

// Main component
const TableOwnUsers: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    data: roles,
    isLoading: loadingRoles
  } = useQuery(QUERY_KEYS.ROLES, fetchRoles)

  // Use React Query hooks for users data
  const { data: users = [], isLoading: loadingUsers, error: usersError, isError: hasUsersError } = useUsers()
  const { createUser, updateUser, deleteUser } = useUserMutations()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Handle initial loading errors
  useEffect(() => {
    if (hasUsersError && usersError) {
      handleErrorWithAlert(usersError)
    }
  }, [hasUsersError, usersError])

  const handleCancelRowEdits = useCallback(() => {
    setValidationErrors({})
  }, [])

  const handleSaveRowEdits: MaterialReactTableProps<UserData>['onEditingRowSave'] = useCallback(
    async ({ exitEditingMode, row, values }: { exitEditingMode: () => void; row: any; values: any }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = {
          id: values.id,
          nombre: values.nombre,
          email: values.email,
          roles: row.original.roles
        }

        // Show loading indicator
        showLoadingAlert('Actualizando usuario...')

        try {
          await updateUser.mutateAsync(updatedValues)
          closeLoadingAlert()

          await showSuccessAlert('Usuario modificado exitosamente')
          exitEditingMode() // Required to exit editing mode and close modal
        } catch (error) {
          closeLoadingAlert()
          await handleErrorWithAlert(error)
          console.error('Error updating user:', error)
        }
      }
    },
    [validationErrors, updateUser]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<UserData>
    ): MRT_ColumnDef<UserData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid = validateRequired(event.target.value)
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors(prev => ({
              ...prev,
              [cell.id]: `${cell.column.columnDef.header} is required`
            }))
          } else {
            //remove validation error for cell if valid
            setValidationErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors[cell.id]
              return newErrors
            })
          }
        }
      }
    },
    [validationErrors]
  )

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableEditing: false
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'email',
        header: 'Email',
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'roles',
        header: 'Rol',
        Cell: ({ cell }) => {
          const roles = cell.getValue<Role[]>() // Obtén los roles desde la celda
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {roles.map((role, index) => (
                <Tooltip key={index} title={role.description} arrow placement="top">
                  <Chip
                    label={role.description}
                    size="small"
                    sx={{
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      cursor: 'help',
                      '&:hover': {
                        backgroundColor: '#a7f3d0',
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )
        },
        Edit: ({ cell }) => {
          // Obtén la lista de roles desde la fila original
          return (
            <Autocomplete
              multiple
              options={roles ?? []} // Array de roles obtenido desde la API
              autoComplete={false}
              freeSolo
              getOptionLabel={(option) => {
                if (typeof option === 'string') {
                  return option
                }
                return option.description // Muestra la descripción en el input
              }}
              defaultValue={cell.getValue<Role[]>()}
              onChange={(_, newValues) => {
                const updatedRoles = newValues.map((v) => {
                  if (typeof v === 'string') {
                    return { id: 0, name: v, description: v } // Crear un objeto Role temporal
                  }
                  return v
                })
                cell.row.original.roles = updatedRoles
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Roles'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingRoles ? (
                          <CircularProgress color='inherit' size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              filterOptions={(options, state) => {
                return options.filter(
                  (option) =>
                    typeof option !== 'string' &&
                    option.description
                      .toLowerCase()
                      .includes(state.inputValue.toLowerCase())
                )
              }}
              noOptionsText='No se encontraron roles'
              fullWidth
            />
          )
        }
      }
    ],
    [getCommonEditTextFieldProps, roles, loadingRoles]
  )

  const onCreateUser = useCallback(async (userData: UserData) => {
    // Show loading indicator
    showLoadingAlert('Creando usuario...')

    try {
      const createData = {
        nombre: userData.nombre,
        email: userData.email,
        roles: userData.roles,
        contraseña: 'Metromedics@2025'
      }

      await createUser.mutateAsync(createData)
      closeLoadingAlert()

      await showSuccessAlert('Usuario creado exitosamente')
    } catch (error) {
      closeLoadingAlert()
      await handleErrorWithAlert(error)
      console.error('Error creating user:', error)
      // Re-throw error to prevent modal from closing
      throw error
    }
  }, [createUser])

  const handleCreateNewRow = useCallback(async (values: UserData) => {
    await onCreateUser(values)
    // Only close modal if creation was successful (no error thrown)
    setCreateModalOpen(false)
  }, [onCreateUser])

  const handleEditUser = useCallback(async (userData: UserData) => {
    // Show loading indicator
    showLoadingAlert('Actualizando usuario...')

    try {
      const updatedValues = {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        roles: userData.roles
      }

      await updateUser.mutateAsync(updatedValues)
      closeLoadingAlert()

      await showSuccessAlert('Usuario modificado exitosamente')
    } catch (error) {
      closeLoadingAlert()
      await handleErrorWithAlert(error)
      console.error('Error updating user:', error)
      // Re-throw error to prevent modal from closing
      throw error
    }
  }, [updateUser])

  const handleEditModalSubmit = useCallback(async (values: UserData) => {
    await handleEditUser(values)
    // Only close modal if update was successful (no error thrown)
    setEditModalOpen(false)
    setEditingUser(null)
  }, [handleEditUser])

  const handleDeleteRow = useCallback(
    async (row: MRT_Cell<UserData>['row']) => {
      const userName = row.getValue('nombre') as string

      // Show SweetAlert2 confirmation dialog
      const result = await showDeleteConfirmation(userName)

      if (!result.isConfirmed) {
        return
      }

      // Show loading indicator
      showLoadingAlert('Eliminando usuario...')

      try {
        const userId = row.getValue('id') as number
        await deleteUser.mutateAsync(userId)
        closeLoadingAlert()

        await showSuccessAlert('Usuario eliminado exitosamente')
      } catch (error) {
        closeLoadingAlert()
        await handleErrorWithAlert(error)
        console.error('Error deleting user:', error)
      }
    },
    [deleteUser]
  )

  // Filter users based on global search
  const filteredUsers = useMemo(() => {
    if (!globalFilter) return users

    return users.filter((user) => {
      const searchTerm = globalFilter.toLowerCase()
      return (
        user.nombre.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.roles.some(role =>
          role.description.toLowerCase().includes(searchTerm) ||
          role.name.toLowerCase().includes(searchTerm)
        )
      )
    })
  }, [users, globalFilter])

  // Render the component
  return (
    <>

      {/* Show skeleton loader when initially loading users */}
      {loadingUsers && users.length === 0 ? (
        <Box sx={modernTableStyles}>
          <TableSkeleton />
        </Box>
      ) : users.length === 0 ? (
        /* Show empty state when no users exist */
        <EmptyState onCreateUser={() => setCreateModalOpen(true)} />
      ) : (
        <>
          {/* Enhanced search component */}
          <EnhancedSearch
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            totalResults={filteredUsers.length}
          />

          {/* Show no results if search returns empty */}
          {globalFilter && filteredUsers.length === 0 ? (
            <NoResultsFound searchTerm={globalFilter} />
          ) : (
            <Box sx={modernTableStyles}>
              {/* Screen reader description */}
              <Box
                id="users-table-description"
                sx={{
                  position: 'absolute',
                  left: '-10000px',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden'
                }}
              >
                Tabla que muestra la lista de usuarios del sistema con opciones para editar y eliminar cada usuario.
                Use las teclas de flecha para navegar y Enter para activar los botones de acción.
              </Box>

              <MaterialReactTable
                enableHiding={false}
                enableColumnActions={false}
                localization={MRT_Localization_ES}
                initialState={{
                  columnVisibility: {
                    id: false,
                    // Hide email column on mobile
                    ...(isMobile && { email: false })
                  },
                  sorting: [
                    {
                      id: 'id',
                      desc: false
                    }
                  ],
                  // Compact density on mobile
                  density: isMobile ? 'compact' : 'comfortable'
                }}
                muiTableProps={{
                  sx: {
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      textAlign: 'center',
                      // Smaller padding on mobile
                      padding: isMobile ? '8px' : '16px'
                    },
                    '& .Mui-TableHeadCell-Content': {
                      justifyContent: 'center'
                    }
                  },
                  // Accessibility improvements
                  'aria-label': 'Tabla de usuarios del sistema',
                  'aria-describedby': 'users-table-description',
                  role: 'table'
                }}
                muiTableContainerProps={{
                  sx: {
                    // Enable horizontal scroll on mobile
                    maxWidth: '100%',
                    overflowX: isMobile ? 'auto' : 'visible',
                    // Add scroll indicators
                    '&::-webkit-scrollbar': {
                      height: '8px'
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: '#f1f1f1',
                      borderRadius: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#c1c1c1',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: '#a8a8a8'
                      }
                    }
                  }
                }}
                columns={columns}
                data={filteredUsers}
                enableGlobalFilter={false}
                enableColumnFilters={false}
                enableFilters={false}
                // Disable column resizing on mobile
                enableColumnResizing={!isMobile}
                enableColumnOrdering={!isMobile}
                state={{
                  isLoading: loadingUsers,
                  showProgressBars: loadingUsers || createUser.isLoading || updateUser.isLoading || deleteUser.isLoading,
                }}
                enableEditing
                onEditingRowSave={handleSaveRowEdits}
                onEditingRowCancel={handleCancelRowEdits}
                renderRowActions={({ row }) => (
                  <Box
                    className="action-buttons"
                    role="group"
                    aria-label={`Acciones para el usuario ${row.getValue('nombre')}`}
                  >
                    <Tooltip arrow placement="left" title="Editar Usuario">
                      <IconButton
                        className="edit-button"
                        onClick={() => {
                          setEditingUser(row.original)
                          setEditModalOpen(true)
                        }}
                        disabled={updateUser.isLoading || deleteUser.isLoading}
                        size="small"
                        aria-label={`Editar usuario ${row.getValue('nombre')}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setEditingUser(row.original)
                            setEditModalOpen(true)
                          }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip arrow placement="right" title="Eliminar Usuario">
                      <IconButton
                        className="delete-button"
                        onClick={() => handleDeleteRow(row)}
                        disabled={updateUser.isLoading || deleteUser.isLoading}
                        size="small"
                        aria-label={`Eliminar usuario ${row.getValue('nombre')}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleDeleteRow(row)
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                renderTopToolbarCustomActions={() => (
                  <Button
                    variant="contained"
                    onClick={() => setCreateModalOpen(true)}
                    disabled={createUser.isLoading}
                    startIcon={createUser.isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
                    aria-label="Abrir formulario para crear un nuevo usuario"
                    aria-describedby="create-user-description"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setCreateModalOpen(true)
                      }
                    }}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                      },
                      '&:disabled': {
                        backgroundColor: '#e0e0e0',
                        color: '#9e9e9e',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {createUser.isLoading ? 'Creando...' : 'Crear Nuevo Usuario'}
                    {/* Hidden description for screen readers */}
                    <Box
                      id="create-user-description"
                      sx={{
                        position: 'absolute',
                        left: '-10000px',
                        width: '1px',
                        height: '1px',
                        overflow: 'hidden'
                      }}
                    >
                      Abre un formulario modal para crear un nuevo usuario del sistema
                    </Box>
                  </Button>
                )}
              />
            </Box>
          )}
        </>
      )}

      <CreateNewAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
        rolesList={roles}
        loadingRoles={loadingRoles}
        isCreating={createUser.isLoading}
      />

      <EditUserModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleEditModalSubmit}
        userData={editingUser}
        rolesList={roles}
        loadingRoles={loadingRoles}
        isUpdating={updateUser.isLoading}
      />
    </>
  )
}

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  open: boolean
  rolesList?: Role[]
  loadingRoles: boolean
  isCreating?: boolean
}

const CreateNewAccountModal = ({
  open,
  onClose,
  onSubmit,
  rolesList,
  loadingRoles,
  isCreating = false
}: CreateModalProps) => {
  // Initialize form values - memoized to prevent unnecessary resets
  const initialValues = useMemo(() => ({
    nombre: '',
    email: '',
    roles: []
  }), [])

  const [values, setValues] = useState<any>(initialValues)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Validation functions - memoized to prevent re-renders
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'El email es requerido'
    if (!emailRegex.test(email)) return 'Formato de email inválido'
    return ''
  }, [])

  const validateName = useCallback((name: string) => {
    if (!name) return 'El nombre es requerido'
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres'
    return ''
  }, [])

  const validateRoles = useCallback((roles: Role[]) => {
    if (!roles || roles.length === 0) return 'Debe seleccionar al menos un rol'
    return ''
  }, [])



  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValues((prev: any) => ({
      ...prev,
      [fieldName]: value
    }))

    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }))

    setHasUnsavedChanges(true)

    // Validate field immediately
    let error = ''
    switch (fieldName) {
      case 'nombre':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'roles':
        error = validateRoles(value)
        break
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [validateName, validateEmail, validateRoles])

  const isFormValid = useMemo(() => {
    const nameError = validateName(values.nombre || '')
    const emailError = validateEmail(values.email || '')
    const rolesError = validateRoles(values.roles || [])

    return !nameError && !emailError && !rolesError
  }, [validateName, validateEmail, validateRoles, values.nombre, values.email, values.roles])

  const handleSubmit = async () => {
    if (!isFormValid) {
      // Mark all fields as touched to show validation errors
      setTouched({
        nombre: true,
        email: true,
        roles: true
      })
      return
    }

    try {
      await onSubmit(values)
      // Reset form on success
      setValues(initialValues)
      setErrors({})
      setTouched({})
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error in modal submit:', error)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !isCreating) {
      if (window.confirm('¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.')) {
        onClose()
        setHasUnsavedChanges(false)
      }
    } else {
      onClose()
    }
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Dialog
      open={open}
      maxWidth={isMobile ? 'xs' : isTablet ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="create-user-dialog-title"
      aria-describedby="create-user-dialog-description"
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          margin: isMobile ? 0 : undefined,
          maxHeight: isMobile ? '100vh' : '90vh'
        },
        role: 'dialog',
        'aria-modal': 'true'
      }}
    >
      {/* Loading bar */}
      {isCreating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1
          }}
        />
      )}

      <DialogTitle
        id="create-user-dialog-title"
        sx={{
          textAlign: 'center',
          pb: 2,
          pt: 3,
          mb: 4,
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          position: 'relative'
        }}
      >
        ✨ Crear Nuevo Usuario
        {hasUnsavedChanges && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 16,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 2 }}>
        {/* Hidden description for screen readers */}
        <Box
          id="create-user-dialog-description"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        >
          Formulario para crear un nuevo usuario del sistema. Complete todos los campos requeridos y seleccione al menos un rol.
        </Box>



        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              gap: '2rem'
            }}
          >
            {loadingRoles ? (
              <>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </>
            ) : (
              ['nombre', 'email', 'roles'].map((fieldName) => (
                <React.Fragment key={fieldName}>
                  {fieldName && (
                    <Fade in timeout={300}>
                      <Box>
                        {fieldName === 'roles' ? (
                          <Box>
                            <Autocomplete
                              multiple
                              options={rolesList ?? []}
                              autoComplete={false}
                              value={values.roles || []}
                              getOptionLabel={(option) => {
                                if (typeof option === 'string') {
                                  return option
                                }
                                return option.description
                              }}
                              onChange={(_, newValues) => {
                                const roles = newValues.map((v) => {
                                  if (typeof v === 'string') {
                                    return { id: 0, name: v, description: v }
                                  }
                                  return v
                                })
                                handleFieldChange('roles', roles)
                              }}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    {...getTagProps({ index })}
                                    key={index}
                                    label={option.description}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#d1fae5',
                                      color: '#059669',
                                      fontWeight: 500,
                                      '& .MuiChip-deleteIcon': {
                                        color: '#059669'
                                      }
                                    }}
                                  />
                                ))
                              }
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label='Roles *'
                                  variant="outlined"
                                  error={touched.roles && !!errors.roles}
                                  helperText={touched.roles && errors.roles}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {loadingRoles ? (
                                          <CircularProgress color='inherit' size={20} />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    )
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '12px',
                                      transition: 'all 0.3s ease-in-out',
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#10b981'
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#10b981',
                                        borderWidth: '2px'
                                      }
                                    },
                                    '& .MuiInputLabel-root': {
                                      fontWeight: 600
                                    }
                                  }}
                                />
                              )}
                              filterOptions={(options, state) => {
                                return options.filter((option) =>
                                  option.description
                                    .toLowerCase()
                                    .includes(state.inputValue.toLowerCase())
                                )
                              }}
                              noOptionsText='No se encontraron roles'
                              fullWidth
                            />
                          </Box>
                        ) : (
                          <TextField
                            label={`${fieldName === 'nombre' ? 'Nombre' : fieldName === 'email' ? 'Email' : 'Campo'} *`}
                            name={fieldName}
                            value={values[fieldName] || ''}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, [fieldName]: true }))}
                            variant="outlined"
                            fullWidth
                            error={touched[fieldName] && !!errors[fieldName]}
                            helperText={touched[fieldName] && errors[fieldName]}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'all 0.3s ease-in-out',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#10b981'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#10b981',
                                  borderWidth: '2px'
                                }
                              },
                              '& .MuiInputLabel-root': {
                                fontWeight: 600
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Fade>
                  )}
                </React.Fragment>
              ))
            )}

            {/* Form validation summary */}
            {Object.keys(errors).some(key => errors[key]) && Object.keys(touched).length > 0 && (
              <Fade in>
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: '12px',
                    '& .MuiAlert-message': {
                      fontWeight: 500
                    }
                  }}
                >
                  Por favor, corrige los errores antes de continuar
                </Alert>
              </Fade>
            )}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{
        p: 3,
        gap: 2,
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafbfc'
      }}>
        {loadingRoles ? (
          <>
            <ButtonSkeleton width={120} />
            <ButtonSkeleton width={160} />
          </>
        ) : (
          <>
            <Button
              variant='outlined'
              onClick={handleClose}
              disabled={isCreating}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {hasUnsavedChanges ? 'Descartar cambios' : 'Cancelar'}
            </Button>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isCreating || !isFormValid}
              startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : <Add />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.6)'
                },
                '&:disabled': {
                  background: '#e5e7eb',
                  color: '#9ca3af',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {isCreating ? 'Creando Usuario...' : 'Crear Usuario'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

// Modern Edit User Modal Component
interface EditModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: UserData) => Promise<void>
  userData: UserData | null
  rolesList?: Role[]
  loadingRoles: boolean
  isUpdating?: boolean
}

const EditUserModal = ({
  open,
  onClose,
  onSubmit,
  userData,
  rolesList,
  loadingRoles,
  isUpdating = false
}: EditModalProps) => {
  // Initialize form values with user data
  const initialValues = useMemo(() => ({
    id: userData?.id || 0,
    nombre: userData?.nombre || '',
    email: userData?.email || '',
    roles: userData?.roles || [],
    createdAt: userData?.createdAt || ''
  }), [userData])

  const [values, setValues] = useState<UserData>(initialValues)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update form values when userData changes
  useEffect(() => {
    if (userData) {
      setValues(initialValues)
      setErrors({})
      setTouched({})
      setHasUnsavedChanges(false)
    }
  }, [userData, initialValues])

  // Validation functions - memoized to prevent re-renders
  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'El email es requerido'
    if (!emailRegex.test(email)) return 'Formato de email inválido'
    return ''
  }, [])

  const validateName = useCallback((name: string) => {
    if (!name) return 'El nombre es requerido'
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres'
    return ''
  }, [])

  const validateRoles = useCallback((roles: Role[]) => {
    if (!roles || roles.length === 0) return 'Debe seleccionar al menos un rol'
    return ''
  }, [])

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValues((prev: UserData) => ({
      ...prev,
      [fieldName]: value
    }))

    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }))

    setHasUnsavedChanges(true)

    // Validate field immediately
    let error = ''
    switch (fieldName) {
      case 'nombre':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'roles':
        error = validateRoles(value)
        break
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [validateName, validateEmail, validateRoles])

  const isFormValid = useMemo(() => {
    const nameError = validateName(values.nombre || '')
    const emailError = validateEmail(values.email || '')
    const rolesError = validateRoles(values.roles || [])

    return !nameError && !emailError && !rolesError
  }, [validateName, validateEmail, validateRoles, values.nombre, values.email, values.roles])

  const handleSubmit = async () => {
    if (!isFormValid) {
      // Mark all fields as touched to show validation errors
      setTouched({
        nombre: true,
        email: true,
        roles: true
      })
      return
    }

    try {
      await onSubmit(values)
      // Reset form state on success
      setErrors({})
      setTouched({})
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error in edit modal submit:', error)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !isUpdating) {
      if (window.confirm('¿Estás seguro de que quieres cerrar? Los cambios no guardados se perderán.')) {
        onClose()
        setHasUnsavedChanges(false)
      }
    } else {
      onClose()
    }
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  if (!userData) return null

  return (
    <Dialog
      open={open}
      maxWidth={isMobile ? 'xs' : isTablet ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="edit-user-dialog-title"
      aria-describedby="edit-user-dialog-description"
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          margin: isMobile ? 0 : undefined,
          maxHeight: isMobile ? '100vh' : '90vh',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          position: 'relative'
        },
        role: 'dialog',
        'aria-modal': 'true'
      }}
    >
      {/* Loading bar */}
      {isUpdating && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #34d399, #10b981)'
            }
          }}
        />
      )}

      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 0
        }}
      />

      <DialogTitle
        id="edit-user-dialog-title"
        sx={{
          textAlign: 'center',
          pb: 2,
          pt: 4,
          fontSize: '1.75rem',
          fontWeight: 800,
          color: 'white',
          position: 'relative',
          zIndex: 1,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Edit sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Editar Usuario
            </Box>
            <Box sx={{ fontSize: '0.875rem', opacity: 0.9, fontWeight: 400 }}>
              {userData.nombre}
            </Box>
          </Box>
        </Box>
        {hasUnsavedChanges && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              animation: 'pulse 2s infinite',
              boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
            }}
          />
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 2,
          pb: 2,
          backgroundColor: 'white',
          position: 'relative',
          zIndex: 1,
          borderRadius: '20px 20px 0 0',
          mt: 2
        }}
      >
        {/* Hidden description for screen readers */}
        <Box
          id="edit-user-dialog-description"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        >
          Formulario para editar la información del usuario. Modifique los campos necesarios y guarde los cambios.
        </Box>

        {/* User info header */}
        <Box sx={{
          mb: 4,
          p: 3,
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '2px solid #e5e7eb'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 600 }}>
                {userData.nombre.charAt(0).toUpperCase()}
              </span>
            </Box>
            <Box>
              <Box sx={{ fontWeight: 600, color: '#1a202c', fontSize: '1.1rem' }}>
                ID: {userData.id}
              </Box>
              <Box sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Creado: {new Date(userData.createdAt).toLocaleDateString()}
              </Box>
            </Box>
          </Box>
        </Box>

        <form onSubmit={(e) => e.preventDefault()}>
          <Stack sx={{ width: '100%', gap: '2rem' }}>
            {loadingRoles ? (
              <>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </>
            ) : (
              <>
                {/* Name Field */}
                <Fade in timeout={300}>
                  <TextField
                    label="Nombre *"
                    value={values.nombre || ''}
                    onChange={(e) => handleFieldChange('nombre', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, nombre: true }))}
                    variant="outlined"
                    fullWidth
                    error={touched.nombre && !!errors.nombre}
                    helperText={touched.nombre && errors.nombre}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                          borderWidth: '2px'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600
                      }
                    }}
                  />
                </Fade>

                {/* Email Field */}
                <Fade in timeout={400}>
                  <TextField
                    label="Email *"
                    type="email"
                    value={values.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    variant="outlined"
                    fullWidth
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                          borderWidth: '2px'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 600
                      }
                    }}
                  />
                </Fade>

                {/* Roles Field */}
                <Fade in timeout={500}>
                  <Autocomplete
                    multiple
                    options={rolesList ?? []}
                    autoComplete={false}
                    value={values.roles || []}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        return option
                      }
                      return option.description
                    }}
                    onChange={(_, newValues) => {
                      const roles = newValues.map((v) => {
                        if (typeof v === 'string') {
                          return { id: 0, name: v, description: v }
                        }
                        return v
                      })
                      handleFieldChange('roles', roles)
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={index}
                          label={option.description}
                          size="small"
                          sx={{
                            backgroundColor: '#d1fae5',
                            color: '#059669',
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': {
                              color: '#059669'
                            }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Roles *'
                        variant="outlined"
                        error={touched.roles && !!errors.roles}
                        helperText={touched.roles && errors.roles}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingRoles ? (
                                <CircularProgress color='inherit' size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981',
                              borderWidth: '2px'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            fontWeight: 600
                          }
                        }}
                      />
                    )}
                    filterOptions={(options, state) => {
                      return options.filter((option) =>
                        option.description
                          .toLowerCase()
                          .includes(state.inputValue.toLowerCase())
                      )
                    }}
                    noOptionsText='No se encontraron roles'
                    fullWidth
                  />
                </Fade>
              </>
            )}

            {/* Form validation summary */}
            {Object.keys(errors).some(key => errors[key]) && Object.keys(touched).length > 0 && (
              <Fade in>
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: '12px',
                    '& .MuiAlert-message': {
                      fontWeight: 500
                    }
                  }}
                >
                  Por favor, corrige los errores antes de continuar
                </Alert>
              </Fade>
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        gap: 2,
        borderTop: '1px solid #f0f0f0',
        backgroundColor: 'white',
        position: 'relative',
        zIndex: 1
      }}>
        {loadingRoles ? (
          <>
            <ButtonSkeleton width={120} />
            <ButtonSkeleton width={160} />
          </>
        ) : (
          <>
            <Button
              variant='outlined'
              onClick={handleClose}
              disabled={isUpdating}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {hasUnsavedChanges ? 'Descartar cambios' : 'Cancelar'}
            </Button>
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={isUpdating || !isFormValid}
              startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <Edit />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.6)'
                },
                '&:disabled': {
                  background: '#e5e7eb',
                  color: '#9ca3af',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {isUpdating ? 'Actualizando Usuario...' : 'Actualizar Usuario'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

// Validation helper function
const validateRequired = (value: string) => !!value.length

export default TableOwnUsers