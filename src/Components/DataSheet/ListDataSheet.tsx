import {
  Delete,
  Edit,
  Engineering,
  Event,
  PrecisionManufacturing,
  Visibility
} from '@mui/icons-material'
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
  Tooltip,
  Grid,
  Paper,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  TextFieldProps
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

import { useFormik } from 'formik'
import * as yup from 'yup'

import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../config'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { bigToast, MySwal } from '../ExcelManipulation/Utils'

// Define interfaces

export interface CalibrationHistory {
  id: number
  date: string
  internalCode: string
  activity: string
  comments: string
  verifiedBy: string
}
export interface DataSheetData {
  id?: number
  pictureUrl: string
  internalCode: string
  equipmentName: string
  brand: string
  model: string
  serialNumber: string
  supplier: string
  manual: boolean
  magnitude: string
  units: string
  receivedDate: string
  inServiceDate: string
  location: string
  serviceType: string
  equipmentStatus: string
  operationRange: string
  accuracy: string
  resolution: string
  softwareFirmware: string
  storageTemperature: string
  storageHumidity: string
  operationTemperature: string
  operationHumidity: string
  storageOperationComment: string
  transportConditionsComment: string
  insuredValue: number
  maintenanceProvider: string
  maintenanceCycle: number
  calibrationProvider: string
  calibrationCycle: number
  calibrationHistories: CalibrationHistory[]
}

// API URL
const apiUrl = api()

// Validation Schema
const validationSchema = yup.object({
  pictureUrl: yup
    .string()
    .url('Ingrese una URL válida')
    .required('URL de la imagen es obligatoria'),
  internalCode: yup.string().required('Código interno es obligatorio'),
  equipmentName: yup.string().required('Nombre del equipo es obligatorio'),
  brand: yup.string().required('Marca es obligatoria'),
  model: yup.string().required('Modelo es obligatorio'),
  serialNumber: yup.string().required('Número de serie es obligatorio'),
  supplier: yup.string().required('Proveedor es obligatorio'),
  manual: yup.boolean().required('Este campo es obligatorio'),
  magnitude: yup.string().required('Magnitud es obligatoria'),
  units: yup.string().required('Unidades son obligatorias'),
  receivedDate: yup.date().required('Fecha de recepción es obligatoria'),
  inServiceDate: yup.date().required('Fecha en servicio es obligatoria'),
  location: yup.string().required('Ubicación es obligatoria'),
  serviceType: yup.string().required('Tipo de servicio es obligatorio'),
  equipmentStatus: yup.string().required('Estado del equipo es obligatorio'),
  operationRange: yup.string().required('Rango de operación es obligatorio'),
  accuracy: yup.string().required('Exactitud es obligatoria'),
  resolution: yup.string().required('Resolución es obligatoria'),
  softwareFirmware: yup.string().required('Software/Firmware es obligatorio'),
  storageTemperature: yup
    .string()
    .required('Temperatura de almacenamiento es obligatoria'),
  storageHumidity: yup
    .string()
    .required('Humedad de almacenamiento es obligatoria'),
  operationTemperature: yup
    .string()
    .required('Temperatura de operación es obligatoria'),
  operationHumidity: yup
    .string()
    .required('Humedad de operación es obligatoria'),
  storageOperationComment: yup
    .string()
    .required('Comentario de almacenamiento/operación es obligatorio'),
  transportConditionsComment: yup
    .string()
    .required('Comentario de condiciones de transporte es obligatorio'),
  insuredValue: yup.number().required('Valor asegurado es obligatorio'),
  maintenanceProvider: yup
    .string()
    .required('Proveedor de mantenimiento es obligatorio'),
  maintenanceCycle: yup
    .number()
    .required('Ciclo de mantenimiento es obligatorio'),
  calibrationProvider: yup
    .string()
    .required('Proveedor de calibración es obligatorio'),
  calibrationCycle: yup.number().required('Ciclo de calibración es obligatorio')
})

