import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'

interface ViewQuotationsModalProps {
  open: boolean
  onClose: () => void
  purchaseRequestId: number
  supplierId: string | null
}

const ViewQuotationsModal: React.FC<ViewQuotationsModalProps> = ({
  open,
  onClose,
  purchaseRequestId,
  supplierId
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPdf()
    }
  }, [open])

  const fetchPdf = async () => {
    try {
      const response = await axiosPrivate.get(
        `/purchaseQuotations?purchaseRequestId=${purchaseRequestId}&supplierId=${supplierId}`,
        { responseType: 'blob' }
      )

      if (response.headers['content-type'] !== 'application/pdf') {
        const reader = new FileReader()
        reader.onload = () => {
          const text = reader.result as string
          const json = JSON.parse(text)
          if (json.resp === 'No se encontraron cotizaciones') {
            setErrorMessage(
              'No se encontraron cotizaciones para esta solicitud.'
            )
          } else {
            setErrorMessage('Ocurrió un error al cargar la cotización.')
          }
        }
        reader.readAsText(response.data)
        return
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      )
      setPdfUrl(url)
      setErrorMessage(null)
    } catch (error) {
      console.error('Error fetching file:', error)
      setErrorMessage('Ocurrió un error al cargar la cotización.')
    }
  }

  const handleOnClose = () => {
    onClose()
    setPdfUrl(null)
    setErrorMessage(null)
  }

  return (
    <Dialog open={open} onClose={handleOnClose} maxWidth='md' fullWidth>
      <DialogTitle>Ver Cotización</DialogTitle>
      <DialogContent>
        {errorMessage ? (
          <p>{errorMessage}</p>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            width='100%'
            height='500px'
            title='Cotización PDF'
          />
        ) : (
          <p>Cargando...</p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOnClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewQuotationsModal
