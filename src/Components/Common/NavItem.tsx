import React from 'react'
import { Link } from 'react-router-dom'
import { Box, ButtonBase, Tooltip } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

const TEAL_INK = '#00695c'
const TEAL_SOFT = '#e0f7f4'

interface NavItemProps {
  label: string
  /** Ícono de Material en variante Outlined. Los subítems no llevan ícono. */
  icon?: React.ReactNode
  /** Ruta del enlace. Sin `to` la fila es el botón de un grupo. */
  to?: string
  /** Es la página actual (o, en un grupo, contiene la página actual). */
  active?: boolean
  /** Solo para grupos: si sus opciones están a la vista. */
  expanded?: boolean
  /** Menú minimizado: solo el ícono, con el nombre en un tooltip. */
  minimized?: boolean
  /** Subítem dentro de un grupo: sangría y sin ícono. */
  nested?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

/**
 * Fila del menú lateral: un enlace, el botón de un grupo o una opción del
 * grupo. Un solo estado activo (fondo teal-soft, texto teal-ink y barra
 * de 3px); abrir un grupo solo gira la flecha.
 */
const NavItem: React.FC<NavItemProps> = ({
  label,
  icon,
  to,
  active = false,
  expanded,
  minimized = false,
  nested = false,
  onClick
}) => {
  const isGroup = !to
  const linkProps = to
    ? {
        component: Link,
        to,
        'aria-current': active && !isGroup ? ('page' as const) : undefined
      }
    : {
        component: 'button' as const,
        type: 'button' as const,
        'aria-expanded': expanded
      }

  const row = (
    <ButtonBase
      {...linkProps}
      onClick={onClick}
      aria-label={minimized ? label : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: minimized ? 'center' : 'flex-start',
        gap: 1.5,
        minHeight: nested ? 36 : 42,
        pl: minimized ? 0 : nested ? 5.5 : 1.5,
        pr: minimized ? 0 : 1.25,
        borderRadius: '8px',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? TEAL_INK : nested ? '#4b5563' : '#374151',
        bgcolor: active && (!isGroup || minimized) ? TEAL_SOFT : 'transparent',
        '&:hover': {
          bgcolor: active && (!isGroup || minimized) ? TEAL_SOFT : '#f3f4f6',
          color: active ? TEAL_INK : '#111827'
        },
        '&.Mui-focusVisible': {
          outline: `3px solid ${TEAL_INK}`,
          outlineOffset: -1
        },
        // Barra de "estás aquí": solo en el enlace activo, no en el grupo.
        '&::before':
          active && (!isGroup || minimized)
            ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 8,
                bottom: 8,
                width: 3,
                borderRadius: 3,
                bgcolor: TEAL_INK
              }
            : undefined
      }}
    >
      {icon && !nested && (
        <Box
          component='span'
          aria-hidden='true'
          sx={{
            display: 'flex',
            flexShrink: 0,
            color: active ? TEAL_INK : '#6b7280',
            '& svg': { fontSize: 22 }
          }}
        >
          {icon}
        </Box>
      )}
      {!minimized && (
        <Box
          component='span'
          sx={{
            flex: 1,
            minWidth: 0,
            lineHeight: 1.35,
            py: nested ? 0.75 : 0
          }}
        >
          {label}
        </Box>
      )}
      {expanded !== undefined && !minimized && (
        <KeyboardArrowDownIcon
          aria-hidden='true'
          sx={{
            fontSize: 20,
            color: '#6b7280',
            transition: 'transform .2s',
            transform: expanded ? 'rotate(180deg)' : 'none',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
          }}
        />
      )}
    </ButtonBase>
  )

  return minimized ? (
    <Tooltip title={label} placement='right' arrow>
      {row}
    </Tooltip>
  ) : (
    row
  )
}

export default NavItem
