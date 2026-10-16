import { Button, Container } from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { useNavigate } from 'react-router-dom'
import TableProducts from '../Components/TableProducts'

const ProductosServicios = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate('/calibration-services')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a servicios
      </Button>
      <TableProducts />
    </Container>
  )
}

export default ProductosServicios
