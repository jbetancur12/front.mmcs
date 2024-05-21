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
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { api } from '../config'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import AsyncSelect from 'react-select/async'

import { loadOptions, mapOptions } from '../utils/loadOptions'
import { RepositoryData } from './Repository'
import { bigToast, styles } from './ExcelManipulation/Utils'
import { TemplatesData } from './Templates'

// Define interfaces
export interface DeviceData {
  id: number
  name: string
  magnitude: string
  repository: {
    id: number
    name: string
  }
  certificateTemplate: {
    id: number
    name: string
  }
}

// API URL
const apiUrl = api()

// Main component
const Table: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<DeviceData[]>([])
  const [_format, setFormat] = useState<{ labe: string; value: string } | null>(
    null
  )
  // const [filteredTableData, setFilteredTableData] = useState<DeviceData[]>([]);

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new device
  const onCreateDevice = async (deviceData: DeviceData) => {
    try {
      const response = await axios.post(
        `${apiUrl}/devices`,
        {
          name: deviceData.name,
          repository: deviceData.repository,
          magnitude: deviceData.magnitude,
          certificateTemplate: deviceData.certificateTemplate
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.status === 201) {
        bigToast('Equipo Creado Exitosamente!', 'success')
        fetchUsers() // Refresh data after creation
      } else {
        console.error('Error al crear equipo')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  // Fetch devices data
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/devices`, {
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

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateNewRow = (values: DeviceData) => {
    onCreateDevice(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<DeviceData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axios.put(
            `${apiUrl}/devices/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 201) {
            bigToast('Equipo Modificado Exitosamente!', 'success')
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al crear equipo')
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
      const response = await axios.delete(`${apiUrl}/devices/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 204) {
        bigToast('Equipo Eliminado Exitosamente!', 'success')
        tableData.splice(rowIndex, 1)
        setTableData([...tableData])
      } else {
        console.error('Error al crear equipo')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<DeviceData>) => {
      if (
        !confirm(`Esta seguro que desea eliminar ${row.getValue('name')} ?`)
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
      cell: MRT_Cell<DeviceData>
    ): MRT_ColumnDef<DeviceData>['muiTableBodyCellEditTextFieldProps'] => {
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
  const columns = useMemo<MRT_ColumnDef<DeviceData>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        // size: 1,

        enableEditing: false
      },
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Nombre',
        // size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'magnitude',
        header: 'Magnitud',
        // size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'certificateTemplate.name',
        header: 'Plantilla de Certificado',

        Edit: () => (
          <AsyncSelect
            cacheOptions
            // defaultOptions

            placeholder='Buscar Plantilla de Certificado'
            loadOptions={(inputValue) =>
              loadOptions<TemplatesData>(inputValue, 'templates', (item) =>
                mapOptions(item, 'id', 'name')
              )
            }
            onChange={(selectedOption: any) => setFormat(selectedOption) as any}
            styles={styles(false)}
          />
        )
      }

      // {
      //   accessorKey: 'repository.name',
      //   header: 'Formato',

      //   Edit: () => (
      //     <AsyncSelect
      //       cacheOptions
      //       // defaultOptions

      //       placeholder='Buscar Formato'
      //       loadOptions={(inputValue) =>
      //         loadOptions<RepositoryData>(inputValue, 'repositories', (item) =>
      //           mapOptions(item, 'id', 'name')
      //         )
      //       }
      //       onChange={(selectedOption: any) => setFormat(selectedOption) as any}
      //       styles={styles(false)}
      //     />
      //   )
      // }
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
            }
            // size: 120,
          }
        }}
        columns={columns}
        data={tableData}
        editingMode='modal' //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        initialState={{
          columnVisibility: { id: false }
        }}
        renderRowActions={({ row, table }) => (
          <Box
            sx={{
              display: 'flex',
              gap: '1rem',
              width: 20,
              justifyItems: 'center'
            }}
          >
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
        // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Equipo</button>
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            onClick={() => setCreateModalOpen(true)}
            sx={{
              fontWeight: 'bold',
              color: '#DCFCE7'
            }}
          >
            Crear Nuevo Equipo
          </Button>
        )}
      />
      <CreateNewDeviceModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<DeviceData>[]
  onClose: () => void
  onSubmit: (values: DeviceData) => void
  open: boolean
}

//example of creating a mui dialog modal for creating new rows
export const CreateNewDeviceModal = ({
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
      <DialogTitle textAlign='center'>Crear Nuevo Equipo</DialogTitle>
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
              (column) => {
                if (column.accessorKey === 'id') {
                  return null
                }
                if (column.accessorKey === 'certificateTemplate.name') {
                  return (
                    <AsyncSelect
                      key={column.accessorKey}
                      cacheOptions
                      // defaultOptions
                      placeholder='Buscar Plantilla de Certificado'
                      loadOptions={(inputValue) =>
                        loadOptions<TemplatesData>(
                          inputValue,
                          'templates',
                          (item) => mapOptions(item, 'id', 'name')
                        )
                      }
                      onChange={(selectedOption: any) =>
                        setValues({
                          ...values,
                          certificateTemplate: {
                            id: selectedOption.value,
                            name: selectedOption.label
                          }
                        }) as any
                      }
                      styles={styles(true)}
                    />
                  )
                }
                if (column.accessorKey === 'repository.name') {
                  return null
                  // return (
                  //   <AsyncSelect
                  //     key={column.accessorKey}
                  //     cacheOptions
                  //     // defaultOptions
                  //     placeholder='Buscar Formato'
                  //     loadOptions={(inputValue) =>
                  //       loadOptions<RepositoryData>(
                  //         inputValue,
                  //         'repositories',
                  //         (item) => mapOptions(item, 'id', 'name')
                  //       )
                  //     }
                  //     onChange={(selectedOption: any) =>
                  //       setValues({
                  //         ...values,
                  //         repository: {
                  //           id: selectedOption.value,
                  //           name: selectedOption.label
                  //         }
                  //       }) as any
                  //     }
                  //     styles={styles(false)}
                  //   />
                  // )
                } else {
                  return (
                    <TextField
                      key={column.accessorKey}
                      label={column.header}
                      name={column.accessorKey}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [e.target.name]: e.target.value
                        })
                      }
                    />
                  )
                }
              }

              // column.accessorKey !== "id" && (
              //   <TextField
              //     key={column.accessorKey}
              //     label={column.header}
              //     name={column.accessorKey}
              //     onChange={(e) =>
              //       setValues({ ...values, [e.target.name]: e.target.value })
              //     }
              //   />
              // )
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
          Crear Equipo
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
