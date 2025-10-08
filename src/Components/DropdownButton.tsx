import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

interface DropdownButtonProps {
  buttonText: string
  menuItems: { label: string; url: string; roles: string[] }[]
  pathData: string
  rol: string[]
  currentPath: string
  onlyIcons?: boolean
  onItemClick?: () => void
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  buttonText,
  menuItems,
  pathData,
  rol,
  currentPath,
  onlyIcons = false,
  onItemClick
}) => {
  // Verificar si la página actual pertenece a este dropdown
  const isCurrentPageInDropdown = menuItems
    .filter((item) => item.roles.some((role) => rol.includes(role)))
    .some((item) => currentPath === `/${item.url}`)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(isCurrentPageInDropdown)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  // Efecto para mantener el dropdown abierto si la página actual pertenece a él
  // y cerrarlo si la página actual NO pertenece a él
  React.useEffect(() => {
    if (isCurrentPageInDropdown) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }, [isCurrentPageInDropdown])

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onlyIcons) {
      setAnchorEl(event.currentTarget)
    } else {
      setIsDropdownOpen(!isDropdownOpen)
    }
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleItemClick = (itemUrl: string) => {
    // Solo cerrar el dropdown si navegamos fuera de las opciones de este dropdown
    const willStayInDropdown = menuItems
      .filter((item) => item.roles.some((role) => rol.includes(role)))
      .some((item) => `/${item.url}` === itemUrl)
    
    if (!willStayInDropdown) {
      setIsDropdownOpen(false)
    }
    
    setAnchorEl(null)
    onItemClick?.()
  }

  return (
    <div>
      <button
        type='button'
        onClick={handleButtonClick}
        aria-expanded={isDropdownOpen || Boolean(anchorEl)}
        className={`flex items-center w-full p-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
          isDropdownOpen || Boolean(anchorEl) || isCurrentPageInDropdown
            ? 'bg-[#6dc662]/10 text-[#6dc662] shadow-sm dark:bg-[#6dc662]/20 dark:text-[#6dc662]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white'
        } ${onlyIcons ? 'justify-center px-2' : ''}`}
      >
        {/* Icono SVG genérico */}
        <div className={`flex-shrink-0 ${onlyIcons ? '' : 'mr-3'}`}>
          <svg
            className='w-5 h-5 text-gray-600 transition-all duration-200 group-hover:text-[#6dc662] dark:text-gray-300 dark:group-hover:text-[#6dc662] group-hover:scale-110'
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
          >
            <path d={pathData} />
          </svg>
        </div>

        {/* Texto solo si no es onlyIcons */}
        {!onlyIcons && (
          <span className='flex-1 text-left truncate transition-all duration-200'>
            {buttonText}
          </span>
        )}

        {/* Flecha indicadora */}
        {!onlyIcons && (
          <svg
            className={`w-4 h-4 ml-auto transform transition-all duration-200 ${
              isDropdownOpen || Boolean(anchorEl) || isCurrentPageInDropdown ? 'rotate-180 text-[#6dc662] dark:text-[#6dc662]' : 'text-gray-400'
            }`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        )}
      </button>
      {/* Menú flotante con MUI cuando onlyIcons es true */}
      {onlyIcons ? (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ style: { minWidth: 180 } }}
        >
          {menuItems
            .filter((item) => item.roles.some((role) => rol.includes(role)))
            .map((item) => (
              <MenuItem
                key={item.label}
                selected={currentPath === `/${item.url}`}
                onClick={() => handleItemClick(`/${item.url}`)}
                component={Link}
                to={item.url}
              >
                {item.label}
              </MenuItem>
            ))}
        </Menu>
      ) : (
        <ul className={`${isDropdownOpen || isCurrentPageInDropdown ? 'block' : 'hidden'} mt-1 space-y-1 transition-all duration-200`}>
          {menuItems
            .filter((item) => item.roles.some((role) => rol.includes(role))) // Filtrar elementos basados en los roles permitidos
            .map((item) => (
              <li key={item.label} className='relative'>
                <Link
                  to={item.url}
                  className={`flex items-center py-2.5 px-3 ml-4 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    currentPath === `/${item.url}`
                      ? 'bg-[#6dc662]/10 text-[#6dc662] border-l-4 border-[#6dc662] shadow-sm dark:bg-[#6dc662]/20 dark:text-[#6dc662] dark:border-[#6dc662]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
                  }`}
                  onClick={() => handleItemClick(item.url)}
                  title={item.label} // Tooltip para textos largos
                >
                  <div className='w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex-shrink-0 group-hover:bg-[#6dc662] transition-colors duration-200'></div>
                  <span className='flex-1 leading-relaxed whitespace-normal break-words'>{item.label}</span>
                  {currentPath === `/${item.url}` && (
                    <div className='ml-2 w-1.5 h-1.5 bg-[#6dc662] rounded-full animate-pulse flex-shrink-0'></div>
                  )}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export default DropdownButton
