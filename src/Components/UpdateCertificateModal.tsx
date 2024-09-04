import React, { useState } from 'react'
import { Button, Modal, Box } from '@mui/material'
import { CloudUpload } from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import toast, { Toaster } from 'react-hot-toast'
import Loader from './Loader2'
import { DatePicker } from '@mui/x-date-pickers'
import useAxiosPrivate from '@utils/use-axios-private'

interface UpdateCertificateModalProps {
  open: boolean
  onClose: () => void
  id?: string
}

const VisuallyHiddenInput = styled('input')`
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

const UpdateCertificateModal: React.FC<UpdateCertificateModalProps> = ({
  open,
  onClose,
  id
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [previousDate, setPreviousDate] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setSelectedFileName(selectedFile.name)
    }
  }

  const handleChangeCalibrationDate = (date: Date | null) => {
    let newDate = date
    if (newDate) {
      setPreviousDate(newDate.toISOString())
      newDate.setFullYear(newDate.getFullYear() + 1)
      setNextDate(newDate.toISOString())
    }
  }

  const handleSave = async () => {
    try {
      // Aquí puedes realizar la solicitud HTTP a tu API para guardar los datos
      const formData = new FormData()
      formData.append('pdf', file as Blob)
      formData.append('calibrationDate', previousDate)
      formData.append('nextCalibrationDate', nextDate)
      formData.append('id', id as string)

      setLoading(true)
      const response = await axiosPrivate.put(`/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.status === 201) {
        setLoading(false)
        toast.success('Certificado Actualizado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
      }

      onClose()
    } catch (error) {
      setLoading(false)
      console.error('Error al guardar los datos del certificado:', error)
      // Puedes mostrar un mensaje de error al usuario si lo deseas
    }
  }
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <Toaster />
        <Loader loading={loading} />
        <Box>
          <DatePicker
            label='Fecha de Calibración'
            value={new Date(previousDate)}
            onChange={handleChangeCalibrationDate}
          />
        </Box>
        <Box>
          <DatePicker
            label='Fecha de Calibración'
            value={new Date(nextDate)}
            onChange={(e) => setNextDate(new Date(e as Date).toISOString())}
          />
        </Box>
        <Box>
          <Button
            component='label'
            variant='contained'
            startIcon={<CloudUpload />}
            href='#file-upload'
            //@ts-ignore
            onChange={handleFileChange}
            style={{
              textTransform: 'none'
            }}
          >
            {selectedFileName ? selectedFileName : 'Cargar Archivo'}
            <VisuallyHiddenInput type='file' accept='.pdf' />
          </Button>
        </Box>
        <Box
          sx={{
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button
            variant='contained'
            color='primary'
            onClick={handleSave}
            sx={{ marginLeft: '0.5rem', fontWeight: 'bold', color: '#DCFCE7' }}
          >
            Guardar
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={onClose}
            sx={{ marginLeft: '0.5rem' }}
          >
            Cancelar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default UpdateCertificateModal
