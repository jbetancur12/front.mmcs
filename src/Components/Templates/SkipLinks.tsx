// Skip Links component for keyboard navigation accessibility
import React from 'react'
import { Box, Link } from '@mui/material'
import { colors, spacing } from '../../theme/designSystem'

interface SkipLink {
  href: string
  label: string
}

interface SkipLinksProps {
  links?: SkipLink[]
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Saltar al contenido principal' },
  { href: '#templates-table', label: 'Saltar a la tabla de plantillas' },
  { href: '#create-template', label: 'Saltar al botón crear plantilla' },
  { href: '#search-filters', label: 'Saltar a los filtros de búsqueda' }
]

const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  return (
    <Box
      component='nav'
      aria-label='Enlaces de navegación rápida'
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10000
      }}
    >
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          sx={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            backgroundColor: colors.primary[600],
            color: '#ffffff',
            padding: `${spacing[2]} ${spacing[4]}`,
            borderRadius: '0 0 4px 4px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: `2px solid ${colors.primary[700]}`,
            '&:focus': {
              position: 'static',
              width: 'auto',
              height: 'auto',
              overflow: 'visible',
              left: 'auto',
              top: 'auto',
              zIndex: 10001,
              boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`
            },
            '&:hover:focus': {
              backgroundColor: colors.primary[700]
            }
          }}
        >
          {link.label}
        </Link>
      ))}{' '}
    </Box>
  )
}

export default SkipLinks
