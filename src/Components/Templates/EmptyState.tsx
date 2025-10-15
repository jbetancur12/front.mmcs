// Empty State Component with Helpful Guidance
import React from 'react'
import {
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material'
import { EmptyStateContainer, CreateButton } from './styles'

interface EmptyStateProps {
  variant?: 'initial' | 'search' | 'filter'
  onCreateTemplate?: () => void
  onClearSearch?: () => void
  searchTerm?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'initial',
  onCreateTemplate,
  onClearSearch,
  searchTerm
}) => {
  if (variant === 'search') {
    return (
      <EmptyStateContainer>
        <SearchIcon />

        <Typography variant='h5' component='h2' gutterBottom>
          No se encontraron resultados
        </Typography>

        <Typography variant='body1' gutterBottom>
          No hay plantillas que coincidan con "{searchTerm}". Intenta con otros
          términos de búsqueda.
        </Typography>

        {onClearSearch && (
          <Button
            variant='outlined'
            onClick={onClearSearch}
            sx={{ marginTop: 2 }}
          >
            Limpiar búsqueda
          </Button>
        )}
      </EmptyStateContainer>
    )
  }

  if (variant === 'filter') {
    return (
      <EmptyStateContainer>
        <FilterIcon />

        <Typography variant='h5' component='h2' gutterBottom>
          No hay plantillas con estos filtros
        </Typography>

        <Typography variant='body1' gutterBottom>
          Ajusta los filtros para ver más resultados.
        </Typography>
      </EmptyStateContainer>
    )
  }

  // Default initial empty state
  return (
    <EmptyStateContainer>
      <DescriptionIcon />

      <Typography variant='h5' component='h2' gutterBottom>
        No hay plantillas de mapeo Excel creadas
      </Typography>

      <Typography variant='body1' gutterBottom sx={{ marginBottom: 4 }}>
        Las plantillas definen las referencias de celdas Excel (como L14, E45)
        donde se encuentran los datos específicos. Esto permite automatizar la
        lectura de archivos Excel con diferentes formatos.
      </Typography>

      {/* Benefits List */}
      <Box sx={{ marginBottom: 4, textAlign: 'left', maxWidth: 600 }}>
        <Typography
          variant='h6'
          gutterBottom
          sx={{ textAlign: 'center', marginBottom: 2 }}
        >
          ¿Qué puedes hacer con las plantillas de mapeo Excel?
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color='success' fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Definir referencias de celdas Excel'
              secondary='Especifica dónde se encuentra cada dato (ej: Ciudad en E45, Fecha en L14)'
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color='success' fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Automatizar la lectura de archivos Excel'
              secondary='El sistema extrae automáticamente los datos de las celdas especificadas'
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color='success' fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Reutilizar configuraciones para diferentes formatos'
              secondary='Crea plantillas para distintos tipos de documentos Excel'
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color='success' fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary='Procesar múltiples archivos con el mismo formato'
              secondary='Una vez definida la plantilla, procesa cualquier archivo con esa estructura'
            />
          </ListItem>
        </List>
      </Box>

      {onCreateTemplate && (
        <CreateButton
          size='large'
          startIcon={<AddIcon />}
          onClick={onCreateTemplate}
        >
          Crear Primera Plantilla
        </CreateButton>
      )}

      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ marginTop: 4, maxWidth: 500 }}
      >
        <strong>Consejo:</strong> Define las referencias de celdas donde se
        encuentran datos como ciudad, ubicación, sede, activo fijo, serie,
        solicitante, instrumento y fecha de calibración. Usa el formato de Excel
        (ej: A1, B5, L14).
      </Typography>
    </EmptyStateContainer>
  )
}

export default EmptyState
