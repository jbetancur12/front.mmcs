import {
  getApiErrorPayload,
  getApiErrorReason,
  parseApiError
} from 'src/utils/apiError'
import React, { useEffect, useState } from 'react'
import { Alert, Button, MenuItem, TextField, Typography } from '@mui/material'
import { UploadFile } from '@mui/icons-material'
import { addMonths, format, isValid, parse } from 'date-fns'

import ModalCustomer from '../Components/ModalCustomer'
import ModalDevice from '../Components/ModalDevice'
import { AnalyzeExcelComponentProps } from '../Components/ExcelManipulation/Types'
import type {
  CertificateTemplateData,
  CreatedCustomerOption,
  CreatedDeviceOption
} from '../Components/ExcelManipulation/Types'
import { ResourceOption } from '../utils/loadOptions'
import AsyncSelectField, {
  type AsyncSelectOption
} from '../Components/Common/AsyncSelectField'
import FileDropZone from '../Components/Common/FileDropZone'
import FormDateField from '../Components/Common/FormDateField'
import FormErrorSummary from '../Components/Common/FormErrorSummary'
import FormPage from '../Components/Common/FormPage'
import FormSection, { FormGridItem } from '../Components/Common/FormSection'
import useAxiosPrivate from '@utils/use-axios-private'
import { useUploadRawCertificate } from '@hooks/calibration/useUploadRawCertificate'
import { notify } from 'src/utils/notify'
import { busyDialog, choiceDialog } from 'src/utils/confirm'

import { logger } from 'src/utils/logger'