// Main component
const ListDataSheet: React.FC = () => {
  const navigate = useNavigate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<DataSheetData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<DataSheetData[]>(
    []
  )

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Fetch dataSheets data
  const fetchDataSheets = async () => {
    try {
      const response = await axios.get(`${apiUrl}/dataSheet`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        setTableData(response.data)
        setFilteredTableData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dataSheet data:', error)
    }
  }

  useEffect(() => {
    fetchDataSheets()
  }, [])

  const handleSaveRowEdits: MaterialReactTableProps<DataSheetData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axios.put(
            `${apiUrl}/dataSheet/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 200) {
            bigToast('Hoja de Datos Modificada Exitosamente!', 'success')
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al modificar la hoja de datos')
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

  const deleteDataSheet = async (rowIndex: number, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/dataSheet/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 204) {
        bigToast('Hoja de Datos Eliminada Exitosamente!', 'success')
        filteredTableData.splice(rowIndex, 1)
        setFilteredTableData([...filteredTableData])
      } else {
        console.error('Error al eliminar la hoja de datos')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<DataSheetData>) => {
      MySwal.fire({
        title: `¿Está seguro que desea eliminar la hoja de datos ${row.getValue('equipmentName')}?`,
        text: 'No podrá recuperar esta información una vez eliminada',
        showCancelButton: true,
        confirmButtonText: 'Sí'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteDataSheet(row.index, row.getValue('id'))
        }
      })
    },
    [filteredTableData]
  )

  const getCommonEditTextFieldProps = useCallback(
    ({ cell }: { cell: MRT_Cell<DataSheetData> }): TextFieldProps => ({
      error: !!validationErrors[cell.id],
      helperText: validationErrors[cell.id],
      onBlur: (event) => {
        const isValid = validateRequired(event.target.value)
        if (!isValid) {
          setValidationErrors({
            ...validationErrors,
            [cell.id]: `${cell.column.columnDef.header} es obligatorio`
          })
        } else {
          delete validationErrors[cell.id]
          setValidationErrors({
            ...validationErrors
          })
        }
      }
    }),
    [validationErrors]
  )

  const validateRequired = (value: string) => !!value.length

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<DataSheetData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 10,
        enableEditing: false
      },

      {
        accessorKey: 'internalCode',
        header: 'Código Interno',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'equipmentName',
        header: 'Nombre del Equipo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'brand',
        header: 'Marca',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'model',
        header: 'Modelo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'serialNumber',
        header: 'Número de Serie',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },

      // {
      //   accessorKey: 'serviceType',
      //   header: 'Tipo de Servicio',
      //   size: 150,
      //   muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      // },
      {
        accessorKey: 'equipmentStatus',
        header: 'Estado del Equipo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      }

      // {
      //   accessorKey: 'maintenanceCycle',
      //   header: 'Ciclo de Mantenimiento',
      //   size: 150,
      //   muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      // },
      // {
      //   accessorKey: 'calibrationProvider',
      //   header: 'Proveedor de Calibración',
      //   size: 150,
      //   muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      // },
      // {
      //   accessorKey: 'calibrationCycle',
      //   header: 'Ciclo de Calibración',
      //   size: 150,
      //   muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      // }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <>
      <MaterialReactTable
        localization={MRT_Localization_ES}
        initialState={{
          columnVisibility: { id: false, pictureUrl: false }
        }}
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
        editingMode='modal'
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
            <Tooltip arrow placement='right' title='Inspection/Maintenance'>
              <Link
                to={`${row.original.id}/inspection-maintenance`}
                // sx={{ color: 'blue' }}
              >
                <IconButton>
                  <Engineering />
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
        renderTopToolbarCustomActions={() => (
          <Box display='flex' alignItems='center' sx={{ gap: 2 }}>
            <Button
              variant='contained'
              onClick={() => setCreateModalOpen(true)}
              sx={{
                fontWeight: 'bold',
                color: '#DCFCE7',
                '&.MuiButtonBase-root': {
                  marginRight: '30px'
                }
              }}
            >
              Crear Nueva Hoja de Vida
            </Button>
            <Divider orientation='vertical' flexItem />
            <Tooltip arrow placement='right' title='Programa de Calibración'>
              <Link to='calibration-program'>
                <IconButton>
                  <PrecisionManufacturing />
                </IconButton>
              </Link>
            </Tooltip>
            <Link to='calibration-schedule'>
              <Tooltip
                arrow
                placement='right'
                title='Cronograma de Mantenimiento'
              >
                <IconButton>
                  <Event />
                </IconButton>
              </Tooltip>
            </Link>
          </Box>
        )}
      />
      <CreateNewDataSheetModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={fetchDataSheets} // Update to refetch data
      />
    </>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<DataSheetData>[]
  onClose: () => void
  onSubmit: () => void
  open: boolean
}

//example of creating a mui dialog modal for creating new rows
export const CreateNewDataSheetModal: React.FC<CreateModalProps> = ({
  open,
  columns,
  onClose,
  onSubmit
}) => {
  const apiUrl = api()
  const formik = useFormik({
    initialValues: {
      pictureUrl: '',
      internalCode: '',
      equipmentName: '',
      brand: '',
      model: '',
      serialNumber: '',
      supplier: '',
      manual: false,
      magnitude: '',
      units: '',
      receivedDate: '',
      inServiceDate: '',
      location: '',
      serviceType: '',
      equipmentStatus: '',
      operationRange: '',
      accuracy: '',
      resolution: '',
      softwareFirmware: '',
      storageTemperature: '',
      storageHumidity: '',
      operationTemperature: '',
      operationHumidity: '',
      storageOperationComment: '',
      transportConditionsComment: '',
      insuredValue: '',
      maintenanceProvider: '',
      maintenanceCycle: '',
      calibrationProvider: '',
      calibrationCycle: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await axios.post(`${apiUrl}/dataSheet`, values, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })

        if (response.status >= 200 && response.status < 300) {
          bigToast('Hoja de Datos Creada Correctamente', 'success')
          resetForm()
          onSubmit() // Refetch data after creation
          onClose()
        } else {
          bigToast('Error al crear la Hoja de Datos', 'error')
        }
      } catch (error) {
        bigToast('Error al crear la Hoja de Datos', 'error')
        console.error('Error al crear la Hoja de Datos:', error)
      }
    }
  })

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle textAlign='center'>Crear Nueva Hoja de Datos</DialogTitle>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {columns.map(
              (column) =>
                column.accessorKey &&
                column.accessorKey !== 'id' && (
                  <Grid item xs={12} md={6} key={column.accessorKey}>
                    {column.accessorKey === 'manual' ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.manual}
                            onChange={formik.handleChange}
                            name='manual'
                            onBlur={formik.handleBlur}
                            color='primary'
                          />
                        }
                        label='Tiene Manual'
                      />
                    ) : (
                      <TextField
                        label={column.header}
                        name={column.accessorKey}
                        value={
                          formik.values[
                            column.accessorKey as keyof typeof formik.values
                          ]
                        }
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched[
                            column.accessorKey as keyof typeof formik.values
                          ] &&
                          Boolean(
                            formik.errors[
                              column.accessorKey as keyof typeof formik.errors
                            ]
                          )
                        }
                        helperText={
                          formik.touched[
                            column.accessorKey as keyof typeof formik.values
                          ] &&
                          formik.errors[
                            column.accessorKey as keyof typeof formik.errors
                          ]
                        }
                        fullWidth
                        InputLabelProps={
                          column.accessorKey.includes('Date')
                            ? { shrink: true }
                            : undefined
                        }
                        type={
                          column.accessorKey.includes('Date') ? 'date' : 'text'
                        }
                      />
                    )}
                  </Grid>
                )
            )}
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button variant='contained' color='secondary' onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={formik.handleSubmit as any}
        >
          Crear Hoja de Datos
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ListDataSheet
