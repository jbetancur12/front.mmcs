import React, { useState } from 'react'
import { Link } from 'react-router-dom'

interface DropdownButtonProps {
  buttonText: string
  menuItems: { label: string; url: string; roles: string[] }[]
  pathData: string
  rol: string
  currentPath: string
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  buttonText,
  menuItems,
  pathData,
  rol,
  currentPath
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div>
      <button
        type='button'
        onClick={toggleDropdown}
        aria-expanded={isDropdownOpen}
        className='flex items-center w-full p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'
      >
        {/* Icono SVG genérico */}
        <svg
          className='w-6 h-6 text-gray-500 dark:text-gray-400 flex-shrink-0'
          viewBox='0 0 24 24'
          fill='currentColor'
          aria-hidden='true'
        >
          <path d={pathData} />
        </svg>

        <span className='ml-3 text-left flex-1 whitespace-nowrap'>
          {buttonText}
        </span>

        {/* Flecha indicadora */}
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
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
      </button>
      <ul className={`${isDropdownOpen ? 'block' : 'hidden'} py-2 space-y-2`}>
        {menuItems
          .filter((item) => item.roles.includes(rol)) // Filtrar elementos basados en los roles permitidos
          .map((item) => (
            <li
              key={item.label}
              className={currentPath === `/${item.url}` ? 'bg-green-100' : ''}
            >
              <Link
                to={item.url}
                className='flex items-center p-2 text-base text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              >
                {item.label}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  )
}

export default DropdownButton
