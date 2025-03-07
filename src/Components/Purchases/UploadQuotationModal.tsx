import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'

interface UploadQuotationModalProps {
  open: boolean
  onClose: () => void
  supplierId: string | null
  supplierName: string | null
  purchaseRequestId: number
  purchaseRequestCode: string | null
  onSuccess: () => void
}

const UploadQuotationModal: React.FC<UploadQuotationModalProps> = ({
  open,
  onClose,
  supplierId,
  supplierName,
  purchaseRequestId,
  purchaseRequestCode,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setErrorMessage('Solo se permiten archivos PDF.')
      setFile(null)
    } else {
      setErrorMessage(null)
      setFile(selectedFile || null)
    }
  }

  const handleUpload = async () => {
    if (!file || !supplierId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('supplierId', supplierId)
    formData.append('purchaseRequestId', purchaseRequestId.toString())
    formData.append('purchaseRequestCode', purchaseRequestCode || '')
    formData.append('supplierName', supplierName || '')

    try {
      await axiosPrivate.post('/purchaseQuotations', formData)
      Swal.fire(
        'Éxito',
        'La cotización ha sido subida correctamente.',
        'success'
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error uploading quotation:', error)
      setErrorMessage('Error al subir la cotización.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Subir Cotización</DialogTitle>
      <DialogContent>
        <Box display='flex' flexDirection='column' alignItems='center'>
          <Button
            variant='contained'
            component='label'
            color='primary'
            sx={{ mb: 2 }}
          >
            Seleccionar Archivo
            <input
              type='file'
              hidden
              accept='application/pdf'
              onChange={handleFileChange}
            />
          </Button>
          {file && (
            <Typography variant='body2' sx={{ mb: 2 }}>
              {file.name}
            </Typography>
          )}
          {errorMessage && (
            <Typography variant='body2' color='error'>
              {errorMessage}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleUpload} color='primary' disabled={!file}>
          Subir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadQuotationModal
