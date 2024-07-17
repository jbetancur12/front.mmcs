import React, { useEffect, useState } from 'react'
// import * as XLSX from 'xlsx'
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
import Loader from '../Components/Loader2'
import { addMonths, set } from 'date-fns'

// Importa los componentes de MUI

const apiUrl = api()

const AnalyzeExcelComponent: React.FC<AnalyzeExcelComponentProps> = ({
  dataReceived,
  hideUpload,
  selectedFile,
  isFile,
  setFileNames,
  fileNames,
  wbPasswords
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [filePdf, setFilePdf] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [_data, setData] = useState<any[]>([])
  const [data2, setData2] = useState<CertificateTemplateData>(
    {} as CertificateTemplateData
  )
  const [city, setCity] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [headquarters, setHeadquartes] = useState<string>('Sin Información')
  const [fixedAsset, setFixedAsset] = useState<string>('')
  const [serialNumber, setSerialNumber] = useState<string>('')
  const [certificateDate, setCertificateDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const [missedData, setMissedData] = useState<{
    device: string
    customer: string
  }>({ device: '', customer: '' })
  const [missedData2, setMissedData2] = useState<{
    device: string
    customer: string
  }>({ device: '', customer: '' })
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

  const readExcel = async (file: File) => {
    const passwords = [...wbPasswords] // Replace with your passwords
    let workbook: any

    try {
      // Primero intenta abrir el archivo sin contraseña
      console.log('Abriendo...')
      workbook = await XlsxPopulate.fromDataAsync(file)
      console.log('===>', workbook)
    } catch (initialError) {
      console.log('Error: ', initialError)
      console.log('Failed to open file without password, trying passwords...')

      for (const password of passwords) {
        try {
          workbook = await XlsxPopulate.fromDataAsync(file, { password })
          break
        } catch (error) {
          console.log(`Failed to open file with password: ${password}`)
        }
      }
    }

    if (!workbook) {
      setLoading(false)
      bigToast('Contraseña incorrecta', 'error')
      throw new Error('Failed to open file with any password')
    }

    // return await XlsxPopulate.fromDataAsync(file, {
    //   password: ''
    // }).then(async (workbook) => {
    // const fields: (keyof typeof device.certificateTemplate)[] = [
    //   'city',
    //   'location',
    //   'sede',
    //   'activoFijo',
    //   'serie',
    //   'calibrationDate',
    //   'solicitante',
    //   'instrumento'
    // ]
    // const info = fields.reduce((acc, field) => {
    //   acc[field] = getValueFromCell(workbook, field)
    //   return acc
    // }, {} as any)
    // return info
    // ANCHOR // ! Probando buscar entre celdas

    try {
      let sheet = null
      let sheetName: string | null = null
      workbook.sheets().forEach((ws: any) => {
        if (ws.name().toLowerCase() === 'certificado' && !ws.hidden()) {
          sheet = workbook.sheet(ws.name())
          sheetName = ws.name() as string
        }
      })
      if (!sheet) {
        sheet = workbook.sheet('CC')
        sheetName = 'CC'
      }
      if (!sheet) {
        bigToast(
          'El archivo no contiene una hoja llamada CERTIFICADO o CC',
          'error'
        )
        throw new Error(
          'The workbook does not contain a sheet named CERTIFICADO or CC'
        )
      } else {
        for (let row = 8; row <= 17; row++) {
          const cell = sheet.cell(`A${row}`)
          const cellValue = cell.value()

          if (
            cellValue &&
            typeof cellValue === 'string' &&
            cellValue.includes('Instrumento')
          ) {
            for (let col of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) {
              const value = sheet.cell(`${col}${row}`)

              if (value.value()) {
                console.log(value.value(), row, col)
                //device.certificateTemplate['instrumento'] = `${col}${row}`
                const result = await fetchDevice(value.value() as string)

                if (result.length > 0) {
                  setDevice({
                    value: result[0].id,
                    label: result[0].name,
                    certificateTemplate: result[0].certificateTemplate
                  })

                  const cerTemplate: CertificateTemplateData =
                    result[0].certificateTemplate

                  const getValueFromCell = (
                    workbook: any,
                    field: keyof typeof cerTemplate
                  ) => {
                    if (field === 'calibrationDate') {
                      return XlsxPopulate.numberToDate(
                        workbook
                          .sheet(sheetName)
                          .cell(cerTemplate[field].toUpperCase())
                          .value()
                      )
                    }
                    return workbook
                      .sheet(sheetName)
                      .cell(cerTemplate[field].toUpperCase())
                      .value()
                  }

                  const fields: (keyof typeof cerTemplate)[] = [
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
                } else {
                  setLoading(false)
                  setMissedData2({
                    ...missedData2,
                    device: value.value() as string
                  })
                }

                break // Se sale del bucle for
              }
            }
          }
        }
      }
    } catch (error) {
      throw new Error(error as string)
    }

    // ! Fin de prueba
    // })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true)

    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0]

      setFile(uploadedFile)

      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target) {
          // const binaryString = e.target.result as string // Asegúrate de que sea de tipo string

          const cells = await readExcel(uploadedFile)

          // TODO descomentar siguienete linea
          setData2(cells)
        }
      }
      reader.readAsBinaryString(uploadedFile)
      event.target.value = ''
    } else {
      setLoading(false)
      bigToast('No se ha seleccionado un archivo', 'error')
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

  const analyzeCells2 = async () => {
    if (data2 && Object.keys(data2).length > 0) {
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

      setMissedData2({ ...missedData2, ...missed })
      setLoading(false)
    }
  }

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
    setMissedData2({ device: '', customer: '' })
    setDevice(null)
    setCustomer(null)
    setTypeOfCertificate({ id: '3', name: 'Calibración' })
    setValidationError(null)
    setFile(null)
  }

  const removeSelectedFile = () => {
    if (setFileNames && fileNames && selectedFile) {
      setFileNames(fileNames.filter((name) => name !== selectedFile))
    }
    setFile(null)
    setSelectedFileName(null)
    set
  }

  const postData = async (data: FormData) => {
    //logFormData(data)
    return await axios.post(`${apiUrl}/files/raw`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
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

    const nextCalibrationDate = addMonths(
      certificateDate as Date,
      12
    ).toISOString()

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
      replace: false,
      update: false
    }

    const formData = new FormData()
    if (filePdf) {
      formData.append('pdf', filePdf as Blob)
    }

    // Añade datos al formData solo si no son nulos o indefinidos
    const appendIfNotNull = (key: string, value: any) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString())
      }
    }

    appendIfNotNull('city', data.city)
    appendIfNotNull('location', data.location)
    appendIfNotNull('sede', data.sede)
    appendIfNotNull('activoFijo', data.activoFijo)
    appendIfNotNull('serie', data.serie)

    // Convierte las fechas a cadenas ISO si no son nulas
    appendIfNotNull(
      'calibrationDate',
      data.calibrationDate ? data.calibrationDate.toISOString() : null
    )
    appendIfNotNull(
      'nextCalibrationDate',
      data.nextCalibrationDate ? data.nextCalibrationDate : null
    )

    appendIfNotNull('customerId', data.customerId)
    appendIfNotNull('deviceId', data.deviceId)
    appendIfNotNull('certificateTypeId', data.certificateTypeId)
    appendIfNotNull('name', data.name)
    appendIfNotNull('replace', data.replace)
    appendIfNotNull('update', data.update)

    try {
      setLoading(true)
      const response = await postData(formData)

      if (response.status >= 200 && response.status < 300) {
        removeSelectedFile()
        resetForm()

        bigToast('Datos enviados correctamente', 'success')
      }
    } catch (error: any) {
      if (error.response.status === 409) {
        const MySwal = withReactContent(Swal)
        MySwal.fire({
          title: (
            <div>
              <p>{error.response.data.message}</p>
              <ul>
                <li>Serie: {error.response.data.serial}</li>
                <li>Activo fijo: {error.response.data.activoFijo}</li>
              </ul>
            </div>
          ),
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
          if (obj.isDismissed) {
            removeSelectedFile()
            resetForm()
            return
          }
          if (formData.has('replace')) {
            formData.delete('replace')
          }
          if (formData.has('update')) {
            formData.delete('update')
          }
          if (obj.value === 'create') {
            formData.append('replace', 'true')
          } else if (obj.value === 'update') {
            formData.append('update', 'true')
          }
          const response = await postData(formData)

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: '0 auto'
      }}
    >
      <Loader loading={loading} />
      <ModalCustomer
        open={openModalCustomer}
        onClose={setOpenModalCustomer}
        name={missedData2.customer}
        dataReturned={dataReturned}
      />
      <ModalDevice
        open={openModalDevice}
        onClose={setOpenModalDevice}
        name={missedData2.device}
        dataReturned={dataReturnedDevice}
        resetForm={resetForm}
      />

      <Stack direction='column' spacing={2} mb={3} mt={3}>
        {/* <TextField type="file" /> */}
        {!hideUpload && (
          <div>
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
                {!file ? 'Leer Archivo Excel' : file.name}
              </Button>
            </label>
          </div>
        )}

        {hideUpload && <Typography>{selectedFile}</Typography>}

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
        {missedData2.device && !device && (
          <div className='flex items-center justify-evenly'>
            <p className='text-red-500'>{missedData2.device}</p>
            <IconButton
              aria-label='delete'
              onClick={() => setOpenModalDevice(true)}
            >
              <Add />
            </IconButton>
          </div>
        )}
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
            {selectedFileName ? selectedFileName : 'Cargar Archivo PDF'}
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
        <Button variant='contained' onClick={onSubmit} disabled={loading}>
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

export interface CertificateTemplateData {
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
