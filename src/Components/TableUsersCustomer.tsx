import { Delete, Edit } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'

import {
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useParams } from 'react-router-dom'

import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import ResetPasswordModal from './ResetPasswordModal'

// Define interfaces
export interface UserData {
  id: number
  nombre: string
  email: string
  contraseña: string
  active: boolean
  customer: {
    id: number
    nombre: string
    // Otras propiedades de User
  }
  rol: string
}

// API URL

// Main component
const Table: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<UserData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<UserData[]>([])
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [selectedUser, _setSelectedUser] = useState<UserData | null>(null)
  const { id } = useParams()

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new user
  const onCreateUser = async (userData: UserData) => {
    try {
      const response = await axiosPrivate.post(`/auth/register`, userData, {})

      if (response.status >= 200 && response.status < 300) {
        bigToast('Usuario Creado Exitosamente!', 'success')
        fetchUsers() // Refresh data after creation
      } else {
        console.error('Error al crear usuario')
        bigToast('Error al crear usuario', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al crear usuario', 'error')
    }
  }

  const handleResetPassword = async (userId: number, newPassword: string) => {
    try {
      const response = await axiosPrivate.put(`/auth/${userId}/password`, {
        newPassword
      })

      if (response.status === 200) {
        bigToast('Contraseña actualizada exitosamente!', 'success')
      } else {
        bigToast('Error al actualizar la contraseña', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al actualizar la contraseña', 'error')
    }
  }

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosPrivate.get(`/customers/${id}/users`, {})

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        const filteredData = response.data.filter(
          (user: UserData) => user.rol !== 'admin'
        )
        setTableData(filteredData)
        setFilteredTableData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateNewRow = (values: UserData) => {
    // @ts-ignore
    onCreateUser({ ...values, customerId: id, contraseña: '123456' })
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<UserData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axiosPrivate.put(
            `/users/${values.id}`,
            updatedValues,
            {}
          )

          if (response.status === 200) {
            bigToast('Usuario Modificado Exitosamente!', 'success')
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al crear usuario')
          }
        } catch (error) {
          console.error('Error de red:', error)
        }

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const deleteUser = async (rowIndex: number, id: number) => {
    try {
      const response = await axiosPrivate.delete(`/users/${id}`, {})

      if (response.status === 204) {
        bigToast('Usuario Eliminado Exitosamente!', 'success')
        tableData.splice(rowIndex, 1)
        setTableData([...tableData])
      } else {
        console.error('Error al crear usuario')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<UserData>) => {
      if (
        !confirm(`Are you sure you want to delete ${row.getValue('nombre')}`)
      ) {
        return
      }
      deleteUser(row.index, row.getValue('id'))
      tableData.splice(row.index, 1)
      setTableData([...tableData])
    },
    [tableData]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<UserData>
    ): MRT_ColumnDef<UserData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'email'
              ? validateEmail(event.target.value)
              : cell.column.id === 'age'
                ? validateAge(+event.target.value)
                : validateRequired(event.target.value)
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`
            })
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id]
            setValidationErrors({
              ...validationErrors
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
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'nombre', //access nested data with dot notation
        header: 'Nombre',
        size: 150,
        type: 'show',
        muiTableBodyCellEditTextFieldProps: ({ cell }) => {
          return {
            ...getCommonEditTextFieldProps(cell)
          }
        }
      },
      {
        accessorKey: 'email', //normal accessorKey
        header: 'Email',
        size: 200,
        type: 'show',
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'active',
        header: 'Activo',
        enableEditing: false,
        size: 10,
        Cell: ({ cell }) => (
          <div
            className={`circle ${
              cell.getValue() ? 'bg-green-600' : 'bg-orange-400'
            }`}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%'
            }}
          ></div>
        ),
        Edit: () => null
      },
      {
        accessorKey: 'customer.nombre',
        header: 'Compañia',
        size: 10
      }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <>
      <MaterialReactTable
        localization={MRT_Localization_ES}
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center'
            },
            size: 120
          }
        }}
        columns={columns}
        data={filteredTableData}
        editingMode='modal' //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement='left' title='Edit'>
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            {/* <Tooltip arrow placement='left' title='Restablecer contraseña'>
              <IconButton
                onClick={() => {
                  setSelectedUser(row.original)
                  setResetPasswordModalOpen(true)
                }}
              >
                <VpnKey />
              </IconButton>
            </Tooltip> */}
            <Tooltip arrow placement='right' title='Delete'>
              <IconButton color='error' onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Usuario</button>
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            onClick={() => setCreateModalOpen(true)}
            sx={{
              fontWeight: 'bold',
              color: '#DCFCE7'
            }}
          >
            Crear Usuario
          </Button>
        )}
      />
      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
      <ResetPasswordModal
        open={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        onSubmit={handleResetPassword}
        user={selectedUser}
      />
    </>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<UserData>[]
  onClose: () => void
  onSubmit: (values: UserData) => void
  open: boolean
}

//example of creating a mui dialog modal for creating new rows
const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const { id } = useParams()
  const [values, setValues] = useState(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = ''
      return acc
    }, {} as any)
  )

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateFields = () => {
    const newErrors: { [key: string]: string } = {}
    if (!values.nombre) newErrors.nombre = 'Nombre es requerido'
    if (!values.email) newErrors.email = 'Email es requerido'
    // if (!values.rol) newErrors.rol = 'Rol es requerido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateFields()) {
      onSubmit(values)
      onClose()
    }
  }

  useEffect(() => {
    setValues({ ...values, customerId: id })
  }, [id])

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Crear Nueva Cuenta</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack sx={{ width: '100%', gap: '1.5rem' }}>
            {columns.map((column) => {
              const excludedKeys = ['id', 'active', 'customer.nombre']
              if (!excludedKeys.includes(column.accessorKey as string)) {
                return column.accessorKey === 'rol' ? (
                  <Select
                    key={column.accessorKey}
                    label={column.header}
                    value={values.rol || ''}
                    error={!!errors.rol}
                    onChange={(e) =>
                      setValues({ ...values, rol: e.target.value })
                    }
                    fullWidth
                  >
                    <MenuItem value='user'>User</MenuItem>
                    <MenuItem value='fleet'>Flota</MenuItem>
                  </Select>
                ) : (
                  <TextField
                    key={column.accessorKey}
                    label={column.header}
                    name={column.accessorKey}
                    value={values[column.accessorKey as string] || ''}
                    error={!!errors[column.accessorKey as string]}
                    helperText={errors[column.accessorKey as string]}
                    onChange={(e) =>
                      setValues({ ...values, [e.target.name]: e.target.value })
                    }
                    fullWidth
                  />
                )
              }
              return null
            })}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant='contained'>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const validateRequired = (value: string) => !!value.length
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
const validateAge = (age: number) => age >= 18 && age <= 50

export default Table
