// Template Card Component with Modern Styling and Elevation Effects
import React from 'react'
import { Typography, Box, Chip, Divider, Grid } from '@mui/material'
import {
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Science as ScienceIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { TemplatesData } from './types'
import TemplateActions from './TemplateActions'
import { ModernCard } from './styles'

interface TemplateCardProps {
  template: TemplatesData
  onEdit: (template: TemplatesData) => void
  onDelete: (id: number) => void
  onDuplicate: (template: TemplatesData) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ModernCard>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 3
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant='h6'
            component='h3'
            gutterBottom
            fontWeight='semibold'
          >
            {template.name}
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ marginBottom: 1 }}
          >
            {template.description}
          </Typography>
          {template.duplicated_from && (
            <Chip
              label='Plantilla Duplicada'
              size='small'
              color='info'
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
        <TemplateActions
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      </Box>

      <Divider sx={{ marginBottom: 3 }} />

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Location Information */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <LocationIcon
              sx={{
                color: 'text.secondary',
                marginRight: 1,
                fontSize: '1.2rem'
              }}
            />
            <Box>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Ubicación
              </Typography>
              <Typography variant='body2' fontWeight='medium'>
                {template.city}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontSize: '0.875rem' }}
              >
                {template.location}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Business Information */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <BusinessIcon
              sx={{
                color: 'text.secondary',
                marginRight: 1,
                fontSize: '1.2rem'
              }}
            />
            <Box>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Sede
              </Typography>
              <Typography variant='body2' fontWeight='medium'>
                {template.sede}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontSize: '0.875rem' }}
              >
                Activo: {template.activoFijo}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Equipment Information */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <ScienceIcon
              sx={{
                color: 'text.secondary',
                marginRight: 1,
                fontSize: '1.2rem'
              }}
            />
            <Box>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Instrumento
              </Typography>
              <Typography variant='body2' fontWeight='medium'>
                {template.instrumento}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontSize: '0.875rem' }}
              >
                Serie: {template.serie}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Process Information */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <PersonIcon
              sx={{
                color: 'text.secondary',
                marginRight: 1,
                fontSize: '1.2rem'
              }}
            />
            <Box>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Solicitante
              </Typography>
              <Typography variant='body2' fontWeight='medium'>
                {template.solicitante}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ marginY: 3 }} />

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon
            sx={{ color: 'text.secondary', marginRight: 1, fontSize: '1rem' }}
          />
          <Typography variant='body2' color='text.secondary'>
            Creado: {formatDate(template.created_at)}
          </Typography>
        </Box>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ fontSize: '0.75rem' }}
        >
          ID: #{template.id}
        </Typography>
      </Box>
    </ModernCard>
  )
}

export default TemplateCard
