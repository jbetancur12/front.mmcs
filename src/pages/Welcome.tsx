import React from 'react'
import { Container, Typography, Paper, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { userStore } from 'src/store/userStore'
import { useStore } from '@nanostores/react'

const Welcome: React.FC = () => {
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const hasLearningAccess = ($userStore.rol || []).some((role) =>
    ['employee', 'user', 'client', 'lms_only', 'Training Manager', 'admin'].includes(role)
  )
  return (
    <Container maxWidth='md' sx={{ mt: 8, minHeight: '80vh' }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: '16px',
          textAlign: 'center',
          background: 'linear-gradient(165deg, #fff 0%, #9CF08B 100%)',
          maxWidth: '80%',
          margin: '0 auto'
        }}
      >
        <Typography
          variant='h4'
          component='h1'
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#006064' }}
        >
          ¡Bienvenid@, {$userStore.nombre}!
        </Typography>
        <Typography variant='body1' gutterBottom sx={{ color: '#004D40' }}>
          Gracias por iniciar sesión en nuestra aplicación. Aquí podrás
          gestionar tus actividades de forma fácil y rápida.
        </Typography>
        <Typography variant='h6' component='p' sx={{ mt: 3, color: '#00796B' }}>
          Para empezar, selecciona una de las opciones del menú de la izquierda.
        </Typography>
        {hasLearningAccess && (
          <Button
            variant='contained'
            size='large'
            sx={{ mt: 3 }}
            onClick={() => navigate('/lms')}
          >
            Ir a Mi Aprendizaje
          </Button>
        )}
      </Paper>

    </Container>
  )
}

export default Welcome
