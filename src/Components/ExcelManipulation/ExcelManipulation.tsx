import {
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import React, { useState } from 'react'
import * as Minio from 'minio'
import axios from 'axios'
import { api } from '../../config'
import toast, { Toaster } from 'react-hot-toast'
import Loader from '../Loader2'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  decimalPlaces,
  initialFormData,
  initialRows,
  validarCamposLlenos
} from './Utils'
import { populateExcel } from './populateExcel'
import Header from './Components/Header'
import DeviceInformation from './Components/DeviceInformation'
import CustomerInformation from './Components/CustomerInformation'
import InitialConditions from './Components/InitialConditions'
import ResolutionAndExactitude from './Components/ResolutionAndExactitude'

const apiUrl = api()

const minioClient = new Minio.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const ExcelManipulation: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState(false)

  const [loading, setLoading] = useState(false)

  const [checked, setChecked] = useState(true)

  const handleChangeCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  //#region HandleDownload

  const handleDownload = async () => {
    if (!validarCamposLlenos(formData)) {
      setError(true)
      toast.error('Por favor llene todos los campos')
      return
    } else {
      setError(false)
    }
    setLoading(true)
    if (formData.format) {
      minioClient.getObject(
        'repositories',
        formData.format.path,

        async function (err: Error | null, dataStream: any) {
          if (err) {
            console.error(err)
            return
          }

          const chunks: Uint8Array[] = []
          dataStream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
          dataStream.on('end', async () => {
            const excelBlob = new Blob(chunks, {
              type: 'application/octet-stream'
            })

            const blob = await populateExcel(excelBlob, {
              formData,
              rows
            })

            const nextCalibrationDate = new Date(formData.calibrationDate)
            nextCalibrationDate.setFullYear(
              nextCalibrationDate.getFullYear() + 1
            )

            const formDataFile = new FormData()
            formDataFile.append('file', blob, `${formData.name}.xlsx`)
            formDataFile.append('customerId', formData.customer?.value || '')
            formDataFile.append('deviceId', formData.device?.value || '')
            formDataFile.append(
              'certificateTypeId',
              formData.typeOfCertificate?.value || ''
            )
            formDataFile.append('city', formData.city)
            formDataFile.append('location', formData.location)
            formDataFile.append('sede', formData.sede)
            formDataFile.append('activoFijo', formData.activoFijo)
            formDataFile.append('serie', formData.serie)
            formDataFile.append('name', formData.name)
            formDataFile.append('filePath', `${formData.name}.pdf`)
            formDataFile.append('calibrationDate', formData.calibrationDate)
            formDataFile.append(
              'nextCalibrationDate',
              nextCalibrationDate.toString()
            )

            try {
              await axios.post(`${apiUrl}/utils/upload`, formDataFile, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
              })
              toast.success('Certificado creado correctamente')
            } catch (error) {
              console.error('Error al subir el archivo:', error)
            } finally {
              setLoading(false)
            }

            if (checked) {
              const url = URL.createObjectURL(blob)

              const a = document.createElement('a')
              a.href = url
              a.download = `${formData.name}.xlsx`
              document.body.appendChild(a)
              a.click()

              document.body.removeChild(a)
              setLoading(false)
            }
          })
        }
      )
    } else {
      toast.error('No se ha seleccionado un formato')
      setLoading(false)
    }
  }

  //#region HandleChange

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const [rows, setRows] = React.useState(initialRows)

  const columnsX: GridColDef<(typeof rows)[number]>[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: false,
      align: 'center'
    },
    {
      field: 'point',
      headerName: 'Punto',
      sortable: false,
      editable: true,
      cellClassName: 'bg-green-300',
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'first',
      headerName: '1',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'second',
      headerName: '2',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'third',
      headerName: '3',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'fourth',
      headerName: '4',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'fifth',
      headerName: '5',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'sixth',
      headerName: '6',
      sortable: false,
      editable: true,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    },
    {
      field: 'average',
      headerName: 'Promedio',
      sortable: false,
      align: 'center',
      type: 'number',
      valueFormatter: (value?: number) => {
        if (value == null) {
          return 0
        }
        return Number(value.toFixed(decimalPlaces(formData.decimalPlaces)))
      }
    }
  ]

  return (
    <Stack spacing={2} marginBottom={10}>
      <Toaster />
      <Loader loading={loading} />
      <Header
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        error={error}
      />
      <DeviceInformation
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        error={error}
      />
      <CustomerInformation
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        error={error}
      />
      <InitialConditions
        error={error}
        formData={formData}
        handleChange={handleChange}
        data={{
          title: 'Condiciones Ambientales Iniciales',
          labelT: 'Temperatura Inicial',
          labelH: 'Humedad Inicial',
          nameT: 'initialTemperature',
          nameH: 'initialHumidity'
        }}
      />
      <ResolutionAndExactitude
        error={error}
        formData={formData}
        handleChange={handleChange}
        setFormData={setFormData}
      />

      <Paper elevation={3} style={{ padding: 20 }}>
        <Typography variant='h5'>{`Datos en ${formData.unit}`}</Typography>

        <DataGrid
          rows={rows}
          columns={columnsX}
          disableColumnMenu
          disableColumnResize
          disableColumnSelector
          disableAutosize
          disableColumnFilter
          disableColumnSorting
          disableRowSelectionOnClick
          disableDensitySelector
          disableMultipleRowSelection
          processRowUpdate={(update) => {
            const updatedRows = rows.map((row) => {
              if (row.id === update.id) {
                // Calcular el promedio
                let sum =
                  update.first +
                  update.second +
                  update.third +
                  update.fourth +
                  update.fifth +
                  update.sixth
                let count = 6 // Total de elementos a sumar
                let average = sum / count

                // Devolver el objeto actualizado con el promedio asignado al campo "average"
                return { ...row, ...update, average: average }
              } else {
                return row
              }
            })

            setRows(updatedRows)
            return update // Devolver la fila actualizada
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                // Hide columns status and traderName, the other columns will remain visible
                id: false
              }
            }
          }}
          sx={{
            width: '800px',
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: 'rgba(134,239,172,1)',
              textAlign: 'center'
            },
            ' .MuiDataGrid-columnHeaderTitleContainer': {
              justifyContent: 'center',
              fontWeight: 'bold'
            },
            '& .MuiDataGrid-footerContainer': {
              display: 'none'
            },
            '& .MuiDataGrid-scrollbar': {
              display: 'none'
            },
            '& .MuiDataGrid-filler': {
              display: 'none'
            }
          }}
        />
      </Paper>
      <InitialConditions
        error={error}
        formData={formData}
        handleChange={handleChange}
        data={{
          title: 'Condiciones Ambientales Finales',
          labelT: 'Temperatura Final',
          labelH: 'Humedad Final',
          nameT: 'finalTemperature',
          nameH: 'finalHumidity'
        }}
      />
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={handleChangeCheck} />}
        label='Descargar archivo en excel'
      />
      <Button onClick={handleDownload} variant='contained' color='secondary'>
        Download
      </Button>
    </Stack>
  )
}

export default ExcelManipulation
