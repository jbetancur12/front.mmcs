import { Delete, Edit } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'
import axios from 'axios'
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
import { api } from '../config'
import { bigToast } from './ExcelManipulation/Utils'

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
const apiUrl = api()

// Main component
const Table: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<UserData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<UserData[]>([])
  const { id } = useParams()

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new user
  const onCreateUser = async (userData: UserData) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/register`, userData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

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

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/customers/${id}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

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
          const response = await axios.put(
            `${apiUrl}/users/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 201) {
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
      const response = await axios.delete(`${apiUrl}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      console.log('🚀 ~ deleteUser ~ response:', response)

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
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
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
        )
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
export const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const { id } = useParams()
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = ''
      return acc
    }, {} as any)
  )

  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values)
    onClose()
  }

  useEffect(() => {
    setValues({ ...values, customerId: id })
  }, [])

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Crear Nueva Cuenta</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem'
            }}
          >
            {columns.map(
              (column) =>
                // @ts-ignore
                column.accessorKey !== 'id' &&
                column.accessorKey !== 'active' &&
                column.accessorKey !== 'customer.nombre' &&
                // @ts-ignore
                column.accessorKey !== 'customer.contraseña' && (
                  <TextField
                    key={column.accessorKey}
                    label={column.header}
                    name={column.accessorKey}
                    onChange={(e) =>
                      setValues({ ...values, [e.target.name]: e.target.value })
                    }
                  />
                )
            )}

            {/* <TextField
              label="Compañia"
              name="customerId"
              disabled
              sx={{ display: "none" }}
              value={values.customerId}
            />
            <TextField
              label="Contraseña"
              name="contraseña"
              disabled
              sx={{ display: "none" }}
              value={"1234567x"}
            /> */}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <button
          className='bg-gray-400 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-10'
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          onClick={handleSubmit}
        >
          Crear Usuario
        </button>
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
