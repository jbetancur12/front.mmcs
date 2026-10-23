import React from 'react'
import { Alert } from '@mui/material'

interface FormErrorSummaryProps {
  /** Cantidad de campos con error; con 0 no se muestra nada. */
  count: number
}

/** Aviso al enviar un formulario con campos inválidos. Sin emojis. */
const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ count }) =>
  count > 0 ? (
    <Alert severity='error' variant='outlined' sx={{ borderRadius: '12px' }}>
      Hay {count} {count === 1 ? 'campo' : 'campos'} con errores. Revise los
      campos resaltados.
    </Alert>
  ) : null

export default FormErrorSummary
