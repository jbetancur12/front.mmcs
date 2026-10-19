import { Add, Build, Delete, Description, DescriptionOutlined, Edit } from '@mui/icons-material'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
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
import React, { useCallback, useMemo, useState } from 'react'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import AsyncSelect from 'react-select/async'

import { loadOptions, mapOptions } from '../utils/loadOptions'

import { bigToast, styles } from './ExcelManipulation/Utils'
import { TemplatesData } from './Templates'
import {
  useCreateDevice,
  useDeleteDevice,
  useDevices,
  useUpdateDevice
} from '@hooks/devices/useDevices'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

// Define interfaces
export interface DeviceData {
  id: number
  name: string
  magnitude: string
  repository?: {
    id: number
    name: string
  }
  certificateTemplate?: {
    id: number
    name: string
  }
}

// API URL

// Main component
const Table: React.FC = () => {
  const canManageDevices = useCan(PERMISSIONS.CALIBRATION_DEVICE_MANAGE)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { data: devicesData } = useDevices()
  const tableData = useMemo<DeviceData[]>(
    () => (devicesData ?? []) as DeviceData[],
    [devicesData]
  )
  const createDeviceMutation = useCreateDevice()
  const updateDeviceMutation = useUpdateDevice()
  const deleteDeviceMutation = useDeleteDevice()
  const [format, setFormat] = useState<{ labe: string; value: string } | null>(
    null
  )
  // const [filteredTableData, setFilteredTableData] = useState<DeviceData[]>([]);

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new device
  const onCreateDevice = async (deviceData: DeviceData) => {
    try {
      const response = await createDeviceMutation.mutateAsync({
        name: deviceData.name,
        repository: deviceData.repository,
        magnitude: deviceData.magnitude,
        certificateTemplate: deviceData.certificateTemplate
      })

      if (response.status === 201) {
        bigToast('Equipo Creado Exitosamente!', 'success')
      } else {
        console.error('Error al crear equipo')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleCreateNewRow = (values: DeviceData) => {
    onCreateDevice(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<DeviceData>['onEditingRowSave'] =
    async ({ exitEditingMode, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = {
          ...values,
          certificateTemplateId: format?.value
        }

        delete updatedValues.id
        try {
          const response = await updateDeviceMutation.mutateAsync({
            id: values.id,
            payload: updatedValues
          })

          if (response.status >= 200 && response.status < 300) {
            bigToast('Equipo Modificado Exitosamente!', 'success')
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

  const deleteUser = async (id: number) => {
    try {
      const response = await deleteDeviceMutation.mutateAsync(id)

      if (response.status === 204) {
        bigToast('Equipo Eliminado Exitosamente!', 'success')
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
      deleteUser(row.getValue('id'))
    },
    [deleteUser]
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
        id: 'certificateTemplateName',
        accessorFn: (row) => row.certificateTemplate?.name || 'Sin plantilla',
        header: 'Plantilla de Certificado',
        Cell: ({ row }) => row.original.certificateTemplate?.name || 'Sin plantilla',

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

  const withTemplate = tableData.filter((d) => d.certificateTemplate?.name).length

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Equipos'
        subtitle='Catálogo de equipos, magnitudes y plantillas de certificado'
        icon={<Build />}
        actions={
          canManageDevices ? (
            <Button variant='contained' startIcon={<Add />} onClick={() => setCreateModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
              Crear equipo
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Total equipos' value={tableData.length} icon={<Build />} tone='teal' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Con plantilla' value={withTemplate} icon={<Description />} tone='green' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Sin plantilla' value={tableData.length - withTemplate} icon={<DescriptionOutlined />} tone='orange' />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            {...purchaseTableStyle}
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
            enableEditing={canManageDevices}
            enableRowActions={canManageDevices}
            onEditingRowSave={handleSaveRowEdits}
            onEditingRowCancel={handleCancelRowEdits}
            enablePinning
            initialState={{
              columnVisibility: { id: false },
              columnPinning: { right: ['mrt-row-actions'] }
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
          />
      </Paper>
      <CreateNewDeviceModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </Container>
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
                if (column.id === 'certificateTemplateName') {
                  return (
                    <AsyncSelect
                      key={column.id}
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
                      key={column.id ?? column.accessorKey}
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
