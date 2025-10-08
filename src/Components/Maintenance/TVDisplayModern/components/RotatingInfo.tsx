import React, { useState, useEffect } from 'react'
import { Typography, Box, Fade } from '@mui/material'
import { Person, LocationOn, Schedule, Build } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useModernStyles } from '../hooks/useModernStyles'

interface RotatingInfoProps {
  ticket: any
  interval?: number // milliseconds
}

const RotatingInfo: React.FC<RotatingInfoProps> = ({
  ticket,
  interval = 4000
}) => {
  const { modernColors, tvTypography } = useModernStyles()
  const [infoIndex, setInfoIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const infoItems = [
    {
      icon: <Person sx={{ fontSize: '1.3rem', color: modernColors.primary }} />,
      text: `Técnico: ${ticket.assignedTechnician?.name || 'Sin asignar'}`,
      color: ticket.assignedTechnician?.name ? modernColors.textPrimary : modernColors.danger
    },
    {
      icon: <LocationOn sx={{ fontSize: '1.3rem', color: modernColors.info }} />,
      text: `Ubicación: ${ticket.location || ticket.equipmentLocation || 'No especificada'}`,
      color: modernColors.textSecondary
    },
    {
      icon: <Schedule sx={{ fontSize: '1.3rem', color: modernColors.warning }} />,
      text: `Creado: ${format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      color: modernColors.textSecondary
    },
    {
      icon: <Build sx={{ fontSize: '1.3rem', color: modernColors.success }} />,
      text: `Equipo: ${ticket.equipmentBrand} ${ticket.equipmentModel}`.trim(),
      color: modernColors.textSecondary
    }
  ]

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setInfoIndex(prev => (prev + 1) % infoItems.length)
        setIsVisible(true)
      }, 300) // Tiempo de transición
      
    }, interval)

    return () => clearInterval(rotationInterval)
  }, [interval, infoItems.length])

  const currentInfo = infoItems[infoIndex]

  return (
    <Box sx={{ 
      minHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      overflow: 'hidden'
    }}>
      <Fade in={isVisible} timeout={300}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: '100%'
        }}>
          {currentInfo.icon}
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: currentInfo.color,
              textShadow: '1px 1px 1px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {currentInfo.text}
          </Typography>
        </Box>
      </Fade>
    </Box>
  )
}

export default RotatingInfo