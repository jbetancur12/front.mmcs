import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material'
import axios from 'axios'
import {
  MaterialReactTable,
  MaterialReactTableProps,
  MRT_Cell,
  type MRT_ColumnDef
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { api } from '../config'
import { MRT_Localization_ES } from 'material-react-table/locales/es'

// Define interfaces
export interface UserData {
  id: number
  nombre: string
  rol: string
  email: number
  createdAt: string
}

// API URL
const apiUrl = api()

// Main component
const TableOwnUsers: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<UserData[]>([])
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // const [filteredTableData, setFilteredTableData] = useState<UserData[]>([]);

  // Create a new device

  // Fetch devices data
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users/own-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data)
      }
    } catch (error) {
      console.error('Error fetching device data:', error)
    }
  }

  // const updateUser = async (UserData: UserData) => {

  //   try {
  //     const response = await axios.put(`${apiUrl}/devices/${UserData.id}`, UserData, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
  //       },
  //     });

  //     if (response.status === 201) {
  //       toast.success('Equipo Modificado Exitosamente!', {
  //         duration: 4000,
  //         position: 'top-center',
  //       });
  //       ; // Refresh data after creation
  //     } else {
  //       console.error('Error al crear equipo');
  //     }
  //   } catch (error) {
  //     console.error('Error de red:', error);
  //   }
  // }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const handleSaveRowEdits: MaterialReactTableProps<UserData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axios.put(
            `${apiUrl}/products/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 200) {
            toast.success('Producto Modificado Exitosamente!', {
              duration: 4000,
              position: 'top-center'
            })
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al modificar producto')
          }
        } catch (error) {
          console.error('Error de red:', error)
        }

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  useEffect(() => {
    fetchUsers()
  }, [])

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
        accessorKey: 'id',
        header: 'ID'
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
        accessorKey: 'rol',
        header: 'Rol',
        Edit: ({ cell }) => (
          <Select
            defaultValue={cell.renderValue()}
            onChange={() => {
              // const newValue = e.target.value
            }}
            fullWidth
          >
            <MenuItem value='admin'>Administrador</MenuItem>
            <MenuItem value='metrologist'>Metrologista</MenuItem>
            <MenuItem value='secretary'>Secretario</MenuItem>
          </Select>
        )
        // Edit: ({ cell }) => {
        //   let value = cell.renderValue();
        //   return (
        //     <Select
        //       defaultValue={cell.renderValue()}
        //       onChange={(e) => (value = e.target.value)}
        //       fullWidth
        //     >
        //       <MenuItem value="admin">Administrador</MenuItem>
        //       <MenuItem value="metrologist">Metrologista</MenuItem>
        //       <MenuItem value="secretary">Secretario</MenuItem>
        //     </Select>
        //   );
        // },
      }
    ],
    [getCommonEditTextFieldProps] // No hay dependencias específicas aquí
  )

  const onCreateUser = async (productData: UserData) => {
    try {
      const response = await axios.post(
        `${apiUrl}/auth/register`,
        { ...productData, contraseña: 'password' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.status === 201) {
        toast.success('Producto Creado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
        setTableData([...tableData, response.data])
        // Refresh data after creation
      } else {
        console.error('Error al crear equipo')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleCreateNewRow = (values: UserData) => {
    onCreateUser(values)
    setCreateModalOpen(false)
  }

  return (
    <>
      {/* <Dialog
        open={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>Confirmación</DialogTitle>
        <DialogContent>
          <p>
            ¿Estás seguro de que deseas actualizar todos los precios en un{" "}
            {percentage}% ?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={updateAllPrices} color="primary">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog> */}
      <Toaster />
      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        // enableColumnResizing={true}

        localization={MRT_Localization_ES}
        // displayColumnDefOptions={{
        //   "mrt-row-actions": {
        //     muiTableHeadCellProps: {
        //       align: "center",
        //     },
        //     // size: 120,
        //   },
        // }}
        initialState={{
          sorting: [
            {
              id: 'id',
              desc: false
            }
          ]
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              textAlign: 'center'
            },
            '& .Mui-TableHeadCell-Content': {
              justifyContent: 'center'
            }
          }
        }}
        columns={columns}
        data={tableData}
        editingMode='modal' //default
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        // initialState={{
        //   columnVisibility: { id: false },
        // }}
        // renderRowActions={({ row, table }) => (
        //   <Box
        //     sx={{
        //       display: "flex",
        //       gap: "1rem",
        //       width: 20,
        //       justifyItems: "center",
        //     }}
        //   >
        //     <Tooltip arrow placement="left" title="Edit">
        //       <IconButton onClick={() => table.setEditingRow(row)}>
        //         <Edit />
        //       </IconButton>
        //     </Tooltip>
        //     <Tooltip arrow placement="right" title="Delete">
        //       <IconButton color="error" onClick={() => handleDeleteRow(row)}>
        //         <Delete />
        //       </IconButton>
        //     </Tooltip>
        //   </Box>
        // )}
        // // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Equipo</button>
        renderTopToolbarCustomActions={() => (
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded '
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Nuevo Usuario
          </button>
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

export const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = ''
      return acc
    }, {} as any)
  )

  const handleSubmit = () => {
    // Coloca aquí tu lógica de validación si es necesario
    onSubmit(values)
    onClose()
  }

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Crear Nuevo Usuario</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem'
            }}
          >
            {columns.map((column) => (
              <React.Fragment key={column.accessorKey}>
                {column.accessorKey !== 'id' && (
                  <>
                    {column.accessorKey === 'rol' ? (
                      <Select
                        value={values[column.accessorKey]}
                        name={column.accessorKey}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value
                          })
                        }
                        label={column.header}
                        fullWidth
                      >
                        <MenuItem value='admin'>Administrador</MenuItem>
                        <MenuItem value='metrologist'>Metrologista</MenuItem>
                        <MenuItem value='secretary'>Secretario</MenuItem>
                      </Select>
                    ) : (
                      <TextField
                        label={column.header}
                        name={column.accessorKey}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value
                          })
                        }
                      />
                    )}
                  </>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button
          variant='contained'
          onClick={onClose}
          sx={{ backgroundColor: '#ccc', marginRight: '10px' }}
        >
          Cancelar
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          Crear Producto
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const validateRequired = (value: string) => !!value.length

export default TableOwnUsers
