import { Edit, Email, LocationOn, Phone } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import React from 'react'

import { ModernSwitch } from './ModernSwitch'
import { CustomerProfileData } from './types'

interface CustomerProfileBannerProps {
  image: string
  customerData?: CustomerProfileData
  canChangeAvatar: boolean
  canUpdateCustomer: boolean
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleStatusChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/** Dato de contacto del banner: ícono en círculo, etiqueta y valor. */
const ContactItem = ({
  icon,
  label,
  children
}: {
  icon: React.ReactElement
  label: string
  children: React.ReactNode
}) => (
  <Box display='flex' alignItems='flex-start' gap={1.5} sx={{ minWidth: 0 }}>
    <Box
      aria-hidden
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.18)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 20 } })}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        component='div'
        variant='body1'
        fontWeight={600}
        sx={{ overflowWrap: 'anywhere' }}
      >
        {children}
      </Typography>
    </Box>
  </Box>
)

/** Banner esmeralda con avatar, estado y datos de contacto del cliente. */
const CustomerProfileBanner = ({
  image,
  customerData,
  canChangeAvatar,
  canUpdateCustomer,
  handleImageChange,
  handleStatusChange
}: CustomerProfileBannerProps) => (
  <Card
    elevation={0}
    sx={{
      mb: 4,
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative'
    }}
  >
    {/* Decorative elements */}
    <Box
      sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        zIndex: 0
      }}
    />

    <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
      <Grid container spacing={3} alignItems='center'>
        <Grid item xs={12} md={4}>
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            textAlign='center'
          >
            <Box sx={{ position: 'relative', mb: 2 }}>
              <label htmlFor='imageInput' style={{ cursor: 'pointer' }}>
                <Avatar
                  src={image}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontSize: 48,
                    fontWeight: 700,
                    border: '4px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease-in-out'
                    }
                  }}
                >
                  {customerData?.nombre?.charAt(0)}
                </Avatar>
              </label>
              <input
                type='file'
                id='imageInput'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {canChangeAvatar && (
                <Tooltip title='Cambiar imagen'>
                  <IconButton
                    component='label'
                    htmlFor='imageInput'
                    aria-label='Cambiar imagen del cliente'
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'white',
                      color: '#00695C',
                      '&:hover': { backgroundColor: '#E0F7F4' }
                    }}
                    size='small'
                  >
                    <Edit fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography
              variant='h4'
              fontWeight='bold'
              gutterBottom
              sx={{ overflowWrap: 'anywhere' }}
            >
              {customerData?.nombre}
            </Typography>
            {/* Status Switch */}
            <Box
              sx={{
                position: { xs: 'static', md: 'absolute' },
                top: 20,
                right: 20,
                mt: { xs: 2, md: 0 },
                zIndex: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '8px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Typography
                variant='body2'
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                {customerData?.isActive ? 'Cliente Activo' : 'Cliente Inactivo'}
              </Typography>
              <ModernSwitch
                checked={customerData?.isActive || false}
                onChange={handleStatusChange}
                disabled={!canUpdateCustomer}
              />
            </Box>{' '}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          {/* Panel oscuro suave: da contraste al texto blanco sobre el verde */}
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: 'rgba(0,0,0,0.28)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))'
              }
            }}
          >
            <ContactItem icon={<Email />} label='Email'>
              {customerData?.email || '—'}
            </ContactItem>
            <ContactItem icon={<Phone />} label='Teléfono'>
              {customerData?.telefono || '—'}
            </ContactItem>
            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
              <ContactItem
                icon={<LocationOn />}
                label={`Sedes (${customerData?.sede?.length || 0})`}
              >
                <Box display='flex' flexWrap='wrap' gap={1} sx={{ mt: 0.5 }}>
                  {customerData?.sede?.slice(0, 3).map((sede, index) => (
                    <Chip
                      key={index}
                      label={sede}
                      size='small'
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  ))}
                  {(customerData?.sede?.length || 0) > 3 && (
                    <Chip
                      label={`+${(customerData?.sede?.length || 0) - 3} más`}
                      size='small'
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
              </ContactItem>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)

export default CustomerProfileBanner
