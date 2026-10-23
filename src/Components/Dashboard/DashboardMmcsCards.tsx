import React, { useMemo, useState } from 'react'
import {
  EmailOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  SearchOff,
  VisibilityOutlined
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../Common/EmptyState'
import StatusPill from '../Common/StatusPill'
import { CustomerSummary } from './dashboardCertificates'

interface DashboardCardsProps {
  customers: CustomerSummary[]
}

/** Los mismos clientes de la tabla, en tarjetas; los más urgentes primero. */
const DashboardCards: React.FC<DashboardCardsProps> = ({ customers }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const list = [...customers].sort(
      (a, b) => b.expired - a.expired || b.upcoming - a.upcoming
    )
    if (!term) return list
    return list.filter((customer) =>
      [
        customer.nombre,
        customer.identificacion,
        customer.email,
        customer.ciudad
      ].some((value) => value?.toLowerCase().includes(term))
    )
  }, [customers, searchTerm])

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}
      >
        <TextField
          size='small'
          placeholder='Buscar por cliente, NIT, correo o ciudad'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon sx={{ color: '#6b7280' }} />
              </InputAdornment>
            )
          }}
          inputProps={{ 'aria-label': 'Buscar clientes' }}
          sx={{
            minWidth: { xs: 0, sm: 340 },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              { borderColor: '#00897B', borderWidth: 2 }
          }}
        />
        <Typography variant='body2' color='text.secondary' aria-live='polite'>
          {filtered.length.toLocaleString('es-CO')}{' '}
          {filtered.length === 1 ? 'cliente' : 'clientes'}
        </Typography>
      </Box>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchOff />}
          title='Ningún cliente coincide'
          hint='Prueba con otra búsqueda o quita el filtro de los indicadores.'
        />
      ) : (
        <Grid container spacing={3}>
          {filtered.map((customer) => (
            <Grid item xs={12} md={6} lg={4} key={customer.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#00BFA5',
                        mr: 1.5,
                        width: 40,
                        height: 40,
                        fontWeight: 700
                      }}
                    >
                      {customer.nombre.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='subtitle1' noWrap fontWeight={700}>
                        {customer.nombre}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        NIT {customer.identificacion}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 0.75, mb: 2 }}>
                    {[
                      { icon: <EmailOutlined />, text: customer.email },
                      { icon: <PhoneOutlined />, text: customer.telefono },
                      {
                        icon: <LocationOnOutlined />,
                        text: [customer.ciudad, customer.departamento]
                          .filter(Boolean)
                          .join(', ')
                      }
                    ].map(({ icon, text }, index) => (
                      <Box
                        key={index}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {React.cloneElement(icon, {
                          sx: { fontSize: 16, color: '#6b7280' }
                        })}
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          noWrap
                        >
                          {text || '—'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}
                  >
                    {customer.expired > 0 ? (
                      <StatusPill
                        size='small'
                        tone='error'
                        label={`${customer.expired} vencidos`}
                      />
                    ) : null}
                    {customer.upcoming > 0 ? (
                      <StatusPill
                        size='small'
                        tone='warning'
                        label={`${customer.upcoming} próximos`}
                      />
                    ) : null}
                    <Typography variant='caption' color='text.secondary'>
                      de {customer.total} certificados
                    </Typography>
                  </Box>
                </CardContent>

                <Box sx={{ px: 2, pb: 2 }}>
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<VisibilityOutlined />}
                    onClick={() =>
                      navigate(`/customers/certificates-due/${customer.id}`)
                    }
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#e5e7eb',
                      color: '#374151',
                      '&:hover': {
                        borderColor: '#00897B',
                        color: '#00695C',
                        backgroundColor: '#E0F7F4'
                      }
                    }}
                  >
                    Ver certificados
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default DashboardCards
