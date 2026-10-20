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
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                    size='small'
                  >
                    <Edit fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant='h4' fontWeight='bold' gutterBottom>
              {customerData?.nombre}
            </Typography>
            {/* Status Switch */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display='flex' alignItems='center' mb={2}>
                <Email sx={{ mr: 2, opacity: 0.8 }} />
                <Box>
                  <Typography variant='body2' sx={{ opacity: 0.8 }}>
                    Email
                  </Typography>
                  <Typography variant='body1' fontWeight='500'>
                    {customerData?.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display='flex' alignItems='center' mb={2}>
                <Phone sx={{ mr: 2, opacity: 0.8 }} />
                <Box>
                  <Typography variant='body2' sx={{ opacity: 0.8 }}>
                    Teléfono
                  </Typography>
                  <Typography variant='body1' fontWeight='500'>
                    {customerData?.telefono}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display='flex' alignItems='flex-start'>
                <LocationOn sx={{ mr: 2, mt: 0.5, opacity: 0.8 }} />
                <Box>
                  <Typography variant='body2' sx={{ opacity: 0.8, mb: 1 }}>
                    Sedes ({customerData?.sede?.length || 0})
                  </Typography>
                  <Box display='flex' flexWrap='wrap' gap={1}>
                    {customerData?.sede?.slice(0, 3).map((sede, index) => (
                      <Chip
                        key={index}
                        label={sede}
                        size='small'
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontSize: '0.75rem'
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
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)

export default CustomerProfileBanner
