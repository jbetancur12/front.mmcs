import React from 'react'
import { Container, Typography, Paper, Box } from '@mui/material'
import { userStore } from 'src/store/userStore'
import { useStore } from '@nanostores/react'

const Welcome: React.FC = () => {
  const $userStore = useStore(userStore)
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
      </Paper>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <video
          id='main-video'
          style={{ width: '100%', height: 'auto', maxHeight: '500px' }}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src='/videos/videommcs.mp4' type='video/mp4' />
          Your browser does not support the video tag.
        </video>
      </Box>
    </Container>
  )
}

export default Welcome
