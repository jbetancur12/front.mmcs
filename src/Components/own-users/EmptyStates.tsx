import { Add, PersonAdd, Search } from '@mui/icons-material'
import { Box, Button } from '@mui/material'
import React from 'react'

// Empty state component when no users exist
export const EmptyState: React.FC<{ onCreateUser: () => void }> = ({
  onCreateUser
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 12,
      px: 4,
      textAlign: 'center',
      backgroundColor: '#fafbfc',
      borderRadius: '16px',
      border: '2px dashed #e1e5e9',
      minHeight: '400px'
    }}
  >
    <Box
      sx={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3
      }}
    >
      <PersonAdd sx={{ fontSize: 40, color: '#1976d2' }} />
    </Box>

    <h2
      style={{
        margin: '0 0 12px 0',
        color: '#1a202c',
        fontSize: '1.5rem',
        fontWeight: 600
      }}
    >
      No hay usuarios registrados
    </h2>

    <p
      style={{
        margin: '0 0 32px 0',
        color: '#718096',
        fontSize: '1rem',
        lineHeight: '1.5',
        maxWidth: '400px'
      }}
    >
      Comienza creando tu primer usuario del sistema. Los usuarios podrán
      acceder y gestionar la plataforma según sus roles asignados.
    </p>

    <Button
      variant='contained'
      size='large'
      startIcon={<Add />}
      onClick={onCreateUser}
      sx={{
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        px: 4,
        py: 1.5,
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(25, 118, 210, 0.4)'
        }
      }}
    >
      Crear Primer Usuario
    </Button>

    <Box sx={{ mt: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}
        >
          <span style={{ fontSize: '16px' }}>👤</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Gestión de usuarios
        </span>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}
        >
          <span style={{ fontSize: '16px' }}>🔐</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Control de roles
        </span>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#f0f9ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}
        >
          <span style={{ fontSize: '16px' }}>⚡</span>
        </Box>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Acceso rápido
        </span>
      </Box>
    </Box>
  </Box>
)

// No results found component
export const NoResultsFound: React.FC<{ searchTerm: string }> = ({
  searchTerm
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      textAlign: 'center',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db'
    }}
  >
    <Search sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
    <h3
      style={{
        margin: '0 0 8px 0',
        color: '#374151',
        fontSize: '1.125rem',
        fontWeight: 600
      }}
    >
      No se encontraron resultados
    </h3>
    <p
      style={{
        margin: '0 0 16px 0',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}
    >
      No hay usuarios que coincidan con &quot;{searchTerm}&quot;
    </p>
    <Button
      variant='outlined'
      size='small'
      onClick={() => window.location.reload()}
      sx={{
        borderRadius: '6px',
        textTransform: 'none',
        borderColor: '#d1d5db',
        color: '#6b7280',
        '&:hover': {
          borderColor: '#9ca3af',
          backgroundColor: '#f9fafb'
        }
      }}
    >
      Limpiar búsqueda
    </Button>
  </Box>
)
