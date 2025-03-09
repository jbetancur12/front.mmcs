// import QuoteForm from '../Components/QuoteForm'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import QuoteForm from 'src/Components/Quotations/QuoteForm'

const NewQuote = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // Regresa a la página anterior en el historial de navegación
  }

  return (
    <div>
      <Button
        variant='contained'
        onClick={handleGoBack}
        startIcon={<ArrowBack />}
        sx={{ mr: 2, mb: 2 }}
      />

      <QuoteForm />
    </div>
  )
}

export default NewQuote
