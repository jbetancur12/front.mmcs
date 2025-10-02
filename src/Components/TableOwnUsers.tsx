import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material'

import {
  MaterialReactTable,
  MaterialReactTableProps,
  MRT_Cell,
  type MRT_ColumnDef
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

import { MRT_Localization_ES } from 'material-react-table/locales/es'
import useAxiosPrivate from '@utils/use-axios-private'
import { bigToast } from './ExcelManipulation/Utils'
import { AxiosError } from 'axios'
import { axiosPrivate } from '@utils/api'
import { useQuery } from 'react-query'

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
  email: number
  createdAt: string
}

const fetchRoles = async () => {
  const { data } = await axiosPrivate.get('/roles')
  return data
}

// API URL

// Main component
const TableOwnUsers: React.FC = () => {
  const {
    data: roles,
    isLoading: loadingRoles
    // error
  } = useQuery('roles', fetchRoles)
  const axiosPrivate = useAxiosPrivate()
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
      const response = await axiosPrivate.get(`/users/own-users`, {})

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
  //     const response = await axiosPrivate.put(`/devices/${UserData.id}`, UserData, {
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
        const updatedValues = { ...values, roles: row.original.roles }
        delete updatedValues.id

        try {
          const response = await axiosPrivate.put(
            `/users/own/${values.id}`,
            updatedValues,
            {}
          )

          if (response.status === 200) {
            toast.success('Usuario Modificado Exitosamente!', {
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
          return roles.map((role) => role.description).join(', ') // Muestra los nombres de los roles
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
    [getCommonEditTextFieldProps] // No hay dependencias específicas aquí
  )

  const onCreateUser = async (productData: UserData) => {
    try {
      const response = await axiosPrivate.post(
        `/auth/register`,
        { ...productData, contraseña: 'Metromedics@2025' },
        {}
      )

      if (response.status === 201) {
        bigToast('Usuario Creado Exitosamente!', 'success')
        setTableData([...tableData, response.data])
        // Refresh data after creation
      } else {
        console.error('Error al crear equipo')
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        bigToast(
          'Error al crear el usuario: ' + error.response?.data?.error,
          'error'
        )
      } else {
        bigToast('Error al crear el usuario: ', 'error')
        console.error('Error de red:', error)
      }
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
        rolesList={roles}
        loadingRoles={loadingRoles}
      />
    </>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<UserData>[]
  onClose: () => void
  onSubmit: (values: UserData) => void
  open: boolean
  rolesList?: Role[] // Roles disponibles desde la tabla `roles`
  loadingRoles: boolean
}

const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit,
  rolesList,
  loadingRoles
}: CreateModalProps) => {
  // Inicializamos el estado de los valores. Para el campo 'rol' se asigna un array vacío.
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      if (column.accessorKey === 'roles') {
        acc[column.accessorKey] = []
      } else {
        acc[column.accessorKey ?? ''] = ''
      }
      return acc
    }, {} as any)
  )

  const handleSubmit = () => {
    // Aquí puedes agregar lógica de validación si es necesario.
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
                    {column.accessorKey === 'roles' ? (
                      <Autocomplete
                        multiple
                        options={rolesList ?? []} // Array de roles obtenido desde la API
                        autoComplete={false}
                        freeSolo
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') {
                            return option
                          }
                          return option.description // Muestra la descripción en el input
                        }} // Muestra la descripción en el input
                        loading={loadingRoles}
                        onChange={(_, newValues) => {
                          setValues((prev: any) => ({
                            ...prev,
                            // Almacena, por ejemplo, los IDs de los roles seleccionados
                            rol: newValues.map((v) => {
                              if (typeof v === 'string') {
                                return v
                              }
                              return v.name
                            })
                          }))
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
                                    <CircularProgress
                                      color='inherit'
                                      size={20}
                                    />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              )
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
