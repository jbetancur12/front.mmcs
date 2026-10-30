import { getApiErrorReason } from 'src/utils/apiError'
import React, { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import useAxiosPrivate from '@utils/use-axios-private'
import FormDialog, { FormDialogSection } from './Common/FormDialog'
import FileDropZone from './Common/FileDropZone'

interface UpdateCertificateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  id?: string
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Reemplaza el PDF de un certificado y renueva sus fechas de calibración. */
const UpdateCertificateModal: React.FC<UpdateCertificateModalProps> = ({
  open,
  onClose,
  onSuccess,
  id
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [previousDate, setPreviousDate] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  const resetForm = () => {
    setPreviousDate('')
    setNextDate('')
    setFile(null)
    setFileInputKey(Date.now())
  }

  // Limpiar el formulario cuando el modal se abre
  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const handleChangeCalibrationDate = (date: Date | null) => {
    if (date) {
      const next = new Date(date)
      next.setFullYear(next.getFullYear() + 1)
      setPreviousDate(date.toISOString())
      setNextDate(next.toISOString())
    }
  }

  const handleSave = async () => {
    if (!file || !previousDate || !nextDate) return

    try {
      const formData = new FormData()
      formData.append('pdf', file as Blob)
      formData.append('calibrationDate', previousDate)
      formData.append('nextCalibrationDate', nextDate)
      formData.append('id', id as string)

      setLoading(true)
      const response = await axiosPrivate.put('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 201) {
        setLoading(false)
        toast.success('Certificado actualizado exitosamente', {
          duration: 4000,
          position: 'top-center'
        })
        // Notificar éxito al componente padre para refrescar datos
        onSuccess()
        resetForm()
        // Delay antes de cerrar para que el aviso sea visible
        setTimeout(() => {
          onClose()
        }, 500)
      }
    } catch (error: any) {
      setLoading(false)
      console.error('Error al guardar los datos del certificado:', error)

      // Archivo duplicado (409)
      if (error.response && error.response.status === 409) {
        toast.error(
          getApiErrorReason(error) ||
            'El archivo con este nombre ya existe. Por favor, renombre el archivo e intente nuevamente.',
          { duration: 5000, position: 'top-center' }
        )
      } else {
        toast.error('Error al actualizar el certificado. Intenta nuevamente.', {
          duration: 4000,
          position: 'top-center'
        })
      }
    }
  }

  const periodYears =
    previousDate && nextDate
      ? Math.round(
          (new Date(nextDate).getTime() - new Date(previousDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        )
      : null

  return (
    <>
      <FormDialog
        open={open}
        onClose={loading ? () => undefined : onClose}
        title='Actualizar certificado'
        subtitle='Sube el nuevo PDF y renueva las fechas de calibración'
        submitLabel='Actualizar certificado'
        onSubmit={() => void handleSave()}
        loading={loading}
        submitDisabled={!file || !previousDate || !nextDate}
        maxWidth='sm'
      >
        <FormDialogSection title='Certificado en PDF'>
          <Box sx={FULL_ROW}>
            <FileDropZone
              file={file}
              onFileSelected={setFile}
              inputKey={fileInputKey}
              disabled={loading}
              onReject={(message) =>
                toast.error(message, { duration: 3000, position: 'top-center' })
              }
            />
          </Box>
        </FormDialogSection>

        <FormDialogSection title='Fechas de calibración'>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label='Fecha de calibración'
              value={previousDate ? new Date(previousDate) : null}
              onChange={handleChangeCalibrationDate}
              slotProps={{ textField: { required: true } }}
            />
            <DatePicker
              label='Próxima calibración'
              value={nextDate ? new Date(nextDate) : null}
              onChange={(date) =>
                setNextDate(date ? new Date(date as Date).toISOString() : '')
              }
              slotProps={{ textField: { required: true } }}
            />
          </LocalizationProvider>
          {periodYears !== null ? (
            <Typography variant='body2' sx={{ ...FULL_ROW, color: '#4b5563' }}>
              Periodo de calibración: <strong>{periodYears} año(s)</strong>
            </Typography>
          ) : null}
        </FormDialogSection>
      </FormDialog>
    </>
  )
}

export default UpdateCertificateModal
