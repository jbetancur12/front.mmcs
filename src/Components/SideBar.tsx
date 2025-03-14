import { Link, useLocation } from 'react-router-dom'
import { FaHospitalUser, FaUser } from 'react-icons/fa'
import { MdMicrowave, MdDashboard, MdOutlineSettings } from 'react-icons/md'
import { BiSolidReport } from 'react-icons/bi'

import DropdownButton from './DropdownButton' // Importa el componente del dropdown si ya lo tienes
import { useStore } from '@nanostores/react'
import { UserData, userStore } from 'src/store/userStore'
import { CarRepair } from '@mui/icons-material'

const iconClass =
  'w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'

// Helper para verificar si un módulo debe ser visible
const canViewModule = (roles: string[], userRole: string[]) => {
  return userRole.some((role) => roles.includes(role))
}

const getLinkToCustomer = (to: string, $userStore: UserData) => {
  if (!$userStore.customer) {
    return '/' // Ruta predeterminada para usuarios sin cliente
  } else {
    return `${to}${$userStore.customer.id}`
  }
}

// Array combinado de items del sidebar (incluyendo dropdowns)
const sidebarItems = ($userStore: UserData) => [
  {
    type: 'link', // Tipo de ítem (enlace simple)
    label: 'Dashboard',
    to: '/',
    icon: <MdDashboard className={iconClass} />,
    roles: ['admin', 'user'],
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Equipos',
    to: getLinkToCustomer(`customers/`, $userStore),
    icon: <MdMicrowave className={iconClass} />,
    roles: ['user'],
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Empresas',
    to: '/customers',
    icon: <FaHospitalUser className={iconClass} />,
    roles: ['admin', 'metrologist'],
    moduleName: 'Basic'
  },

  {
    type: 'dropdown',
    buttonText: 'Cotizaciones',
    roles: ['admin'],
    moduleName: 'Basic',
    pathData:
      'M18 1H6a3 3 0 0 0-3 3v18a1 1 0 0 0 1.707.707l2.138-2.137 1.323 1.984A1 1 0 0 0 8.9 23a.986.986 0 0 0 .806-.288L12 20.414l2.293 2.293a1 1 0 0 0 1.539-.153l1.323-1.984 2.138 2.137A1 1 0 0 0 21 22V4a3 3 0 0 0-3-3Zm1 18.586-1.293-1.293a.984.984 0 0 0-.806-.288 1 1 0 0 0-.733.44l-1.323 1.985-2.138-2.137a1 1 0 0 0-1.414 0L9.155 20.43l-1.323-1.985a1 1 0 0 0-1.539-.152L5 19.586V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1ZM13 11a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm4-4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0-9a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Z',
    menuItems: [
      { label: 'Listar Cotizaciones', url: 'cotizaciones', roles: ['admin'] },
      {
        label: 'Listar Productos y Servicios',
        url: 'productos-y-servicios',
        roles: ['admin']
      }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Compras',
    roles: ['admin', 'comp_requester', 'comp_supervisor'],
    moduleName: 'Basic',
    pathData:
      'M3 3h2l1 5h13l1-5h2v2h-2l-1 5h-14l-1-5h-2zm4 8h10l1.5 7h-13zm1.5 9a1.5 1.5 0 1 1 3 0 1.5 1.5 0 1 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 1 1-3 0z',
    menuItems: [
      {
        label: 'Selección de Proveedores',
        url: 'purchases/supplier-selection',
        roles: ['admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Lista de Proveedores',
        url: 'purchases/suppliers',
        roles: ['admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Solicitudes de Compra',
        url: 'purchases/requests',
        roles: ['admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Ordenes de Compra',
        url: 'purchases/orders',
        roles: ['admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Verificaciones',
        url: 'purchases/verifications',
        roles: ['admin', 'comp_requester', 'comp_supervisor']
      }
    ]
  },

  {
    type: 'link',
    label: 'Biomedicos',
    to: '/profiles',
    icon: <FaUser className={iconClass} />,
    roles: ['admin', 'user'],
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Trazabilidades',
    to: '/trazabilidad',
    icon: <BiSolidReport className={iconClass} />,
    roles: ['admin', 'user'],
    moduleName: 'Basic'
  },

  {
    type: 'dropdown',
    buttonText: 'Inventario',
    roles: ['admin'],
    moduleName: 'Basic',
    pathData:
      'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H8v-2h6v2zm3-4H8v-2h8v2zm0-4H8V7h8v2z',
    menuItems: [
      { label: 'Hoja de Vida', url: 'datasheets', roles: ['admin'] },
      { label: 'Alertas', url: 'datasheets/alerts', roles: ['admin'] }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Iot',
    roles: ['admin'],
    moduleName: 'Basic',
    pathData:
      'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H8v-2h6v2zm3-4H8v-2h8v2zm0-4H8V7h8v2z',
    menuItems: [
      { label: 'Lista', url: 'iot', roles: ['admin'] },
      { label: 'Map', url: 'iot/map', roles: ['admin'] }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Calibraciones',
    roles: ['admin', 'metrologist'],
    moduleName: 'Basic',
    pathData:
      'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
    menuItems: [
      {
        label: 'Equipos',
        url: 'calibraciones/equipos',
        roles: ['admin', 'metrologist']
      },
      {
        label: 'Tipos de Certificado',
        url: 'calibraciones/tipos-de-certificado',
        roles: ['admin']
      },
      {
        label: 'Certificados',
        url: 'calibraciones/certificados',
        roles: ['admin', 'user', 'metrologist']
      },
      {
        label: 'Subir Excel',
        url: 'calibraciones/subir-excel',
        roles: ['admin', 'metrologist']
      },
      {
        label: 'Plantillas',
        url: 'calibraciones/templates',
        roles: ['admin', 'metrologist']
      }
    ]
  },
  {
    type: 'link',
    label: 'Flota',
    to: '/fleet',
    icon: <CarRepair className={iconClass} />,
    roles: ['admin', 'fleet'],
    moduleName: 'Fleet'
  },
  {
    type: 'link',
    label: 'Ajustes',
    to: '/settings',
    icon: <MdOutlineSettings className={iconClass} />,
    roles: ['admin'],
    moduleName: 'Basic'
  }
  // Otros ítems...
]

const SideBar = () => {
  const $userStore = useStore(userStore)

  const { pathname } = useLocation()

  const hasModuleAccess = (moduleName: string) => {
    if (!$userStore.customer) return true
    return $userStore.customer.modules.some(
      (m) => m.name === moduleName && m.customerModules.isActive
    )
  }

  return (
    <aside className='fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 hidden w-64 h-full pt-16 font-normal duration-75 lg:flex transition-width'>
      <div className='relative flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 pt-5 overflow-y-auto'>
        <div className='flex-1 px-3 space-y-1 bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700'>
          <ul className='space-y-2'>
            {/* Mapear los ítems combinados del sidebar */}
            {sidebarItems($userStore).map((item, index) => {
              if (
                item.type === 'link' &&
                item.to &&
                canViewModule(item.roles, $userStore.rol) &&
                hasModuleAccess(item.moduleName)
              ) {
                return (
                  <li
                    key={index}
                    className={pathname === item.to ? 'bg-green-100' : ''}
                  >
                    <Link
                      to={item.to}
                      className='flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      {item.icon}
                      <span className='ml-3'>{item.label}</span>
                    </Link>
                  </li>
                )
              } else if (
                item.type === 'dropdown' &&
                canViewModule(item.roles, $userStore.rol)
              ) {
                return (
                  <DropdownButton
                    key={index}
                    buttonText={item.buttonText ?? ''}
                    menuItems={item.menuItems ?? []}
                    pathData={item.pathData ?? ''}
                    rol={$userStore.rol}
                    currentPath={pathname}
                  />
                )
              }
              return null
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}

export default SideBar
