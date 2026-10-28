import { Add, ManageAccounts as ManageAccountsIcon } from '@mui/icons-material'
import { Button, CircularProgress, Container } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useAssignableRoles, useUsers } from '../hooks/useUsers'
import { handleErrorWithAlert } from '../utils/sweetAlert'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import CreateNewAccountModal from './own-users/CreateNewAccountModal'
import EditUserModal from './own-users/EditUserModal'
import { UserData } from './own-users/types'
import { useOwnUsersActions } from './own-users/useOwnUsersActions'
import { useOwnUsersColumns } from './own-users/useOwnUsersColumns'
import UserRowActions from './own-users/UserRowActions'
import { filterUsers } from './own-users/userFilters'

export type { Role, UserData } from './own-users/types'

const TableOwnUsers: React.FC = () => {
  const canCreateUser = useCan(PERMISSIONS.USERS_USER_CREATE)

  // Roles con sus capacidades y si quien asigna puede darlos (para el selector y la vista previa)
  const { data: roles, isLoading: loadingRoles } = useAssignableRoles()

  const {
    data: users = [],
    isLoading: loadingUsers,
    error: usersError,
    isError: hasUsersError
  } = useUsers()

  const { columns, validationErrors } = useOwnUsersColumns(roles, loadingRoles)
  const {
    createUser,
    updateUser,
    deleteUser,
    handleActivationLink,
    onCreateUser,
    handleEditUser,
    handleDeleteRow
  } = useOwnUsersActions(validationErrors)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    if (hasUsersError && usersError) {
      handleErrorWithAlert(usersError)
    }
  }, [hasUsersError, usersError])

  const handleCreateNewRow = useCallback(
    async (values: UserData) => {
      await onCreateUser(values)
      // Solo se cierra si la creación no lanzó error
      setCreateModalOpen(false)
    },
    [onCreateUser]
  )

  const handleEditModalSubmit = useCallback(
    async (values: UserData) => {
      await handleEditUser(values)
      // Solo se cierra si la actualización no lanzó error
      setEditModalOpen(false)
      setEditingUser(null)
    },
    [handleEditUser]
  )

  // La búsqueda también mira los roles (nombre y descripción), por eso se filtra aquí
  const filteredUsers = useMemo(
    () => filterUsers(users, globalFilter),
    [users, globalFilter]
  )

  const createButton = canCreateUser ? (
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
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        bgcolor: '#00BFA5',
        '&:hover': { bgcolor: '#00897B' }
      }}
    >
      {createUser.isLoading ? 'Creando…' : 'Crear nuevo usuario'}
    </Button>
  ) : undefined

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Usuarios y roles'
        subtitle='Administra las cuentas, los roles y la activación de acceso al sistema'
        icon={<ManageAccountsIcon />}
        actions={createButton}
      />

      <DataTable
        columns={columns}
        data={filteredUsers}
        itemLabel={['usuario', 'usuarios']}
        searchPlaceholder='Buscar por nombre, correo, teléfono o rol'
        enableRowActions
        manualFiltering
        onGlobalFilterChange={setGlobalFilter}
        initialState={{
          columnVisibility: { id: false },
          sorting: [{ id: 'id', desc: false }],
          density: 'comfortable'
        }}
        state={{
          globalFilter,
          isLoading: loadingUsers,
          showProgressBars:
            createUser.isLoading || updateUser.isLoading || deleteUser.isLoading
        }}
        displayColumnDefOptions={{
          'mrt-row-actions': { header: 'Acciones', size: 100 }
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<ManageAccountsIcon />}
            title={
              globalFilter
                ? `Sin resultados para "${globalFilter}"`
                : 'Aún no hay usuarios'
            }
            hint={
              globalFilter
                ? 'Prueba con otro nombre, correo o rol.'
                : 'Crea la primera cuenta para dar acceso al sistema.'
            }
            action={globalFilter ? undefined : createButton}
          />
        )}
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
