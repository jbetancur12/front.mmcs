import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AsyncSelect from 'react-select/async'
import { api } from '../config'
import axios from 'axios'
import { DatePicker } from '@mui/x-date-pickers'

import { Add, CloudUpload, Warning } from '@mui/icons-material'
import ModalCustomer from '../Components/ModalCustomer'
import { AnalyzeExcelComponentProps } from '../Components/ExcelManipulation/Types'
import { ResourceOption } from '../utils/loadOptions'
import { bigToast, styles } from '../Components/ExcelManipulation/Utils'
import ModalDevice from '../Components/ModalDevice'
import { VisuallyHiddenInput } from '../Components/TableFiles'
import XlsxPopulate from 'xlsx-populate'
import { TemplateData } from '../Components/Templates'

// Importa los componentes de MUI

const apiUrl = api()

const AnalyzeExcelComponent: React.FC<AnalyzeExcelComponentProps> = ({
  dataReceived,
  hideUpload,
  selectedFile,
  isFile,
  setFileNames,
  fileNames
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [filePdf, setFilePdf] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [data2, setData2] = useState<CertificateTemplateData>(
    {} as CertificateTemplateData
  )
  const [city, setCity] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [headquarters, setHeadquartes] = useState<string>('Sin Información')
  const [fixedAsset, setFixedAsset] = useState<string>('')
  const [serialNumber, setSerialNumber] = useState<string>('')
  const [certificateDate, setCertificateDate] = useState<Date | null>(null)
  const [missedData, setMissedData] = useState<{
    device: string
    customer: string
  }>({ device: '', customer: '' })
  const [missedData2, setMissedData2] = useState<{
    customer: string
  }>({ customer: '' })
  const [device, setDevice] = useState<DeviceOption | null>(null)
  const [customer, setCustomer] = useState<ResourceOption | null>(null)
  const [typeOfCertificate, setTypeOfCertificate] = useState<{
    id: string
    name: string
  } | null>({ id: '3', name: 'Calibración' })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [openModalCustomer, setOpenModalCustomer] = useState(false)
  const [openModalDevice, setOpenModalDevice] = useState(false)

  const validateFields = () => {
    if (
      !city ||
      !location ||
      !headquarters ||
      !fixedAsset ||
      !serialNumber ||
      !certificateDate ||
      !customer ||
      !device ||
      !typeOfCertificate ||
      !filePdf
    ) {
      setValidationError('Todos los campos son obligatorios')
      return false
    }
    return true
  }

  useEffect(() => {
    setData(dataReceived as any[])
  }, [dataReceived])

  const loadOptions = async (
    inputValue: string,
    resource: string,
    mapFunction: (item: any) => ResourceOption | DeviceOption
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

  // const readExcel = async (file: File) => {
  //   await XlsxPopulate.fromDataAsync(file, {
  //     password: 'metrologia2024'
  //   }).then((workbook) => {
  //     const city = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.city as string)
  //       .value()

  //     const location = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.location as string)
  //       .value()

  //     const sede = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.sede as string)

  //     const activoFijo = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.activoFijo as string)

  //     const serie = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.serie as string)

  //     const calibrationDate = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.calibrationDate as string)
  //       .value()

  //     const solicitante = workbook
  //       .sheet('CERTIFICADO')
  //       .cell(device?.certificateTemplate.solicitante as string)
  //       .value()

  //     const info = {
  //       city,
  //       location,
  //       sede,
  //       activoFijo,
  //       serie,
  //       calibrationDate,
  //       solicitante
  //     }
  //     return info
  //   })
  // }

  const readExcel = async (file: File) => {
    if (!device) {
      throw new Error('Device is null')
    }

    const getValueFromCell = (
      workbook: any,
      field: keyof typeof device.certificateTemplate
    ) => {
      // ANCHOR // ! Probando buscar entre celdas
      const sheet = workbook.sheet('CERTIFICADO')
      for (let row = 8; row <= 14; row++) {
        const cell = sheet.cell(`A${row}`)
        const cellValue: string = cell.value()
        if (cellValue && cellValue.includes('Instrumento')) {
          for (let col of ['B', 'C', 'D']) {
            const value = sheet.cell(`${col}${row}`)
            if (value.value()) {
              device.certificateTemplate['instrumento'] = `${col}${row}`
              break
            }
          }
        }
      }
      // ! Fin de prueba

      return workbook
        .sheet('CERTIFICADO')
        .cell(device.certificateTemplate[field])
        .value()
    }

    return await XlsxPopulate.fromDataAsync(file, {
      password: 'metrologia2024'
    }).then((workbook) => {
      const fields: (keyof typeof device.certificateTemplate)[] = [
        'city',
        'location',
        'sede',
        'activoFijo',
        'serie',
        'calibrationDate',
        'solicitante',
        'instrumento'
      ]
      const info = fields.reduce((acc, field) => {
        acc[field] = getValueFromCell(workbook, field)
        return acc
      }, {} as any)

      return info
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0]

      setFile(uploadedFile)

      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target) {
          // const binaryString = e.target.result as string // Asegúrate de que sea de tipo string

          const cells = await readExcel(uploadedFile)
          console.log('🚀 ~ reader.onload= ~ cells:', cells)
          setData2(cells)
          // const workbook = XLSX.read(binaryString, {
          //   type: 'binary',
          //   password: '123456'
          // })

          // const worksheet = workbook.Sheets['CC']

          // const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          //   header: 1,
          //   raw: false,
          //   dateNF: 'yyyy-mm-dd'
          // })

          // setData(jsonData)
        }
      }
      reader.readAsBinaryString(uploadedFile)
    }
  }

  const dataReturned = (data: any) => {
    setCustomer({ value: data.id, label: data.nombre })
    setMissedData({ ...missedData, customer: '' })
  }

  const dataReturnedDevice = (data: any) => {
    setDevice({
      value: data.id,
      label: data.name,
      certificateTemplate: data.certificateTemplate
    })
    setMissedData({ ...missedData, device: '' })
  }

  // const FIELD_INDEX = 0
  // const VALUE_INDEX = 2
  // const CUSTOMER_INDEX = 30
  // const DEVICE_INDEX = 11

  // const setFieldValue = (field: string, value: any) => {
  //   switch (field) {
  //     case 'Instrumento:':
  //       return value
  //     case 'Solicitante:':
  //       return value
  //     case 'Código Interno:':
  //       setFixedAsset(value)
  //       break
  //     case 'Ubicación:':
  //       setLocation(value)
  //       break
  //     case 'Ciudad/Pais:':
  //       setCity(value)
  //       break
  //     case 'Fecha de expedición:':
  //       setCertificateDate(new Date(value))
  //       break
  //     case 'Serie:':
  //       setSerialNumber(value)
  //       break
  //     default:
  //       break
  //   }
  // }

  const analyzeCells2 = async () => {
    if (Object.keys(data2).length > 0) {
      let customer = ''
      setCity(data2.city)
      setLocation(data2.location)
      setHeadquartes(data2.sede)
      setFixedAsset(data2.activoFijo)
      setSerialNumber(data2.serie)
      setCertificateDate(new Date(data2.calibrationDate))
      customer = data2.solicitante
      const results: any = await fetchCustomer(customer)
      const missed = { customer: '' }

      if (results.length > 0) {
        setCustomer({
          value: results[0].id,
          label: results[0].nombre
        })
      } else {
        missed.customer = data2.solicitante
      }

      setMissedData2(missed)
    }
  }

  // const analyzeCells = async () => {
  //   if (data?.length > 0) {
  //     let device = ''
  //     let customer = ''

  //     for (let i = 0; i <= 50; i++) {
  //       let subArray = data[i]
  //       let field = subArray[FIELD_INDEX]
  //       let value = subArray[VALUE_INDEX]

  //       if (field === 'Instrumento:' || field === 'Solicitante:') {
  //         let result = setFieldValue(field, value)
  //         if (field === 'Instrumento:') {
  //           device = result
  //         } else {
  //           customer = result
  //         }
  //       } else {
  //         setFieldValue(field, value)
  //       }
  //     }

  //     const results: any = await findCustomerAndDevice(customer, device)
  //     const missed = { device: '', customer: '' }

  //     if (results[0].value.length > 0) {
  //       setCustomer({
  //         value: results[0].value[0].id,
  //         label: results[0].value[0].nombre
  //       })
  //     } else {
  //       missed.customer = data[CUSTOMER_INDEX][VALUE_INDEX]
  //     }

  //     if (results[1].value.length > 0) {
  //       setDevice({
  //         value: results[1].value[0].id,
  //         label: results[1].value[0].name,
  //         certificateTemplate: results[1].value[0].certificateTemplate
  //       })
  //     } else {
  //       missed.device = data[DEVICE_INDEX][VALUE_INDEX]
  //     }

  //     setMissedData(missed)
  //   }
  // }

  const fetchCustomer = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/customers`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const customers = response.data

      return customers
    } catch (error) {
      console.error('Error while searching for device:', error)
      return []
    }
  }

  const fetchDevice = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/devices`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const devices = response.data
      return devices
    } catch (error) {
      console.error('Error while searching for device:', error)
      return []
    }
  }

  // const findCustomerAndDevice = async (customer: string, device: string) => {
  //   try {
  //     const results = await Promise.allSettled([
  //       fetchCustomer(customer),
  //       fetchDevice(device)
  //     ])
  //     return results
  //   } catch (error) {
  //     console.error('Error while searching for device:', error)
  //   }
  // }

  useEffect(() => {
    analyzeCells2()
  }, [data2])

  const resetForm = () => {
    setCity('')
    setLocation('')
    setHeadquartes('Sin Información')
    setFixedAsset('')
    setSerialNumber('')
    setCertificateDate(null)
    setMissedData({ device: '', customer: '' })
    setMissedData2({ customer: '' })
    setDevice(null)
    setCustomer(null)
    setTypeOfCertificate({ id: '3', name: 'Calibración' })
    setValidationError(null)
  }

  const removeSelectedFile = () => {
    if (setFileNames && fileNames && selectedFile) {
      setFileNames(fileNames.filter((name) => name !== selectedFile))
    }
  }

  const postData = async (data: any) => {
    return await axios.post(`${apiUrl}/files/raw`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      setFilePdf(selectedFile)
      setSelectedFileName(selectedFile.name)
    }
  }

  const onSubmit = async () => {
    if (!validateFields()) {
      return
    }

    setValidationError(null)

    const nextCalibrationDate = certificateDate?.setMonth(
      certificateDate.getMonth() + 12
    )

    const data = {
      city,
      sede: headquarters,
      location: location || 'SIN INFORMACIÓN',
      activoFijo: fixedAsset || 'SIN INFORMACIÓN',
      serie: serialNumber || 'SIN INFORMACIÓN',
      calibrationDate: certificateDate,
      nextCalibrationDate: nextCalibrationDate,
      customerId: customer?.value,
      deviceId: device?.value,
      certificateTypeId: typeOfCertificate?.id,
      name:
        selectedFile?.replace(/\.[^/.]+$/, '.pdf') ||
        file?.name.replace(/\.[^/.]+$/, '.pdf'),
      replace: false
    }

    try {
      const response = await postData(data)

      if (response.status >= 200 && response.status < 300) {
        removeSelectedFile()
        resetForm()

        bigToast('Datos enviados correctamente', 'success')
      }
    } catch (error: any) {
      if (error.response.status === 409) {
        const MySwal = withReactContent(Swal)
        MySwal.fire({
          title: <p>{error.response.data.message}</p>,
          text: '¿Qué deseas hacer con el archivo?',
          icon: 'warning',
          input: 'radio',
          showCancelButton: true,
          inputValue: 'update',
          inputValidator: (value) => {
            if (!value) {
              return 'Necesitas Escoger una opción!'
            }
          },
          inputOptions: {
            update: 'Actualizar',
            create: 'Crear'
          }
        }).then(async (obj) => {
          const response = await postData({
            ...data,
            replace: obj.value === 'create',
            update: obj.value === 'update'
          })

          if (response.status >= 200 && response.status < 300) {
            removeSelectedFile()
            resetForm()
            // MySwal.fire(
            //   obj.value === "create" ? "Creado" : "Actualizado",
            //   "",
            //   "success"
            // );

            bigToast(
              obj.value === 'create' ? 'Archivo Creado' : 'Archivo Actualizado',
              'success'
            )
          }
        })
      }
      console.error('Error al enviar datos:', error)
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '0 auto'
      }}
    >
      <ModalCustomer
        open={openModalCustomer}
        onClose={setOpenModalCustomer}
        name={missedData2.customer}
        dataReturned={dataReturned}
      />
      {/* <ModalDevice
        open={openModalDevice}
        onClose={setOpenModalDevice}
        name={missedData.device}
        dataReturned={dataReturnedDevice}
      /> */}

      <Stack direction='column' spacing={2} mb={3} mt={3}>
        {/* <TextField type="file" /> */}
        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, 'devices', mapDevices)
          }
          // onChange={(selectedOption: any) =>
          //   setDevice({
          //     id: selectedOption.value,
          //     name: selectedOption.label,
          //   })
          // }
          onChange={(selectedOption: any) => setDevice(selectedOption)}
          value={device}
          placeholder='Buscar Equipo'
          styles={styles(!(!!validationError && !device))}
        />
        {!!device && !hideUpload && (
          <label htmlFor='upload-photo'>
            <input
              style={{ display: 'none' }}
              id='upload-photo'
              name='upload-photo'
              type='file'
              onChange={handleFileUpload}
              accept='.xls, .xlsx, .xlsm'
            />

            <Button color='secondary' variant='contained' component='span'>
              Subir Archivo
            </Button>
          </label>
        )}

        {hideUpload && <Typography>{selectedFile}</Typography>}

        {/* <Button variant="contained" onClick={analyzeCells} color="primary">
          Analizar Celdas
        </Button> */}
        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, 'customers', mapCustomers)
          }
          onChange={(selectedOption: any) => setCustomer(selectedOption)}
          placeholder='Buscar Cliente'
          styles={styles(!(!!validationError && !customer))}
          value={customer}
        />
        {missedData2.customer && !customer && (
          <div className='flex items-center justify-evenly'>
            <p className='text-red-500'>{missedData2.customer}</p>
            <IconButton
              aria-label='delete'
              onClick={() => setOpenModalCustomer(true)}
            >
              <Add />
            </IconButton>
          </div>
        )}

        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, 'certificateTypes', mapDevices)
          }
          onChange={(selectedOption: any) =>
            setTypeOfCertificate({
              id: selectedOption.value,
              name: selectedOption.label
            })
          }
          placeholder='Buscar Tipo de Certificado'
          defaultValue={{
            value: typeOfCertificate?.id,
            label: typeOfCertificate?.name
          }}
          styles={styles(!(!!validationError && !typeOfCertificate))}
        />
        <TextField
          error={!!validationError && !city}
          label='Ciudad'
          variant='outlined'
          fullWidth
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <TextField
          error={!!validationError && !location}
          label='Ubicación'
          variant='outlined'
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <TextField
          error={!!validationError && !headquarters}
          label='Sede'
          variant='outlined'
          fullWidth
          value={headquarters}
          onChange={(e) => setHeadquartes(e.target.value)}
        />
        <TextField
          error={!!validationError && !fixedAsset}
          label='Activo Fijo'
          variant='outlined'
          fullWidth
          value={fixedAsset}
          onChange={(e) => setFixedAsset(e.target.value)}
        />
        <TextField
          error={!!validationError && !serialNumber}
          label='Serie'
          variant='outlined'
          fullWidth
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
        <DatePicker
          label='Fecha de Certificación'
          value={certificateDate}
          onChange={(newValue) => setCertificateDate(newValue)}
          sx={{
            '& .MuiInputBase-root': {
              border:
                !!validationError && !certificateDate
                  ? '1px #d32f2f solid'
                  : 'none'
            },
            '& .MuiFormLabel-root': {
              color: !!validationError && !certificateDate ? '#d32f2f' : 'none'
            }
          }}
        />
        {isFile && (
          <Button
            component='label'
            variant='contained'
            startIcon={<CloudUpload />}
            color={!!validationError && !filePdf ? 'error' : 'primary'}
          >
            {selectedFileName ? selectedFileName : 'Cargar Archivo'}
            <VisuallyHiddenInput
              type='file'
              accept='.pdf'
              onChange={handleFileChange}
            />
          </Button>
        )}
        {validationError && (
          <Box display={'flex'} justifyContent={'center'}>
            <Typography color='error' variant='caption'>
              <span style={{ marginRight: 15 }}>
                <Warning />
              </span>
              {validationError}
            </Typography>
          </Box>
        )}
        <Button variant='contained' onClick={onSubmit}>
          Enviar
        </Button>
      </Stack>
    </Box>
  )
}

const mapDevices = (option: any): DeviceOption => ({
  value: option.id,
  label: option.name,
  certificateTemplate: option.certificateTemplate
})

const mapCustomers = (option: any): ResourceOption => ({
  value: option.id,
  label: option.nombre
})

interface DeviceOption extends ResourceOption {
  certificateTemplate: CertificateTemplateData
}

interface CertificateTemplateData {
  location: string
  city: string
  solicitante: string
  activoFijo: string
  calibrationDate: string
  sede: string
  serie: string
  instrumento: string
}

export default AnalyzeExcelComponent
