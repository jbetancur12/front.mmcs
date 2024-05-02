// @ts-nocheck
import {
  Cancel,
  CheckCircle,
  CloudUpload,
  Delete,
  FileDownload,
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
  Stack,
  TextField,
  Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useStore } from '@nanostores/react'
import axios, { AxiosError, type AxiosResponse } from 'axios'
import { differenceInDays, format } from 'date-fns'
import {
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { userStore } from '../store/userStore'
import AutoComplete from './AutoComplete'
import { api } from '../config'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import Loader from './Loader2'
import { Link } from 'react-router-dom'
import { Document, Page } from '@react-pdf/renderer'
import PDFViewer from './PDFViewer'
import AsyncSelect from 'react-select/async'
import AnalyzeExcelComponent from './Excel'

const minioUrl = import.meta.env.VITE_MINIO_URL

export function convertirCadena(cadena) {
  // Reemplazar espacios con guiones y convertir a minúsculas
  const cadenaFormateada = cadena.replace(/\s+/g, '-').toLowerCase()
  return cadenaFormateada
}

export const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`

// Define interfaces
export interface FileData {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: Date
  nextCalibrationDate: Date
  filePath: string
  customerId: number
  customer: {
    nombre: string
  }
  certificateTypeId: number
  deviceId: number
  // Nuevas propiedades para las relaciones
  user: {
    id: number
    nombre: string
    // Otras propiedades de User
  }
  device: {
    id: number
    name: string
    // Otras propiedades de Device
  }
  certificateType: {
    id: number
    name: string
    // Otras propiedades de Certificate
  }
}

interface ResourceOption {
  value: string
  label: string
}

// API URL
const apiUrl = api()

const styles = {
  container: (provided, state) => ({
    ...provided,
    width: '100%',
    marginRight: 10,
    height: 50,
    zIndex: 1000
  }),
  control: (provided, state) => ({
    ...provided,
    border: '1px solid #ccc',
    borderRadius: 5,
    height: 55
  }),
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? 'white' : 'black',
    backgroundColor: state.isSelected ? 'blue' : 'white'
  })
}

// Main component
const Table: React.FC = () => {
  const $userStore = useStore(userStore)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<FileData[]>([])
  const [loading, setLoading] = useState(false)

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFile = event.target.files?.[0];
  //   if (selectedFile) {
  //     setFile(selectedFile);
  //   }
  // };

  // Create a new file
  const onCreateFile = async (fileData: FileData) => {
    setLoading(true)
    try {
      const response = await axios.post(`${apiUrl}/files`, fileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 201) {
        setLoading(false)
        toast.success('Certificado Creado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
        fetchUsers() // Refresh data after creation
      } else {
        setLoading(false)
        console.error('Error al crear equipo')
      }
    } catch (error) {
      setLoading(false)
      console.error('Error de red:', error)
    }
  }

  // Fetch files data
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/files`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data)
      }
    } catch (error) {
      console.error('Error fetching file data:', error)
    }
  }

  // const updateUser = async (fileData: FileData) => {

  //   try {
  //     const response = await axios.put(`${apiUrl}/files/${fileData.id}`, fileData, {
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

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateNewRow = (values: FileData) => {
    onCreateFile(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<FileData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axios.put(
            `${apiUrl}/files/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 201) {
            toast.success('Equipo Modificado Exitosamente!', {
              duration: 4000,
              position: 'top-center'
            })
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
      const response = await axios.delete(`${apiUrl}/files/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 204) {
        toast.success('Archivo Eliminado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
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
    (row: MRT_Row<FileData>) => {
      if (!confirm(`Are you sure you want to delete ${row.getValue(3)}`)) {
        return
      }
      deleteUser(row.index, row.getValue(1))
      tableData.splice(row.index, 1)
      setTableData([...tableData])
    },
    [tableData]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<FileData>
    ): MRT_ColumnDef<FileData>['muiTableBodyCellEditTextFieldProps'] => {
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

  const handleDownload = async (row: any) => {
    const filePath = row.getValue(13)

    const partes = filePath.split('-')
    let resultado = ''

    if (partes.length > 1) {
      resultado = partes.slice(1).join('-')
    } else {
      resultado = filePath
    }

    try {
      const response: AxiosResponse<Blob> = await axios.get(
        `${apiUrl}/files/download/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          },
          responseType: 'blob' // Indicar que esperamos una respuesta binaria
        }
      )

      if ((response.statusText = 'OK')) {
        // Crear un objeto URL para el archivo descargado
        const url = window.URL.createObjectURL(new Blob([response.data]))

        // Crear un enlace en el DOM para descargar el archivo
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', resultado) // Nombre del archivo a descargar
        document.body.appendChild(link)

        // Simular el clic en el enlace para iniciar la descarga
        link.click()

        // Liberar el objeto URL y eliminar el enlace después de la descarga
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // Manejo de errores de Axios
        const axiosError = error as AxiosError
        if (axiosError.response) {
          // La solicitud recibió una respuesta del servidor
          toast.error(
            `Error al descargar el archivo: ${axiosError.response.statusText}`,
            {
              duration: 4000,
              position: 'top-center'
            }
          )
        } else {
          // La solicitud no recibió una respuesta del servidor
          toast.error(
            `Error de red al descargar el archivo: ${axiosError.message}`,
            {
              duration: 4000,
              position: 'top-center'
            }
          )
        }
      } else {
        // Manejo de otros errores
        toast.error(
          `Error desconocido al descargar el archivo: ${error.message}`,
          {
            duration: 4000,
            position: 'top-center'
          }
        )
      }
    }
  }

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<FileData>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        size: 10,
        enableEditing: false,
        id: 1
      },
      {
        id: 12,
        accessorKey: 'nextCalibrationDate', //access nested data with dot notation
        header: 'Proxima Fecha de Calibración',
        size: 350,
        Cell: ({ cell, row }) => {
          const now = new Date()
          const nextCalibrationDate = new Date(row.original.nextCalibrationDate)
          const daysRemaining = differenceInDays(nextCalibrationDate, now)
          const formattedCalibrationDate = format(
            nextCalibrationDate,
            'yyyy-MM-dd'
          )

          let icon
          if (daysRemaining > 45) {
            icon = <CheckCircle sx={{ color: 'green' }} />
          } else if (daysRemaining > 15) {
            icon = <Warning sx={{ color: 'orange' }} />
          } else {
            icon = <Cancel sx={{ color: 'red' }} />
          }

          return (
            <div className='flex flex-col '>
              <div>
                {icon}
                <span className='ml-2'>{formattedCalibrationDate}</span>
              </div>
              <span
                className={`mt-2 ${
                  daysRemaining < 0 ? 'text-red-500 font-bold' : ''
                }`}
              >
                {daysRemaining < 0
                  ? 'VENCIDO'
                  : `Días restantes: ${daysRemaining}`}
              </span>
            </div>
          )
        },
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),

        type: 'lastdate'
      },
      {
        accessorKey: 'customer.nombre', //access nested data with dot notation
        header: 'Compañia',
        size: 150,
        enableEditing: false,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),
        type: 'selectCustomerId',
        id: 2
      },
      {
        accessorKey: 'device.name', //access nested data with dot notation
        header: 'Equipo',
        enableEditing: false,
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),
        type: 'selectDeviceId',
        id: 3
      },
      {
        accessorKey: 'certificateType.name', //access nested data with dot notation
        header: 'Tipo de Certificado',
        size: 150,
        enableEditing: false,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),
        type: 'selectCertificateTypeId',
        id: 4
      },
      {
        id: 5,
        accessorKey: 'name', //access nested data with dot notation
        header: 'Nombre',
        enableEditing: false,
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 6,
        accessorKey: 'city', //access nested data with dot notation
        header: 'Ciudad',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 7,
        accessorKey: 'location', //access nested data with dot notation
        header: 'Ubicación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 8,
        accessorKey: 'sede', //access nested data with dot notation
        header: 'Sede',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 9,
        accessorKey: 'activoFijo', //access nested data with dot notation
        header: 'Activo Fijo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 10,
        accessorKey: 'serie', //access nested data with dot notation
        header: 'Serie',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 11,
        accessorKey: 'calibrationDate', //access nested data with dot notation
        header: 'Fecha de Calibración',
        size: 250,

        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),
        Cell: ({ cell }) => (
          <span>{cell.getValue<string>().substring(0, 10)}</span>
        ),

        type: 'date'
      },

      {
        id: 13,
        accessorKey: 'filePath', //access nested data with dot notation
        header: 'filePath',
        size: 150,
        hidden: true,
        enableEditing: false,
        muiTableBodyCellEditTextFieldProps: ({ cell, column }) => ({
          ...getCommonEditTextFieldProps(cell)
        }),
        // Cell : (w) => w.column.getIsVisible(),
        type: 'upload'
      }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <>
      <Document
        file={`${minioUrl}/first-bucket/1694483679897-56373cert-balanzacc-mcs-m-4624-23 (2) (1).pdf`}
      >
        <Page pageNumber={1} />
      </Document>
      <Toaster />
      <Loader loading={loading} />
      {/* <Pdf/> */}
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
        data={tableData}
        editingMode='modal' //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        positionActionsColumn='last'
        enableHiding={false}
        initialState={{
          columnVisibility: { filePath: false }
        }}
        renderRowActions={({ row }) => {
          return (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              {/* <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip> */}
              {$userStore.rol === 'admin' && (
                <Tooltip arrow placement='right' title='Delete'>
                  <IconButton
                    color='error'
                    onClick={() => handleDeleteRow(row)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip arrow placement='left' title='Descargar'>
                <IconButton onClick={() => handleDownload(row)}>
                  <FileDownload />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement='left' title='Ver archivos'>
                <Link to={`${row.original.id}`}>
                  <Visibility />
                </Link>
              </Tooltip>
            </Box>
          )
        }}
        // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Equipo</button>
        renderTopToolbarCustomActions={() => {
          if ($userStore.rol !== 'admin') return
          return (
            <button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded '
              onClick={() => setCreateModalOpen(true)}
            >
              Subir Nuevo Certificado
            </button>
          )
        }}
        renderDetailPanel={({ row }) => {
          return (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                maxWidth: '1000px'
              }}
            >
              <PDFViewer path={row.original.filePath} />
            </Box>
          )
        }}
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
  columns: MRT_ColumnDef<FileData>[]
  onClose: () => void
  onSubmit: (values: FileData) => void
  open: boolean
}

//example of creating a mui dialog modal for creating new rows
export const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState('option2')
  const [device, setDevice] = useState<any>({
    id: '',
    name: ''
  })

  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = ''
      return acc
    }, {} as any)
  )

  console.log('=>', values)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setSelectedFileName(selectedFile.name)
    }
  }

  function logFormData(formData: any) {
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }
  }

  const handleRadioChange = (event, accessorKey) => {
    setSelectedValue(event.target.value)

    // Obten el valor seleccionado como número entero
    const selectedOption = event.target.value

    // Calcula la nueva fecha en función de la opción seleccionada
    let newDate =
      values.calibrationDate !== ''
        ? new Date(values.calibrationDate)
        : new Date()

    if (selectedOption === 'option2') {
      // Suma un año
      newDate.setFullYear(newDate.getFullYear() + 1)
    } else if (selectedOption === 'option1') {
      // Suma 6 meses
      newDate.setMonth(newDate.getMonth() + 6)
    }

    // Actualiza el estado con la nueva fecha
    setValues({ ...values, [accessorKey]: newDate })
  }

  const handleChangeCalibrationDate = (e, accessorKey) => {
    let newDate = new Date(e)

    if (selectedValue === 'option2') {
      // Suma un año
      newDate.setFullYear(newDate.getFullYear() + 1)
    } else if (selectedValue === 'option1') {
      // Suma 6 meses
      newDate.setMonth(newDate.getMonth() + 6)
    }

    // Actualiza el estado con la nueva fecha
    setValues({
      ...values,
      ['nextCalibrationDate']: newDate,
      [accessorKey]: new Date(e)
    })
  }

  const handleSubmit = () => {
    //put your validation logic here

    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('city', values.city)
    formData.append('location', values.location)
    formData.append('sede', values.sede)
    formData.append('activoFijo', values.activoFijo)
    formData.append('serie', values.serie)
    formData.append('calibrationDate', values.calibrationDate)
    formData.append('nextCalibrationDate', values.nextCalibrationDate)
    formData.append('pdf', file as Blob)
    formData.append('customerId', values['customer.nombre'].toString())
    formData.append('customerName', values['customerName'])
    formData.append(
      'certificateTypeId',
      values['certificateType.name'].toString()
    )
    formData.append('deviceId', values['device.name'].toString())

    // .toISOString().split('T')[0]
    logFormData(formData)

    onSubmit(formData)
    onClose()
  }

  const sortedColumns = [...columns] // Creamos una copia del array original
  sortedColumns.sort((a, b) => a.id - b.id) // Ordenamos las columnas por su id

  const loadOptions = async (
    inputValue: string,
    resource: string,
    mapFunction: (item: any) => ResourceOption
  ): Promise<ResourceOption[]> => {
    return new Promise((resolve, reject) => {
      let timer
      const endpoint = `${apiUrl}/${resource}` // Construye la URL del endpoint
      const fetchData = async () => {
        try {
          const response = await axios.get(endpoint, {
            params: { q: inputValue },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          })
          const data = response.data
          const options = data.map((item: any) => mapFunction(item))
          console.log('🚀 ~ fetchData ~ options:', options)
          resolve(options) // Aplica la función de mapeo
        } catch (error) {
          console.error('Error al cargar opciones:', error)
          reject(error)
        }
      }
      if (timer) {
        clearTimeout(timer)
      }

      timer = setTimeout(fetchData, 1000) // Establecer el debounce en 1000ms
    })
  }

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Subir Nuevo Certificado</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem'
            }}
          >
            {sortedColumns.map((column, index) => {
              if (
                column.accessorKey !== 'id' &&
                column.accessorKey !== 'name'
              ) {
                switch (column.type) {
                  case 'date':
                    return (
                      <DatePicker
                        key={index}
                        label={column.header}
                        name={column.accessorKey}
                        value={values[column.accessorKey]}
                        onChange={(e) =>
                          handleChangeCalibrationDate(e, column.accessorKey)
                        }
                      />
                    )
                  case 'lastdate':
                    return (
                      <>
                        <DatePicker
                          key={index}
                          label={column.header}
                          name={column.accessorKey}
                          value={values[column.accessorKey]}
                          onChange={(e) =>
                            setValues({
                              ...values,
                              [column.accessorKey]: new Date(e)
                            })
                          }
                        />
                        <div class='flex justify-start mt-0'>
                          <div class='mb-[0.125rem] mr-4 inline-block min-h-[1.5rem] pl-[1.5rem]'>
                            <input
                              class="relative float-left -ml-[1.5rem] mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
                              type='radio'
                              name='inlineRadioOptions'
                              id='inlineRadio1'
                              value='option1'
                              checked={selectedValue === 'option1'}
                              onChange={(e) =>
                                handleRadioChange(e, column.accessorKey)
                              }
                            />
                            <label
                              class='mt-px inline-block pl-[0.15rem] hover:cursor-pointer'
                              for='inlineRadio1'
                            >
                              6 Meses
                            </label>
                          </div>

                          <div class='mb-[0.125rem] mr-4 inline-block min-h-[1.5rem] pl-[1.5rem]'>
                            <input
                              class="relative float-left -ml-[1.5rem] mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
                              type='radio'
                              name='inlineRadioOptions'
                              id='inlineRadio2'
                              value='option2'
                              checked={selectedValue === 'option2'}
                              onChange={(e) =>
                                handleRadioChange(e, column.accessorKey)
                              }
                            />
                            <label
                              class='mt-px inline-block pl-[0.15rem] hover:cursor-pointer'
                              for='inlineRadio2'
                            >
                              12 Meses
                            </label>
                          </div>
                        </div>
                      </>
                    )
                  case 'selectCustomerId':
                    return (
                      <AutoComplete
                        key={index}
                        endpoint={`${apiUrl}/customers`}
                        token={localStorage.getItem('accessToken')}
                        label='Buscar Cliente'
                        mapOption={(data) =>
                          data.map((item) => ({
                            id: item.id,
                            nombre: item.nombre
                          }))
                        }
                        //isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(option) => option.nombre}
                        name={column.accessorKey}
                        value={values[column.accessorKey]}
                        onClientSelection={(e) =>
                          setValues({
                            ...values,
                            [column.accessorKey]: e.id,
                            customerName: convertirCadena(e.nombre)
                          })
                        }
                      />
                    )

                  case 'selectDeviceId':
                    return (
                      // <AsyncSelect
                      //   cacheOptions
                      //   // defaultOptions
                      //   loadOptions={(inputValue) =>
                      //     loadOptions(inputValue, "devices", mapDevices)
                      //   }
                      //   onChange={(selectedOption: any) =>
                      //     setDevice({
                      //       id: selectedOption.value,
                      //       name: selectedOption.label,
                      //     })
                      //   }
                      //   placeholder="Buscar Producto"
                      //   // defaultValue={
                      //   //   id && {
                      //   //     value: index,
                      //   //     label: productName,
                      //   //   }
                      //   // }
                      //   styles={styles}
                      // />
                      <AutoComplete
                        key={index}
                        endpoint={`${apiUrl}/devices`}
                        token={localStorage.getItem('accessToken')}
                        label='Buscar Equipo'
                        mapOption={(data) =>
                          data.map((item: any) => ({
                            id: item.id,
                            name: item.name
                          }))
                        }
                        getOptionLabel={(option) => option.name}
                        name={column.accessorKey}
                        value={values[column.accessorKey]}
                        onClientSelection={(e) =>
                          setValues({ ...values, [column.accessorKey]: e.id })
                        }
                      />
                    )

                  case 'selectCertificateTypeId':
                    return (
                      <AutoComplete
                        key={index}
                        endpoint={`${apiUrl}/certificateTypes`}
                        token={localStorage.getItem('accessToken')}
                        label='Buscar Tipo de Certificado'
                        mapOption={(data) =>
                          data.map((item: any) => ({
                            id: item.id,
                            name: item.name
                          }))
                        }
                        //isOptionEqualToValue={(option, value) => option?.id?.toString() === (value?.id ?? value)?.toString()}
                        getOptionLabel={(option) => option.name}
                        name={column.accessorKey}
                        value={values[column.accessorKey]}
                        onClientSelection={(e) =>
                          setValues({ ...values, [column.accessorKey]: e.id })
                        }
                      />
                    )

                  case 'upload':
                    return (
                      <Button
                        key={index}
                        component='label'
                        variant='contained'
                        startIcon={<CloudUpload />}
                        href='#file-upload'
                        onChange={handleFileChange}
                        style={{
                          textTransform: 'none'
                        }}
                      >
                        {selectedFileName ? selectedFileName : 'Cargar Archivo'}
                        <VisuallyHiddenInput type='file' accept='.pdf' />
                      </Button>
                    )

                  default:
                    return (
                      <TextField
                        key={index}
                        label={column.header}
                        name={column.accessorKey}
                        value={values[column.accessorKey]}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [column.accessorKey]: e.target.value
                          })
                        }
                      />
                    )
                }
              }
            })}
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
          Subir Certificado
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

const mapDevices = (option: any): ResourceOption => ({
  value: option.id,
  label: option.name
})

export default Table
