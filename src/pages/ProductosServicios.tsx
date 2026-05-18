import { Box, Button, Stack, Typography } from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { useNavigate } from 'react-router-dom'
import TableProducts from '../Components/TableProducts'

const ProductosServicios = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: '100vh',
        backgroundColor: '#f8fafb',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(15px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both'
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          spacing={2}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.15)',
              flexShrink: 0
            }}
          >
            <Inventory2OutlinedIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box>
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => navigate('/calibration-services')}
              sx={{
                mb: 0.5,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                fontSize: '0.85rem',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff' }
              }}
            >
              Volver a servicios
            </Button>
            <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, letterSpacing: '-0.025em', fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Productos y servicios
            </Typography>
            <Typography variant='body2' sx={{ mt: 0.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: 640, fontSize: '0.9rem' }}>
              Catálogo base de servicios de calibración para las cotizaciones del módulo.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
        <TableProducts />
      </Box>
    </Box>
  )
}

export default ProductosServicios
