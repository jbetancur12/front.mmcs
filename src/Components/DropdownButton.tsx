import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { hasPermission, PermissionKey } from 'src/constants/permissions'
import NavItem from './Common/NavItem'

interface DropdownButtonProps {
  buttonText: string
  menuItems: {
    label: string
    url: string
    /** Visibilidad por rol (menús que aún no migraron a capacidades) */
    roles?: string[]
    /** Visibilidad por capacidad (any-of): lo que el backend dice que el usuario puede hacer */
    permission?: PermissionKey | readonly PermissionKey[]
  }[]
  icon: React.ReactNode
  rol: string[]
  /** Capacidades del usuario (sesión); necesarias para los ítems con `permission` */
  permissions?: string[]
  currentPath: string
  onlyIcons?: boolean
  onItemClick?: () => void
}

const toPath = (url: string) => `/${url.replace(/^\//, '')}`

/**
 * Ítem activo del grupo: el de ruta exacta o, en páginas de detalle
 * (`/calibraciones/equipos/123`), el de prefijo más largo.
 */
const findActiveUrl = (urls: string[], currentPath: string) =>
  urls
    .filter(
      (url) =>
        currentPath === toPath(url) || currentPath.startsWith(`${toPath(url)}/`)
    )
    .sort((a, b) => toPath(b).length - toPath(a).length)[0]

const DropdownButton: React.FC<DropdownButtonProps> = ({
  buttonText,
  menuItems,
  icon,
  rol,
  permissions,
  currentPath,
  onlyIcons = false,
  onItemClick
}) => {
  const isItemVisible = (item: DropdownButtonProps['menuItems'][number]) =>
    item.permission
      ? hasPermission(permissions, item.permission)
      : (item.roles ?? []).some((role) => rol.includes(role))

  const visibleItems = menuItems.filter(isItemVisible)
  const activeUrl = findActiveUrl(
    visibleItems.map((item) => item.url),
    currentPath
  )
  const containsCurrentPage = Boolean(activeUrl)

  const [isDropdownOpen, setIsDropdownOpen] = useState(containsCurrentPage)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Abierto mientras la página actual pertenezca al grupo; al salir, se cierra.
  React.useEffect(() => {
    setIsDropdownOpen(containsCurrentPage)
  }, [containsCurrentPage])

  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onlyIcons) {
      setAnchorEl(event.currentTarget)
    } else {
      setIsDropdownOpen(!isDropdownOpen)
    }
  }

  const handleItemClick = () => {
    setAnchorEl(null)
    onItemClick?.()
  }

  // Con una sola opción visible (p. ej. un cliente en Academia) el desplegable
  // sobra: el grupo es un enlace directo.
  if (visibleItems.length === 1) {
    return (
      <li>
        <NavItem
          label={buttonText}
          icon={icon}
          to={toPath(visibleItems[0].url)}
          active={containsCurrentPage}
          minimized={onlyIcons}
          onClick={handleItemClick}
        />
      </li>
    )
  }

  return (
    <li>
      <NavItem
        label={buttonText}
        icon={icon}
        active={containsCurrentPage}
        expanded={onlyIcons ? Boolean(anchorEl) : isDropdownOpen}
        minimized={onlyIcons}
        onClick={handleButtonClick}
      />
      {onlyIcons ? (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              minWidth: 220,
              ml: 1,
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }
          }}
          MenuListProps={{ 'aria-label': buttonText }}
        >
          {visibleItems.map((item) => (
            <MenuItem
              key={item.url}
              selected={item.url === activeUrl}
              onClick={handleItemClick}
              component={Link}
              to={toPath(item.url)}
              sx={{
                fontSize: 14,
                '&.Mui-selected, &.Mui-selected:hover': {
                  bgcolor: '#e0f7f4',
                  color: '#00695c',
                  fontWeight: 600
                }
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      ) : (
        isDropdownOpen && (
          <ul aria-label={buttonText} className='mt-0.5 space-y-0.5'>
            {visibleItems.map((item) => (
              <li key={item.url}>
                <NavItem
                  nested
                  label={item.label}
                  to={toPath(item.url)}
                  active={item.url === activeUrl}
                  onClick={handleItemClick}
                />
              </li>
            ))}
          </ul>
        )
      )}
    </li>
  )
}

export default DropdownButton
