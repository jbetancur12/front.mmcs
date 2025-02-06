import {
  CallMissedOutgoing,
  Cancel,
  CheckCircle,
  Delete,
  Download,
  Edit,
  Engineering,
  Event,
  ExitToApp,
  Inventory,
  MoreVert,
  PrecisionManufacturing,
  SyncAlt,
  Visibility,
  Warning
} from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  TextFieldProps,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  FormHelperText,
  Menu,
  ListItemIcon
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

import { useFormik } from 'formik'
import * as yup from 'yup'

import { Link } from 'react-router-dom'

import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { bigToast } from '../ExcelManipulation/Utils'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import useAxiosPrivate from '@utils/use-axios-private'

// Interfaces y tipos

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
  status: string
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
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
  invoiceUrl: string
}

// API URL

// Validation Schema
const validationSchema = yup.object({
  picture: yup.mixed().required('La imagen es obligatoria'),
  internalCode: yup
    .string()
    .required('Código interno es obligatorio')
    .default('Automatico'),
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

const menuOptions = [
  {
    value: 'Patrón Acreditación',
    text: 'Patrón Acreditación',
    route: 'patron-acreditacion'
  },
  {
    value: 'Patrón Trazabilidad',
    text: 'Patrón Trazabilidad',
    route: 'patron-trazabilidad'
  },
  {
    value: 'Patrón Primario',
    text: 'Patrón Primario',
    route: 'patron-primario'
  },
  {
    value: 'Patrón Secundario',
    text: 'Patrón Secundario',
    route: 'patron-secundario'
  },
  {
    value: 'Auxiliar Acreditación',
    text: 'Auxiliar Acreditación',
    route: 'auxiliar-acreditacion'
  },
  {
    value: 'Auxiliar Trazabilidad',
    text: 'Auxiliar Trazabilidad',
    route: 'auxiliar-trazabilidad'
  },
  {
    value: 'Instrumento Retenido',
    text: 'Instrumento Retenido',
    route: 'instrumento-retenido'
  }
]

// Main component
const ListDataSheet: React.FC = () => {
  const [inventoryAnchorEl, setInventoryAnchorEl] =
    useState<null | HTMLElement>(null)
  const [calibrationAnchorEl, setCalibrationAnchorEl] =
    useState<null | HTMLElement>(null)
  const [scheduleAnchorEl, setScheduleAnchorEl] = useState<null | HTMLElement>(
    null
  )

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<DataSheetData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<DataSheetData[]>(
    []
  )
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    () => {
      // Restaurar los filtros desde el localStorage al inicializar
      const savedFilters = localStorage.getItem('columnFiltersHV')
      return savedFilters ? JSON.parse(savedFilters) : []
    }
  )
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  const MySwal = withReactContent(Swal)
  const axiosPrivate = useAxiosPrivate()

  // Efectos

  useEffect(() => {
    const savedFilters = localStorage.getItem('columnFiltersHV')
    if (savedFilters) {
      setColumnFilters(JSON.parse(savedFilters))
    }
    fetchDataSheets()
  }, [])

  useEffect(() => {
    // Guardar los filtros en el localStorage cada vez que cambien
    localStorage.setItem('columnFiltersHV', JSON.stringify(columnFilters))
  }, [columnFilters])

  const fetchDataSheets = async () => {
    try {
      const response = await axiosPrivate.get(`/dataSheet`)

      if (response.statusText === 'OK') {
        setTableData(response.data)
        setFilteredTableData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dataSheet data:', error)
    }
  }

  const handleInventoryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setInventoryAnchorEl(event.currentTarget)
  }

  const handleCalibrationClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setCalibrationAnchorEl(event.currentTarget)
  }

  const handleScheduleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setScheduleAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setInventoryAnchorEl(null)
    setCalibrationAnchorEl(null)
    setScheduleAnchorEl(null)
  }

  const handleSaveRowEdits: MaterialReactTableProps<DataSheetData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axiosPrivate.put(
            `/dataSheet/${values.id}`,
            updatedValues,
            {}
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
      const response = await axiosPrivate.delete(`/dataSheet/${id}`)

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
  const handleUpload = async ({
    id,
    image
  }: {
    id: number | undefined
    image: File | null
  }) => {
    if (!image) {
      return
    }
    const formData = new FormData()
    formData.append('picture', image)
    try {
      const response = await axiosPrivate.put(
        `/dataSheet/${id}/update-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.status >= 200 && response.status < 300) {
        bigToast('Foto subida correctamente', 'success')
        // setImage(response.data.dataSheet.pictureUrl)
      } else {
        bigToast('Error al subir la foto', 'error')
      }
    } catch (error) {
      console.error('Error al subir la foto:', error)
      bigToast('Error al subir la foto', 'error')
    }
  }

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
        accessorKey: 'pictureUrl',
        header: 'URL de la Imagen',
        enableEditing: false,
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'invoiceUrl',
        header: 'Factura',
        size: 20,
        enableEditing: false,
        enableColumnDragging: false,
        enableGlobalFilter: false,
        enableColumnActions: false,
        Cell: ({ cell }) =>
          cell.getValue() ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle color='success' />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Cancel color='error' />
            </div>
          )
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        enableEditing: false,
        enableColumnDragging: false,
        enableGlobalFilter: false,
        enableColumnActions: false,
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps,
        Cell: ({ cell, row }) => {
          const isDue =
            row.original.isInspectionDueSoon ||
            row.original.isCalibrationDueSoon

          let isDueMessage = ''
          if (
            row.original.isInspectionDueSoon &&
            row.original.isCalibrationDueSoon
          ) {
            isDueMessage =
              'Calibración y mantenimiento vencidos o prontos a vencer'
          } else if (row.original.isCalibrationDueSoon) {
            isDueMessage = 'Calibración vencida o pronta a vencer'
          } else {
            isDueMessage = 'Mantenimiento vencido o pronto a vencer'
          }
          const status = cell.getValue<string>()
          const color =
            status === 'available'
              ? 'green'
              : status === 'busy'
                ? 'red'
                : 'gray'

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: color,
                  marginRight: 8
                }}
              />
              {isDue && (
                <>
                  <Divider orientation='vertical' flexItem />
                  <Tooltip title={isDueMessage}>
                    <Warning sx={{ color: 'red' }} />
                  </Tooltip>
                </>
              )}
            </div>
          )
        }
      },
      {
        accessorKey: 'internalCode',
        header: 'Código Interno',
        enableEditing: false,
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

      {
        accessorKey: 'supplier',
        header: 'Proveedor',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'manual',
        header: 'Manual',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'magnitude',
        header: 'Magnitud',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'units',
        header: 'Unidades',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'receivedDate',
        header: 'Fecha de Recepción',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'inServiceDate',
        header: 'Fecha en Servicio',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'location',
        header: 'Ubicación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'serviceType',
        header: 'Tipo de Servicio',
        size: 150,
        Edit: ({ cell, row, column, table }) => {
          // Función para manejar el cambio del select y actualizar el valor de la celda
          const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            // Actualizar el valor en el cache de edición de la fila
            row._valuesCache[column.id] = event.target.value

            // Actualizar el estado de edición en la tabla
            table.setEditingRow({ ...row })
          }

          return (
            <TextField
              fullWidth
              select
              label='Tipo de Servicio'
              value={cell.getValue()?.toString() || ''}
              onChange={handleChange}
            >
              {menuOptions.map((option) => (
                <MuiMenuItem key={option.value} value={option.value}>
                  {option.text}
                </MuiMenuItem>
              ))}
            </TextField>
          )
        }
      },
      {
        accessorKey: 'equipmentStatus',
        header: 'Estado del Equipo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'operationRange',
        header: 'Rango de Operación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'accuracy',
        header: 'Exactitud',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'resolution',
        header: 'Resolución',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'softwareFirmware',
        header: 'Software/Firmware',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'storageTemperature',
        header: 'Temperatura de Almacenamiento',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'storageHumidity',
        header: 'Humedad de Almacenamiento',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'operationTemperature',
        header: 'Temperatura de Operación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'operationHumidity',
        header: 'Humedad de Operación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'storageOperationComment',
        header: 'Comentario de Almacenamiento/Operación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'transportConditionsComment',
        header: 'Comentario de Condiciones de Transporte',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'insuredValue',
        header: 'Valor Asegurado',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'maintenanceProvider',
        header: 'Proveedor de Mantenimiento',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'maintenanceCycle',
        header: 'Ciclo de Mantenimiento',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'calibrationProvider',
        header: 'Proveedor de Calibración',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'calibrationCycle',
        header: 'Ciclo de Calibración',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      }
    ],
    [getCommonEditTextFieldProps]
  )

  const handleUploadPdf = async (id: number, pdfFile: File) => {
    const formData = new FormData()
    formData.append('invoice', pdfFile)

    try {
      const response = await axiosPrivate.put(
        `/dataSheet/${id}/update-invoice`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (response.status === 200) {
        bigToast('PDF subido exitosamente', 'success')
        // Actualizar estado si es necesario
      }
    } catch (error) {
      bigToast('Error subiendo PDF', 'error')
    }
  }

  const RowActions = ({ row, table }: { row: any; table: any }) => {
    const [localAnchorEl, setLocalAnchorEl] = useState<null | HTMLElement>(null)

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      setLocalAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
      setLocalAnchorEl(null)
    }

    const handleDownloadPdf = async (id: number) => {
      try {
        const response = await axiosPrivate.get(
          `/dataSheet/download-invoice/${id}`,
          {
            responseType: 'blob' // Importante para manejar archivos binarios
          }
        )

        // Crear un blob con la respuesta
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `factura-${id}.pdf`) // Nombre del archivo
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link) // Eliminar el enlace después de la descarga
      } catch (error) {
        bigToast('Error descargando la factura', 'error')
      }
    }

    return (
      <Box sx={{ position: 'relative' }}>
        <IconButton onClick={handleMenuOpen}>
          <MoreVert />
        </IconButton>

        <Menu
          anchorEl={localAnchorEl}
          open={Boolean(localAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          slotProps={{
            paper: {
              sx: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                minWidth: '200px'
              }
            }
          }}
          disablePortal
        >
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Visibility fontSize='small' />
            </ListItemIcon>
            Ver
          </MuiMenuItem>

          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/inspection-maintenance`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Engineering fontSize='small' />
            </ListItemIcon>
            Inspection/Maintenance
          </MuiMenuItem>

          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/in-out`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <ExitToApp fontSize='small' />
            </ListItemIcon>
            In/Out
          </MuiMenuItem>

          {row.original.invoiceUrl && (
            <MuiMenuItem
              onClick={() => {
                handleMenuClose()
                handleDownloadPdf(row.original.id)
              }}
            >
              <ListItemIcon>
                <Download fontSize='small' />
              </ListItemIcon>
              Descargar Factura
            </MuiMenuItem>
          )}

          <Divider />

          <MuiMenuItem
            onClick={() => {
              handleMenuClose()
              MySwal.fire({
                title: 'Seleccione una opción',
                showCancelButton: true,
                confirmButtonText: 'Editar Imagen',
                cancelButtonText: 'Editar Otras Opciones',
                showDenyButton: true, // Nuevo botón
                denyButtonText: 'Subir Factura PDF',
                denyButtonColor: '#3085d6'
              }).then((result) => {
                if (result.isConfirmed) {
                  let imageFile: File | null = null
                  // Lógica para abrir el modal de edición de imagen
                  MySwal.fire({
                    title: 'Editar Imagen',
                    html: `
                      <div id="mui-file-input">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                          <label for="imageInput" style="cursor: pointer;">
                            <img
                              id="avatarImage"
                              alt="Foto de equipo"
                              src="/images/no-img.jpg"
                              style="width: 100px; height: 100px; margin-bottom: 8px;"
                            />
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            id="imageInput"
                            style="display: none;"
                          />
                        </div>
                      </div>
                    `,
                    didOpen: () => {
                      const imageInput = document.getElementById(
                        'imageInput'
                      ) as HTMLInputElement
                      const avatarImage = document.getElementById(
                        'avatarImage'
                      ) as HTMLImageElement

                      if (imageInput && avatarImage) {
                        imageInput.addEventListener('change', function (e) {
                          const target = e.target as HTMLInputElement

                          if (target.files && target.files.length > 0) {
                            imageFile = target.files[0]

                            // Crear un URL para la imagen seleccionada
                            const newImageUrl = URL.createObjectURL(imageFile)

                            // Actualizar el src del avatar
                            avatarImage.src = newImageUrl

                            // Aquí podrías realizar otras acciones como actualizar el estado o almacenar la imagen
                          }
                        })
                      } else {
                        console.error(
                          "No se pudo encontrar el elemento 'imageInput' o 'avatarImage'."
                        )
                      }
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Actualizar',
                    cancelButtonText: 'Cancelar',
                    preConfirm: () => {
                      if (!imageFile) {
                        MySwal.showValidationMessage(
                          'Por favor selecciona una imagen antes de actualizar.'
                        )
                        return false // Previene la resolución de la promesa
                      }
                      return new Promise((resolve) => {
                        if (imageFile) {
                          // Subir la imagen seleccionada a la API
                          handleUpload({
                            id: row.original.id,
                            image: imageFile
                          }).then(() => resolve(undefined)) // Resolviendo con undefined
                        } else {
                          resolve(undefined) // Resolviendo con undefined
                        }
                      })
                    }
                  })
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                  table.setEditingRow(row)
                } else if (result.isDenied) {
                  let pdfFile: File | null = null

                  MySwal.fire({
                    title: 'Subir Factura PDF',
                    html: `
            <input type="file" 
                   id="pdfInput" 
                   accept="application/pdf" 
                   style="display: none;"
            >
            <label for="pdfInput" 
                   style="cursor: pointer;
                          padding: 10px;
                          border: 2px dashed #ccc;
                          display: block;
                          text-align: center;">
              📁 Seleccionar archivo PDF
            </label>
            <div id="fileName" 
             style="color: #666; 
                    font-size: 0.9em;
                    text-align: center;
                    word-break: break-all;">
          Ningún archivo seleccionado
        </div>
          `,
                    didOpen: () => {
                      const pdfInput = document.getElementById(
                        'pdfInput'
                      ) as HTMLInputElement
                      const fileNameDiv = document.getElementById('fileName')
                      pdfInput.addEventListener('change', (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files?.length) {
                          pdfFile = target.files[0]
                          if (fileNameDiv) {
                            fileNameDiv.textContent = pdfFile.name
                            fileNameDiv.style.color = '#2e7d32' // Color verde para indicar selección
                            fileNameDiv.style.fontWeight = '500'
                          }
                        } else {
                          if (fileNameDiv) {
                            fileNameDiv.textContent =
                              'Ningún archivo seleccionado'
                            fileNameDiv.style.color = '#666'
                            fileNameDiv.style.fontWeight = 'normal'
                          }
                        }
                      })
                    },
                    preConfirm: () => {
                      if (!pdfFile) {
                        MySwal.showValidationMessage(
                          'Debe seleccionar un archivo PDF'
                        )
                        return false
                      }
                      if (pdfFile?.type !== 'application/pdf') {
                        MySwal.showValidationMessage(
                          'Solo se permiten archivos PDF'
                        )
                        return false
                      }
                      // Lógica para subir el PDF
                      return handleUploadPdf(row.original.id, pdfFile)
                    }
                  })
                }
              })
            }}
          >
            <ListItemIcon>
              <Edit fontSize='small' />
            </ListItemIcon>
            Editar
          </MuiMenuItem>

          <MuiMenuItem
            onClick={() => {
              handleDeleteRow(row)
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <Delete fontSize='small' />
            </ListItemIcon>
            Eliminar
          </MuiMenuItem>
        </Menu>
      </Box>
    )
  }

  return (
    <>
      <MaterialReactTable
        onColumnFiltersChange={setColumnFilters} //hoist internal columnFilters state to your state
        state={{ columnFilters }}
        localization={MRT_Localization_ES}
        initialState={{
          columnVisibility: {
            id: false,
            pictureUrl: false,
            supplier: false,
            manual: false,
            magnitude: false,
            units: false,
            receivedDate: false,
            inServiceDate: false,
            location: false,
            serviceType: false,
            equipmentStatus: false,
            operationRange: false,
            accuracy: false,
            resolution: false,
            softwareFirmware: false,
            storageTemperature: false,
            storageHumidity: false,
            operationTemperature: false,
            operationHumidity: false,
            storageOperationComment: false,
            transportConditionsComment: false,
            insuredValue: false,
            maintenanceProvider: false,
            // maintenanceCycle: false,
            calibrationProvider: false
            // calibrationCycle: false
          }
        }}
        displayColumnDefOptions={{
          'mrt-row-actions': {
            header: '',
            muiTableHeadCellProps: {
              align: 'center'
            },

            size: 10
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
          <RowActions row={row} table={table} />
        )}
        renderTopToolbarCustomActions={() => (
          <Box
            display='flex'
            alignItems='center'
            sx={{ gap: 2, position: 'relative' }}
          >
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
            <Tooltip arrow placement='right' title='Inventario'>
              <div>
                <IconButton onClick={handleInventoryClick}>
                  <Inventory />
                </IconButton>
                <Menu
                  anchorEl={inventoryAnchorEl}
                  open={Boolean(inventoryAnchorEl)}
                  onClose={handleClose}
                >
                  {[
                    ...[
                      {
                        value: 'Inventario General',
                        text: 'Inventario General',
                        route: 'inventory'
                      }
                    ],
                    ...menuOptions
                  ].map((option) => (
                    <MuiMenuItem
                      key={option.value}
                      onClick={() => handleClose()}
                      component={Link}
                      to={`inventory/${option.route === 'inventory' ? '' : option.route}`}
                      state={tableData}
                    >
                      {option.text}
                    </MuiMenuItem>
                  ))}
                </Menu>
              </div>
            </Tooltip>
            <Tooltip arrow placement='right' title='Programa de Calibración'>
              <div>
                <IconButton onClick={handleCalibrationClick}>
                  <PrecisionManufacturing />
                </IconButton>
                <Menu
                  anchorEl={calibrationAnchorEl}
                  open={Boolean(calibrationAnchorEl)}
                  onClose={handleClose}
                >
                  {[
                    ...[
                      {
                        value: 'Cronograma General',
                        text: 'Cronograma General',
                        route: 'calibration-program'
                      }
                    ],
                    ...menuOptions
                  ].map((option) => (
                    <MuiMenuItem
                      key={option.value}
                      onClick={() => handleClose()}
                      component={Link}
                      to={`calibration-program/${option.route === 'calibration-program' ? '' : option.route}`}
                      state={tableData}
                    >
                      {option.text}
                    </MuiMenuItem>
                  ))}
                </Menu>
              </div>
            </Tooltip>
            <Tooltip
              arrow
              placement='right'
              title='Cronograma de Mantenimiento'
            >
              <div>
                <IconButton onClick={handleScheduleClick}>
                  <Event />
                </IconButton>
                <Menu
                  anchorEl={scheduleAnchorEl}
                  open={Boolean(scheduleAnchorEl)}
                  onClose={handleClose}
                >
                  {[
                    ...[
                      {
                        value: 'Cronograma General',
                        text: 'Cronograma General',
                        route: 'maintenance-schedule'
                      }
                    ],
                    ...menuOptions
                  ].map((option) => (
                    <MuiMenuItem
                      key={option.value}
                      onClick={() => handleClose()}
                      component={Link}
                      to={`maintenance-schedule/${option.route === 'maintenance-schedule' ? '' : option.route}`}
                      state={tableData}
                    >
                      {option.text}
                    </MuiMenuItem>
                  ))}
                </Menu>
              </div>
            </Tooltip>
            <Divider orientation='vertical' flexItem />
            <Tooltip arrow placement='right' title='Inventario Prestamo'>
              <Link to='inventory-leasing'>
                <IconButton>
                  <SyncAlt />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip arrow placement='right' title='Equipos en Prestamo'>
              <Link to='devices-on-loan'>
                <IconButton>
                  <CallMissedOutgoing />
                </IconButton>
              </Link>
            </Tooltip>
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
  const axiosPrivate = useAxiosPrivate()
  const formik = useFormik({
    initialValues: {
      picture: null as File | null,
      internalCode: 'Automático', // Este valor es solo para visualización y no será enviado al backend
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
      calibrationCycle: '',
      status: 'available'
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      // Excluir internalCode

      const formData = new FormData()
      Object.keys(values).forEach((key) => {
        formData.append(key, (values as any)[key])
      })

      try {
        const response = await axiosPrivate.post(`/dataSheet`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
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
                column.accessorKey !== 'id' &&
                (column.accessorKey === 'pictureUrl' ? (
                  <Grid item xs={12} key={column.accessorKey}>
                    <div className='flex items-center justify-center mb-4'>
                      <label htmlFor='fileInput' className='cursor-pointer'>
                        <Avatar
                          alt='Foto de equipo'
                          src={
                            formik.values.picture
                              ? URL.createObjectURL(formik.values.picture)
                              : ''
                          } // Mostramos la foto de perfil seleccionada
                          sx={{ width: 100, height: 100, mb: 2 }}
                        />
                      </label>
                      <input
                        id='fileInput'
                        type='file'
                        accept='image/*'
                        onChange={(event) => {
                          const file = (event.currentTarget as HTMLInputElement)
                            .files?.[0]
                          formik.setFieldValue('picture', file)
                        }}
                        className='hidden'
                      />
                    </div>
                    {formik.touched.picture && formik.errors.picture && (
                      <div className='text-red-500 flex items-center justify-center text-sm'>
                        {formik.errors.picture}
                      </div>
                    )}
                  </Grid>
                ) : column.accessorKey === 'internalCode' ? (
                  <Grid item xs={12} md={6} key={column.accessorKey}>
                    <TextField
                      label={column.header}
                      name={column.accessorKey}
                      value='Automático'
                      disabled
                      fullWidth
                    />
                  </Grid>
                ) : (
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
                    ) : column.accessorKey === 'status' ? (
                      <TextField
                        disabled
                        label={column.header}
                        name={column.accessorKey}
                        value='available'
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
                    ) : column.accessorKey === 'serviceType' ? ( // Handle generic field
                      <Grid item xs={12} md={12} key={column.accessorKey}>
                        <FormControl fullWidth>
                          <InputLabel>{column.header}</InputLabel>
                          <Select
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
                          >
                            <MuiMenuItem value='Patrón Acreditación'>
                              Patrón Acreditación
                            </MuiMenuItem>
                            <MuiMenuItem value='Patrón Trazabilidad'>
                              Patrón Trazabilidad
                            </MuiMenuItem>
                            <MuiMenuItem value='Patrón Primario'>
                              Patrón Primario
                            </MuiMenuItem>
                            <MuiMenuItem value='Patrón Secundario'>
                              Patrón Secundario
                            </MuiMenuItem>
                            <MuiMenuItem value='Auxiliar Acreditación'>
                              Auxiliar Acreditación
                            </MuiMenuItem>
                            <MuiMenuItem value='Auxiliar Trazabilidad'>
                              Auxiliar Trazabilidad
                            </MuiMenuItem>
                            <MuiMenuItem value='Instrumento Retenido'>
                              Instrumento Retenido
                            </MuiMenuItem>
                            <MuiMenuItem value='Equipo de Prestamo'>
                              Equipo de Prestamo
                            </MuiMenuItem>
                          </Select>
                          <FormHelperText>
                            {formik.touched[
                              column.accessorKey as keyof typeof formik.values
                            ] &&
                              formik.errors[
                                column.accessorKey as keyof typeof formik.values
                              ]}
                          </FormHelperText>
                        </FormControl>
                      </Grid>
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
                ))
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
