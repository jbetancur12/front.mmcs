import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'

interface UploadQuotationModalProps {
  open: boolean
  onClose: () => void
  supplierId: string | null
  purchaseRequestId: number
  onSuccess: () => void
}

const UploadQuotationModal: React.FC<UploadQuotationModalProps> = ({
  open,
  onClose,
  supplierId,
  purchaseRequestId,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !supplierId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('supplierId', supplierId)
    formData.append('purchaseRequestId', purchaseRequestId.toString())

    try {
      await axiosPrivate.post('/purchaseQuotations', formData)
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
        <TextField
          type='file'
          onChange={handleFileChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleUpload} color='primary'>
          Subir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadQuotationModal
