import React from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Typography
} from '@mui/material'
import {
  ArrowForward as ArrowForwardIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface PendingAction {
  label: string
  description: string
  route: string
}

interface LmsAdminPendingFeatureProps {
  title: string
  summary: string
  statusLabel?: string
  limitations: string[]
  availableNow: string[]
  suggestedActions: PendingAction[]
}

const LmsAdminPendingFeature: React.FC<LmsAdminPendingFeatureProps> = ({
  title,
  summary,
  statusLabel = 'Implementación Parcial',
  limitations,
  availableNow,
  suggestedActions
}) => {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ConstructionIcon color='warning' />
          <Box>
            <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {summary}
            </Typography>
          </Box>
          <Chip label={statusLabel} color='warning' variant='outlined' sx={{ ml: 'auto' }} />
        </Box>

        <Alert severity='warning'>
          Esta pantalla dejó de mostrar datos mock para evitar decisiones sobre información ficticia.
        </Alert>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Pendiente Para Cierre
              </Typography>
              <Box component='ul' sx={{ pl: 3, mb: 0 }}>
                {limitations.map((item) => (
                  <Typography component='li' key={item} variant='body2' sx={{ mb: 1 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Disponible Hoy
              </Typography>
              <Box component='ul' sx={{ pl: 3, mb: 0 }}>
                {availableNow.map((item) => (
                  <Typography component='li' key={item} variant='body2' sx={{ mb: 1 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Caminos Reales Mientras Tanto
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {suggestedActions.map((action) => (
                  <Grid item xs={12} md={4} key={action.route}>
                    <Card variant='outlined' sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
                          {action.label}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                          {action.description}
                        </Typography>
                        <Button
                          variant='outlined'
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate(action.route)}
                        >
                          Abrir
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LmsAdminPendingFeature