const AnalyzeExcelComponent: React.FC<AnalyzeExcelComponentProps> = ({
  hideUpload,
  selectedFile,
  isFile,
  headerActions,
  setFileNames,
  fileNames,
  wbPasswords
}) => {
  const axiosPrivate = useAxiosPrivate()
  const uploadRawCertificate = useUploadRawCertificate()
  const [file, setFile] = useState<File | null>(null)
  const [filePdf, setFilePdf] = useState<File | null>(null)
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
  const [customer, setCustomer] = useState<ResourceCustomerOption | null>(null)
  const [hq, setHq] = useState<{
    value: string
    label: string
  } | null | null>(null)

  const [typeOfCertificate, setTypeOfCertificate] = useState<{
    id: string
    name: string
  } | null>({ id: '3', name: 'Calibración' })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [openModalCustomer, setOpenModalCustomer] = useState(false)
  const [openModalDevice, setOpenModalDevice] = useState(false)

  // Campos que faltan; se resaltan solo después de intentar enviar
  const missing = {
    device: !device,
    customer: !customer,
    type: !typeOfCertificate,
    hq: !hq,
    city: !city,
    location: !location,
    headquarters: !headquarters,
    fixedAsset: !fixedAsset,
    serialNumber: !serialNumber,
    certificateDate: !certificateDate,
    pdf: !filePdf
  }
  const showError = (key: keyof typeof missing) =>
    Boolean(validationError) && missing[key]
  const errorCount = validationError
    ? Object.values(missing).filter(Boolean).length
    : 0

  const validateFields = () => {
    if (Object.values(missing).some(Boolean)) {
      setValidationError('Todos los campos son obligatorios')
      return false
    }
    return true
  }

  // La espera de leer el Excel o de enviar bloquea la pantalla con el aviso común
  useEffect(() => {
    if (loading) busyDialog.show('Procesando el archivo')
    else busyDialog.hide()
    return () => busyDialog.hide()
  }, [loading])

  const searchOptions = async <TSource, T>(
    inputValue: string,
    resource: string,
    mapFunction: (item: TSource) => T
  ): Promise<T[]> => {
    try {
      const response = await axiosPrivate.get<TSource[]>(`/${resource}`, {
        params: { q: inputValue }
      })
      return response.data.map((item) => mapFunction(item))
    } catch (error) {
      logger.error('Error al cargar opciones:', error)
      return []
    }
  }

  const readExcel = async (file: File) => {
    const passwords = [...wbPasswords] // Replace with your passwords
    let workbook: import('xlsx-populate').Workbook | undefined
    const XlsxPopulate = (await import('xlsx-populate')).default

    try {
      // Primero intenta abrir el archivo sin contraseña

      workbook = await XlsxPopulate.fromDataAsync(file)
    } catch (initialError) {
      logger.log('Error: ', initialError)
      logger.log('Failed to open file without password, trying passwords...')

      for (const password of passwords) {
        try {
          workbook = await XlsxPopulate.fromDataAsync(file, { password })
          break
        } catch (error) {
          logger.log(`Failed to open file with password: ${password}`)
        }
      }
    }

    if (!workbook) {
      setLoading(false)
      notify.error('Contraseña incorrecta')
      throw new Error('Failed to open file with any password')
    }

    const openedWorkbook = workbook

    try {
      let sheet: import('xlsx-populate').Sheet | null = null
      let sheetName: string | null = null
      openedWorkbook.sheets().forEach((ws) => {
        if (ws.name().toLowerCase() === 'certificado' && !ws.hidden()) {
          sheet = openedWorkbook.sheet(ws.name())
          sheetName = ws.name()
        }
      })
      if (!sheet) {
        sheet = openedWorkbook.sheet('CC')
        sheetName = 'CC'
      }
      if (!sheet) {
        notify.error('El archivo no contiene una hoja llamada CERTIFICADO o CC')
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
            for (const col of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']) {
              const value = sheet.cell(`${col}${row}`)

              if (value.value()) {
                const result = await fetchDevice(String(value.value()))

                if (result.length > 0) {
                  setDevice({
                    value: result[0].id,
                    label: result[0].name,
                    certificateTemplate: result[0].certificateTemplate
                  })

                  const cerTemplate: CertificateTemplateData =
                    result[0].certificateTemplate
                  const resolvedSheetName = sheetName ?? 'CC'

                  const getValueFromCell = (
                    workbook: import('xlsx-populate').Workbook,
                    field: keyof CertificateTemplateData
                  ): string => {
                    const rawValue = workbook
                      .sheet(resolvedSheetName)
                      .cell(cerTemplate[field].toUpperCase())
                      .value()

                    if (field === 'calibrationDate') {
                      return XlsxPopulate.numberToDate(
                        Number(rawValue)
                      ).toISOString()
                    }

                    return String(rawValue ?? '')
                  }

                  const fields: Array<keyof CertificateTemplateData> = [
                    'city',
                    'location',
                    'sede',
                    'activoFijo',
                    'serie',
                    'calibrationDate',
                    'solicitante',
                    'instrumento'
                  ]

                  const info = fields.reduce<CertificateTemplateData>(
                    (acc, field) => ({
                      ...acc,
                      [field]: getValueFromCell(openedWorkbook, field)
                    }),
                    { ...cerTemplate }
                  )

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
      throw new Error(error instanceof Error ? error.message : String(error))
    }
  }

  const handleExcelSelected = (uploadedFile: File) => {
    setLoading(true)
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const cells = await readExcel(uploadedFile)
        // Sin celdas leídas no habrá análisis posterior que apague la espera
        if (cells) setData2(cells)
        else setLoading(false)
      } catch (error) {
        setLoading(false)
        logger.error('Error al leer el Excel:', error)
      }
    }
    reader.readAsBinaryString(uploadedFile)
  }

  const dataReturned = (data: CreatedCustomerOption) => {
    setCustomer({ value: data.id, label: data.nombre, sedes: data.sede })
    setMissedData({ ...missedData, customer: '' })
  }

  const dataReturnedDevice = (data: CreatedDeviceOption) => {
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
      const results = await fetchCustomer(customer)
      const missed = { customer: '' }

      if (results.length > 0) {
        setCustomer({
          value: results[0].id,
          label: results[0].nombre,
          sedes: results[0].sede
        })
      } else {
        missed.customer = data2.solicitante
      }

      setMissedData2({ ...missedData2, ...missed })
      setLoading(false)
    }
  }

  const fetchCustomer = async (
    name: string
  ): Promise<CustomerSearchResult[]> => {
    try {
      const response = await axiosPrivate.get<CustomerSearchResult[]>(
        `/customers`,
        {
          params: { q: name }
        }
      )
      const customers = response.data

      return customers
    } catch (error) {
      logger.error('Error while searching for device:', error)
      return []
    }
  }

  const fetchDevice = async (name: string): Promise<DeviceSearchResult[]> => {
    try {
      const response = await axiosPrivate.get<DeviceSearchResult[]>(
        `/devices`,
        {
          params: { q: name }
        }
      )
      const devices = response.data
      return devices
    } catch (error) {
      logger.error('Error while searching for device:', error)
      return []
    }
  }

  useEffect(() => {
    analyzeCells2()
    // Solo cuando cambia data2: analyzeCells2 se recrea en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setHq(null)
    setValidationError(null)
    setFile(null)
  }

  const removeSelectedFile = () => {
    if (setFileNames && fileNames && selectedFile) {
      setFileNames(fileNames.filter((name) => name !== selectedFile))
    }
    setFile(null)
    setFilePdf(null)
  }

  // Cancelar deja la pantalla como recién abierta
  const handleCancel = () => {
    resetForm()
    setFilePdf(null)
  }

  const postData = (data: FormData) => uploadRawCertificate.mutateAsync(data)

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
      headquarter: hq?.value,
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
    const appendIfNotNull = (key: string, value: unknown) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
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
    appendIfNotNull('headquarter', data.headquarter)

    try {
      setLoading(true)
      const response = await postData(formData)

      if (response.status >= 200 && response.status < 300) {
        removeSelectedFile()
        resetForm()

        notify.success('Datos enviados correctamente')
      }
    } catch (error: unknown) {
      if (parseApiError(error).status === 409) {
        // El diálogo espera al usuario: el cargando no debe taparlo
        setLoading(false)
        const obj = await choiceDialog({
          title: getApiErrorReason(error) ?? 'El archivo ya existe',
          text: (
            <div>
              <ul>
                <li>Serie: {String(getApiErrorPayload(error).serial ?? '')}</li>
                <li>
                  Activo fijo:{' '}
                  {String(getApiErrorPayload(error).activoFijo ?? '')}
                </li>
              </ul>
              <p>¿Qué deseas hacer con el archivo?</p>
            </div>
          ),
          options: [
            { value: 'update', label: 'Actualizar' },
            { value: 'create', label: 'Crear' }
          ],
          defaultValue: 'update'
        })
        // Cancelar el diálogo descarta el archivo
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

          notify.success(
            obj.value === 'create' ? 'Archivo Creado' : 'Archivo Actualizado'
          )
        }
      }
      logger.error('Error al enviar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const textField = (
    label: string,
    value: string,
    setValue: (value: string) => void,
    key: keyof typeof missing
  ) => (
    <TextField
      label={label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      error={showError(key)}
      helperText={showError(key) ? 'Obligatorio' : undefined}
      fullWidth
    />
  )

  return (
    <>
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

      <FormPage
        title='Subir Excel'
        subtitle='Carga de certificados por archivo Excel y PDF asociado.'
        icon={<UploadFile />}
        actions={headerActions}
        onSubmit={(event) => {
          event?.preventDefault()
          onSubmit()
        }}
        onCancel={handleCancel}
        submitLabel='Enviar certificado'
        loading={loading}
        notices={<FormErrorSummary count={errorCount} />}
      >
        <FormSection
          title='Archivo Excel'
          description='Se lee la hoja CERTIFICADO o CC y se llenan los datos de abajo.'
        >
          <FormGridItem>
            {hideUpload ? (
              <Typography>{selectedFile}</Typography>
            ) : (
              <FileDropZone
                file={file}
                onFileSelected={handleExcelSelected}
                onReject={notify.error}
                accept='.xls,.xlsx,.xlsm'
                acceptLabel='Excel'
                title='Arrastra el Excel o haz clic para elegirlo'
                hint='.xls, .xlsx o .xlsm, hasta 10 MB'
                disabled={loading}
              />
            )}
          </FormGridItem>
        </FormSection>

        <FormSection
          title='Equipo y cliente'
          description='Busca por nombre. Si el Excel trae uno que no existe, puedes crearlo.'
        >
          <AsyncSelectField<DeviceOption>
            label='Equipo'
            value={device}
            onChange={setDevice}
            loadOptions={(input) => searchOptions(input, 'devices', mapDevices)}
            error={showError('device')}
            helperText={showError('device') ? 'Obligatorio' : undefined}
          />
          <AsyncSelectField<ResourceCustomerOption>
            label='Cliente'
            value={customer}
            onChange={(option) => {
              setCustomer(option)
              // La sede depende del cliente
              setHq(null)
            }}
            loadOptions={(input) =>
              searchOptions(input, 'customers', mapCustomers)
            }
            error={showError('customer')}
            helperText={showError('customer') ? 'Obligatorio' : undefined}
          />
          <AsyncSelectField<AsyncSelectOption>
            label='Tipo de certificado'
            value={
              typeOfCertificate
                ? { value: typeOfCertificate.id, label: typeOfCertificate.name }
                : null
            }
            onChange={(option) =>
              setTypeOfCertificate(
                option ? { id: String(option.value), name: option.label } : null
              )
            }
            loadOptions={(input) =>
              searchOptions<CertificateTypeSearchResult, AsyncSelectOption>(
                input,
                'certificateTypes',
                (o) => ({
                  value: String(o.id),
                  label: o.name
                })
              )
            }
            error={showError('type')}
            helperText={showError('type') ? 'Obligatorio' : undefined}
          />
          <TextField
            select
            label='Sede'
            value={hq?.value ?? ''}
            onChange={(event) =>
              setHq({
                value: event.target.value,
                label: event.target.value.toUpperCase()
              })
            }
            disabled={!customer}
            error={showError('hq')}
            helperText={
              showError('hq')
                ? 'Obligatorio'
                : !customer
                  ? 'Elige primero el cliente'
                  : undefined
            }
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          >
            <MenuItem value='' disabled>
              Seleccionar sede
            </MenuItem>
            {(customer?.sedes ?? []).map((item) => (
              <MenuItem key={item} value={item}>
                {item.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          {missedData2.device && !device ? (
            <FormGridItem>
              <Alert
                severity='warning'
                variant='outlined'
                action={
                  <Button
                    color='inherit'
                    size='small'
                    onClick={() => setOpenModalDevice(true)}
                  >
                    Crear equipo
                  </Button>
                }
              >
                No encontramos el equipo “{missedData2.device}”. Créalo para
                continuar.
              </Alert>
            </FormGridItem>
          ) : null}
          {missedData2.customer && !customer ? (
            <FormGridItem>
              <Alert
                severity='warning'
                variant='outlined'
                action={
                  <Button
                    color='inherit'
                    size='small'
                    onClick={() => setOpenModalCustomer(true)}
                  >
                    Crear cliente
                  </Button>
                }
              >
                No encontramos el cliente “{missedData2.customer}”. Créalo para
                continuar.
              </Alert>
            </FormGridItem>
          ) : null}
        </FormSection>

        <FormSection title='Datos del certificado'>
          {textField('Ciudad', city, setCity, 'city')}
          {textField('Ubicación', location, setLocation, 'location')}
          {textField('Dirección', headquarters, setHeadquartes, 'headquarters')}
          {textField('Activo fijo', fixedAsset, setFixedAsset, 'fixedAsset')}
          {textField('Serie', serialNumber, setSerialNumber, 'serialNumber')}
          <FormDateField
            label='Fecha de certificación'
            name='certificateDate'
            value={
              certificateDate && isValid(certificateDate)
                ? format(certificateDate, 'yyyy-MM-dd')
                : ''
            }
            onChange={(value) =>
              setCertificateDate(
                value ? parse(value, 'yyyy-MM-dd', new Date()) : null
              )
            }
            error={showError('certificateDate') && 'Obligatorio'}
          />
        </FormSection>

        {isFile ? (
          <FormSection
            title='Certificado en PDF'
            description='El PDF que se guarda junto con los datos.'
          >
            <FormGridItem>
              <FileDropZone
                file={filePdf}
                onFileSelected={setFilePdf}
                onReject={notify.error}
                accept='.pdf'
                acceptLabel='PDF'
                title='Arrastra el PDF o haz clic para elegirlo'
                disabled={loading}
              />
              {showError('pdf') ? (
                <Typography
                  variant='caption'
                  sx={{ color: 'error.main', mt: 0.5, display: 'block' }}
                >
                  Obligatorio
                </Typography>
              ) : null}
            </FormGridItem>
          </FormSection>
        ) : null}
      </FormPage>
    </>
  )
}

const mapDevices = (option: DeviceSearchResult): DeviceOption => ({
  value: option.id,
  label: option.name,
  certificateTemplate: option.certificateTemplate
})

const mapCustomers = (
  option: CustomerSearchResult
): ResourceCustomerOption => ({
  value: option.id,
  label: option.nombre,
  sedes: option.sede
})

interface DeviceSearchResult {
  id: number
  name: string
  certificateTemplate: CertificateTemplateData
}

interface CustomerSearchResult {
  id: number
  nombre: string
  sede: string[]
}

interface CertificateTypeSearchResult {
  id: number
  name: string
}

interface DeviceOption extends ResourceOption {
  certificateTemplate: CertificateTemplateData
}

interface ResourceCustomerOption extends ResourceOption {
  sedes: string[]
}

export default AnalyzeExcelComponent
