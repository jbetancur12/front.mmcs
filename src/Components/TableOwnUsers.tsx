import { Add, ManageAccounts as ManageAccountsIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { MaterialReactTable } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useRoles, useUsers } from '../hooks/useUsers'
import { handleErrorWithAlert } from '../utils/sweetAlert'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import CreateNewAccountModal from './own-users/CreateNewAccountModal'
import EditUserModal from './own-users/EditUserModal'
import { EmptyState, NoResultsFound } from './own-users/EmptyStates'
import EnhancedSearch from './own-users/EnhancedSearch'
import { TableSkeleton } from './own-users/Skeletons'
import { modernTableStyles } from './own-users/tableStyles'
import { UserData } from './own-users/types'
import { useOwnUsersActions } from './own-users/useOwnUsersActions'
import { useOwnUsersColumns } from './own-users/useOwnUsersColumns'
import UserRowActions from './own-users/UserRowActions'
import { filterUsers } from './own-users/userFilters'
import { srOnlySx } from './own-users/UserFormFields'

export type { Role, UserData } from './own-users/types'

const TableOwnUsers: React.FC = () => {
  const canCreateUser = useCan(PERMISSIONS.USERS_USER_CREATE)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { data: roles, isLoading: loadingRoles } = useRoles()

  // Use React Query hooks for users data
  const {
    data: users = [],
    isLoading: loadingUsers,
    error: usersError,
    isError: hasUsersError
  } = useUsers()

  const { columns, validationErrors, setValidationErrors } = useOwnUsersColumns(
    roles,
    loadingRoles
  )
  const {
    createUser,
    updateUser,
    deleteUser,
    handleSaveRowEdits,
    handleActivationLink,
    onCreateUser,
    handleEditUser,
    handleDeleteRow
  } = useOwnUsersActions(validationErrors)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Handle initial loading errors
  useEffect(() => {
    if (hasUsersError && usersError) {
      handleErrorWithAlert(usersError)
    }
  }, [hasUsersError, usersError])

  const handleCancelRowEdits = useCallback(() => {
    setValidationErrors({})
  }, [setValidationErrors])

  const handleCreateNewRow = useCallback(
    async (values: UserData) => {
      await onCreateUser(values)
      // Only close modal if creation was successful (no error thrown)
      setCreateModalOpen(false)
    },
    [onCreateUser]
  )

  const handleEditModalSubmit = useCallback(
    async (values: UserData) => {
      await handleEditUser(values)
      // Only close modal if update was successful (no error thrown)
      setEditModalOpen(false)
      setEditingUser(null)
    },
    [handleEditUser]
  )

  // Filter users based on global search
  const filteredUsers = useMemo(
    () => filterUsers(users, globalFilter),
    [users, globalFilter]
  )

  // Render the component
  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Usuarios y roles'
        subtitle='Administra las cuentas, los roles y la activación de acceso al sistema'
        icon={<ManageAccountsIcon />}
        actions={
          canCreateUser ? (
            <Button
              variant='contained'
              startIcon={
                createUser.isLoading ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Add />
                )
              }
              onClick={() => setCreateModalOpen(true)}
              disabled={createUser.isLoading}
              aria-label='Abrir formulario para crear un nuevo usuario'
              sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00ACC1' } }}
            >
              {createUser.isLoading ? 'Creando...' : 'Crear Nuevo Usuario'}
            </Button>
          ) : undefined
        }
      />

      {/* Show skeleton loader when initially loading users */}
      {loadingUsers && users.length === 0 ? (
        <Box sx={modernTableStyles}>
          <TableSkeleton />
        </Box>
      ) : users.length === 0 ? (
        /* Show empty state when no users exist */
        canCreateUser ? (
          <EmptyState onCreateUser={() => setCreateModalOpen(true)} />
        ) : (
          <Typography color='text.secondary' sx={{ p: 4, textAlign: 'center' }}>
            No hay usuarios para mostrar.
          </Typography>
        )
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
              <Box id='users-table-description' sx={srOnlySx}>
                Tabla que muestra la lista de usuarios del sistema con opciones
                para editar y eliminar cada usuario. Use las teclas de flecha
                para navegar y Enter para activar los botones de acción.
              </Box>

              <MaterialReactTable
                enableHiding={false}
                enableColumnActions={false}
                displayColumnDefOptions={{
                  'mrt-row-actions': {
                    header: 'Acciones',
                    size: 90,
                    minSize: 90
                  }
                }}
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
                  showProgressBars:
                    loadingUsers ||
                    createUser.isLoading ||
                    updateUser.isLoading ||
                    deleteUser.isLoading
                }}
                enableEditing
                onEditingRowSave={handleSaveRowEdits}
                onEditingRowCancel={handleCancelRowEdits}
                renderRowActions={({ row }) => (
                  <UserRowActions
                    user={row.original}
                    name={String(row.getValue('nombre'))}
                    busy={updateUser.isLoading || deleteUser.isLoading}
                    onEdit={() => {
                      setEditingUser(row.original)
                      setEditModalOpen(true)
                    }}
                    onActivationLink={(resend) =>
                      handleActivationLink(row.original, resend)
                    }
                    onDelete={() => handleDeleteRow(row)}
                  />
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
    </Container>
  )
}

export default TableOwnUsers
