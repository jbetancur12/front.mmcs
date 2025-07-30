import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { Box, CircularProgress, Typography } from '@mui/material'

interface User {
  id: number
  email: string
  role: string
  name: string
}

const LmsDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  useEffect(() => {
    // Simular la obtención del usuario actual
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user))
    } else {
      // Si no hay usuario en localStorage, usar el del store
      const storeUser = $userStore
      if (storeUser && storeUser.rol) {
        // Determinar el rol basado en los roles del store
        const roles = Array.isArray(storeUser.rol)
          ? storeUser.rol
          : [storeUser.rol]
        let lmsRole = 'client' // default

        if (roles.includes('admin')) {
          lmsRole = 'admin'
        } else if (roles.includes('employee')) {
          lmsRole = 'employee'
        }

        setCurrentUser({
          id: storeUser.customer?.id || 1,
          email: storeUser.email || '',
          role: lmsRole,
          name: storeUser.nombre || storeUser.email || 'Usuario'
        })
      } else {
        navigate('/login')
        return
      }
    }
  }, [navigate, $userStore])

  useEffect(() => {
    if (currentUser) {
      // Redirigir según el rol
      switch (currentUser.role) {
        case 'admin':
          navigate('/lms/admin')
          break
        case 'employee':
          navigate('/lms/employee')
          break
        case 'client':
          navigate('/lms/client')
          break
        default:
          navigate('/lms/client')
          break
      }
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
        flexDirection='column'
      >
        <CircularProgress />
        <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
          Cargando LMS...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      height='100vh'
      flexDirection='column'
    >
      <CircularProgress />
      <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
        Redirigiendo a tu dashboard...
      </Typography>
    </Box>
  )
}

export default LmsDashboard
