import React from 'react'
import { Box, Button, Container, Paper, Typography } from '@mui/material'
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import { useNavigate } from 'react-router-dom'
import { userStore } from 'src/store/userStore'
import { useStore } from '@nanostores/react'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'

const Welcome: React.FC = () => {
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const hasLearningAccess = ($userStore.rol || []).some((role) =>
    ['employee', 'user', 'client', 'lms_only', 'Training Manager', 'admin'].includes(role)
  )
  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title={`¡Bienvenid@, ${$userStore.nombre}!`}
        subtitle='Gracias por iniciar sesión. Aquí podrás gestionar tus actividades de forma fácil y rápida.'
        icon={<WavingHandRoundedIcon />}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(2, minmax(0, 1fr))'
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: '#E0F7F4',
              color: '#00BFA5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <MenuOpenRoundedIcon />
          </Box>
          <Box>
            <Typography fontWeight={600}>Para empezar</Typography>
            <Typography variant='body2' color='text.secondary'>
              Selecciona una de las opciones del menú de la izquierda.
            </Typography>
          </Box>
        </Paper>
        {hasLearningAccess && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: '#E0F7F4',
                color: '#00BFA5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <SchoolRoundedIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight={600}>Mi Aprendizaje</Typography>
              <Typography variant='body2' color='text.secondary'>
                Revisa tus cursos y capacitaciones.
              </Typography>
            </Box>
            <Button
              variant='contained'
              onClick={() => navigate('/lms')}
              sx={{
                bgcolor: '#00BFA5',
                textTransform: 'none',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Ir a Mi Aprendizaje
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default Welcome
