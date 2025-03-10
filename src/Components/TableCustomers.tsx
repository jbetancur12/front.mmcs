import { Delete, Edit, Visibility } from '@mui/icons-material'
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

import {
  MRT_ColumnFiltersState,
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { bigToast, MySwal } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'

// Define interfaces
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
  active: boolean
  rol: string
}

// API URL

// Main component
const Table: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<CustomerData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<CustomerData[]>([])

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    () => {
      // Restaurar los filtros desde el localStorage al inicializar
      const savedFilters = sessionStorage.getItem('columnFiltersCustomers')
      return savedFilters ? JSON.parse(savedFilters) : []
    }
  )

  // Create a new customer
  const onCreateCustomer = async (customerData: CustomerData) => {
    try {
      const updatedValues = { ...customerData }
      delete updatedValues.id

      const response = await axiosPrivate.post(`/customers`, updatedValues, {})

      if (response.status >= 200 && response.status < 300) {
        bigToast('Cliente Creado Exitosamente!', 'success')
        fetchCustomers() // Refresh data after creation
      } else {
        console.error('Error al crear cliente')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      const response = await axiosPrivate.get(`/customers`, {})

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        const filteredData = response.data.filter(
          (customer: CustomerData) => customer.rol !== 'admin'
        )
        setTableData(filteredData)
        setFilteredTableData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    }
  }

  // const updateCustomer = async (customerData: CustomerData) => {

  //   try {
  //     const response = await axiosPrivate.put(`/customers/${customerData.id}`, customerData, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
  //       },
  //     });

  //     if (response.status === 201) {
  //       toast.success('Cliente Modificado Exitosamente!', {
  //         duration: 4000,
  //         position: 'top-center',
  //       });
  //       ; // Refresh data after creation
  //     } else {
  //       console.error('Error al crear cliente');
  //     }
  //   } catch (error) {
  //     console.error('Error de red:', error);
  //   }
  // }

  useEffect(() => {
    fetchCustomers()
    const savedFilters = sessionStorage.getItem('columnFiltersCustomers')
    if (savedFilters) {
      setColumnFilters(JSON.parse(savedFilters))
    }
  }, [])

  useEffect(() => {
    // Guardar los filtros en el localStorage cada vez que cambien
    localStorage.setItem(
      'columnFiltersCustomers',
      JSON.stringify(columnFilters)
    )
  }, [columnFilters])

  const handleCreateNewRow = (values: CustomerData) => {
    onCreateCustomer(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<CustomerData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axiosPrivate.put(
            `/customers/${values.id}`,
            updatedValues,
            {}
          )

          if (response.status === 201) {
            bigToast('Cliente Modificado Exitosamente!', 'success')
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al crear cliente')
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

  const deleteCustomer = async (rowIndex: number, id: number) => {
    try {
      const response = await axiosPrivate.delete(`/customers/${id}`, {})

      if (response.status === 204) {
        bigToast('Cliente Eliminado Exitosamente!', 'success')
        filteredTableData.splice(rowIndex, 1)
        setFilteredTableData([...filteredTableData])
      } else {
        console.error('Error al eliminar cliente')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<CustomerData>) => {
      MySwal.fire({
        title: `¿ Esta seguro que desea eliminar el cliente ${row.getValue(
          'nombre'
        )} ?`,
        text: 'No podrá recuperar esta información una vez eliminada',
        showCancelButton: true,
        confirmButtonText: 'Si'
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          deleteCustomer(row.index, row.getValue('id'))
        }
      })
    },
    [filteredTableData]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<CustomerData>
    ): MRT_ColumnDef<CustomerData>['muiTableBodyCellEditTextFieldProps'] => {
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
  const columns = useMemo<MRT_ColumnDef<CustomerData>[]>(
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
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'identificacion',
        header: 'Identificacion',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'email', //normal accessorKey
        header: 'Email',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'direccion', //normal accessorKey
        header: 'Direccion',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'telefono', //normal accessorKey
        header: 'Telefono',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'ciudad', //normal accessorKey
        header: 'Ciudad',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'departamento', //normal accessorKey
        header: 'Departamento',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      },
      {
        accessorKey: 'pais', //normal accessorKey
        header: 'Pais',
        size: 200,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
          type: 'show'
        })
      }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <>
      <MaterialReactTable
        //turn off client-side filtering
        onColumnFiltersChange={setColumnFilters} //hoist internal columnFilters state to your state
        state={{ columnFilters }}
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
            <Tooltip arrow placement='right' title='Ver'>
              <Link to={`${row.original.id}`}>
                <IconButton>
                  <Visibility />
                </IconButton>
              </Link>
            </Tooltip>
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
        // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Cliente</button>
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            onClick={() => setCreateModalOpen(true)}
            sx={{
              backgroundColor: '#9CF08B',
              color: '#000',
              '&:hover': {
                backgroundColor: '#6DC662' // Azul más oscuro en hover
              }
            }}
          >
            Crear Nueva Cuenta
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
  columns: MRT_ColumnDef<CustomerData>[]
  onClose: () => void
  onSubmit: (values: CustomerData) => void
  open: boolean
}

//example of creating a mui dialog modal for creating new rows
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
    //put your validation logic here
    onSubmit(values)
    onClose()
  }

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
                column.accessorKey !== 'id' &&
                column.accessorKey !== 'active' && (
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
          Crear Cuenta
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
