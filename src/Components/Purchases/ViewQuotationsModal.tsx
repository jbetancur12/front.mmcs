import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'

interface ViewQuotationsModalProps {
  open: boolean
  onClose: () => void
  purchaseRequestId: number
  supplierId: string | null
  quotation: any // Recibir la cotización
}

const ViewQuotationsModal: React.FC<ViewQuotationsModalProps> = ({
  open,
  onClose,
  purchaseRequestId,
  supplierId,
  quotation
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAccepted, setIsAccepted] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      fetchPdf()
      checkIfAccepted()
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

  const checkIfAccepted = () => {
    if (quotation) {
      setIsAccepted(quotation.accepted)
    }
  }

  const handleAcceptQuotation = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas aceptar esta cotización?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        await axiosPrivate.post('/purchaseQuotations/accept', {
          purchaseRequestId,
          supplierId
        })
        Swal.fire('Aceptado', 'La cotización ha sido aceptada.', 'success')
        onClose()
      } catch (error) {
        console.error('Error accepting quotation:', error)
        setErrorMessage('Ocurrió un error al aceptar la cotización.')
        Swal.fire(
          'Error',
          'Ocurrió un error al aceptar la cotización.',
          'error'
        )
      }
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
        {isAccepted && (
          <Alert severity='success' sx={{ mt: 2 }}>
            Esta cotización ha sido aceptada.
          </Alert>
        )}
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
        <Button onClick={handleOnClose} color='secondary'>
          Cerrar
        </Button>
        {!isAccepted && (
          <Button
            onClick={handleAcceptQuotation}
            color='primary'
            variant='contained'
            sx={{
              backgroundColor: '#4caf50', // Verde
              '&:hover': {
                backgroundColor: '#388e3c' // Verde más oscuro en hover
              },
              marginLeft: '1rem'
            }}
          >
            Aceptar Cotización
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ViewQuotationsModal
