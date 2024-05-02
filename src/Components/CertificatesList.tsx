import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios, { AxiosError, AxiosResponse } from 'axios'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { api } from '../config'

import Loader from './Loader2'
import { bigToast } from './ExcelManipulation/Utils'

const apiUrl = api()

interface Certificate {
  id: number
  calibrationDate: string
  filePath: string
}

function CertificatesList() {
  const { id } = useParams<{ id: string }>()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateId, setCertificateId] = useState<number>(0)

  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const years = certificates.map((certificate) => {
    const getYear = new Date(certificate.calibrationDate).getFullYear()
    return getYear
  })

  const uniqueYears = years.filter((value, index, self) => {
    return self.indexOf(value) === index
  })

  console.log(uniqueYears.sort((a, b) => b - a))

  useEffect(() => {
    const getCertificates = async () => {
      try {
        setLoading(true)
        const response = await axios.get<Certificate[]>(
          `${apiUrl}/certificateHistory/certificate/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        if (response.status === 200) {
          setCertificates(response.data)
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
        console.error('Error fetching certificates:', error)
      }
    }

    getCertificates()
  }, [id])

  const handleDownload = async (path: string) => {
    const filePath = path

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

          bigToast(
            `Error al descargar el archivo: ${axiosError.response.statusText}`,
            'error'
          )
        } else {
          bigToast(
            `Error al descargar el archivo: ${axiosError.message}`,
            'error'
          )
        }
      } else {
        bigToast(
          `Error desconocido al descargar el archivo: ${error.message}`,
          'error'
        )
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(
        `${apiUrl}/certificateHistory/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.status === 200) {
        bigToast('Certificado eliminado con éxito', 'success')
        setCertificates(
          certificates.filter((certificate) => certificate.id !== id)
        )
      }
    } catch (error) {
      console.error('Error al eliminar el certificado:', error)
    }
  }

  const handleClickOpen = (id: number) => {
    setOpen(true)
    setCertificateId(id)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleConfirmDelete = () => {
    handleDelete(certificateId)
    handleClose()
  }

  return (
    <>
      {/* <Paper elevation={3} className="p-4 mt-8"> */}

      <Loader loading={loading} />
      {/* <Typography variant="h6" gutterBottom>
        Certificados del Dispositivo
      </Typography> */}
      <Divider className='mb-4' />
      <List>
        {certificates.map((certificate) => (
          <ListItem key={certificate.id}>
            <ListItemText
              primary={certificate.filePath}
              secondary={`Fecha de Calibración: ${new Date(
                certificate.calibrationDate
              ).toLocaleDateString()}`}
            />
            <Button
              variant='outlined'
              color='primary'
              onClick={() => handleDownload(certificate.filePath)}
            >
              Descargar
            </Button>
            <Button
              variant='outlined'
              color='error'
              onClick={() => handleClickOpen(certificate.id)}
              sx={{ ml: 2 }}
            >
              Eliminar
            </Button>
          </ListItem>
        ))}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que quieres eliminar este certificado? Esta
              acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color='primary'>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} color='error'>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </List>
      {/* </Paper> */}
    </>
  )
}

export default CertificatesList
