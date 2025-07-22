import { Link, useLocation } from 'react-router-dom'
import { FaHospitalUser, FaUser } from 'react-icons/fa'
import { MdMicrowave, MdDashboard, MdOutlineSettings } from 'react-icons/md'
import { BiSolidReport } from 'react-icons/bi'

import DropdownButton from './DropdownButton' // Importa el componente del dropdown si ya lo tienes
import { useStore } from '@nanostores/react'
import { UserData, userStore } from 'src/store/userStore'
import { CarRepair } from '@mui/icons-material'
import { Divider } from '@mui/material'

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
    roles: [
      'admin',
      'comp_admin',
      'comp_requester',
      'comp_supervisor',
      'comp_analyst',
      'comp_orderer',
      'comp_approver',
      'comp_verifier'
    ],
    moduleName: 'Basic',
    pathData:
      'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-2h7.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.26-.25z',
    menuItems: [
      {
        label: 'Selección de Proveedores',
        url: 'purchases/supplier-selection',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Lista de Proveedores',
        url: 'purchases/suppliers',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Solicitudes de Compra',
        url: 'purchases/requests',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Ordenes de Compra',
        url: 'purchases/orders',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Verificaciones',
        url: 'purchases/verifications',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Parametros Fiscales',
        url: 'purchases/fiscal-parameters',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
      },
      {
        label: 'Evaluaciones de Proveedores',
        url: 'purchases/suppliers/evaluations',
        roles: ['admin', 'comp_admin', 'comp_requester', 'comp_supervisor']
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
  // {
  //   type: 'dropdown',
  //   buttonText: 'Calidad',
  //   roles: ['admin'],
  //   moduleName: 'Basic',
  //   pathData:
  //     'M12 2l2.9 6.9 7.1.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.6z',
  //   menuItems: [
  //     {
  //       label: 'Trabajo no Conforme',
  //       url: '/non-conform-work-reports',
  //       roles: ['admin']
  //     }
  //   ]
  // },

  {
    type: 'dropdown',
    buttonText: 'Inventario',
    roles: ['admin', 'metrologist'],
    moduleName: 'Basic',
    pathData:
      'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H8v-2h6v2zm3-4H8v-2h8v2zm0-4H8V7h8v2z',
    menuItems: [
      {
        label: 'Hoja de Vida',
        url: 'datasheets',
        roles: ['admin', 'metrologist']
      },
      { label: 'Alertas', url: 'datasheets/alerts', roles: ['admin'] }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Laboratorio', // Texto del botón principal
    roles: ['admin'], // Roles que pueden ver este menú
    moduleName: 'Basic', // Nombre interno del módulo (opcional, ajusta según tu sistema)
    // Path SVG para un icono de matraz/laboratorio (puedes reemplazarlo)

    pathData:
      'M19 19V8.83l-6-6-6 6V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zm-7-7h2v5h-2z',
    menuItems: [
      { label: 'Condiciones', url: 'laboratory/conditions', roles: ['admin'] }, // Sub-item Condiciones
      { label: 'Patrones', url: 'laboratory/patterns', roles: ['admin'] } // Sub-item Patrones
    ]
  },
  // {
  //   type: 'dropdown',
  //   buttonText: 'Telemetría',
  //   roles: ['admin', 'user'],
  //   moduleName: 'Iot',
  //   pathData:
  //     'M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7 0-1.66.56-3.19 1.5-4.39l9.89 9.89C15.19 18.44 13.66 19 12 19zm4.5-2.61L6.61 7.5C7.81 6.56 9.34 6 11 6c3.87 0 7 3.13 7 7 0 1.66-.56 3.19-1.5 4.39z',
  //   menuItems: [
  //     { label: 'Lista', url: 'iot', roles: ['admin'] },
  //     { label: 'Map', url: 'iot/map', roles: ['admin', 'user'] },
  //     {
  //       label: 'Gestión de Clientes',
  //       url: 'iot/customers-management',
  //       roles: ['admin']
  //     }
  //   ]
  // },
  {
    type: 'dropdown',
    buttonText: 'Calibraciones',
    roles: ['admin', 'metrologist'],
    moduleName: 'Basic',
    pathData:
      'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 13.17l6.59-6.59L20 8l-8 8z',
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

interface SideBarProps {
  sidebarMinimized: boolean
  userMinimized: boolean
  setUserMinimized: (min: boolean) => void
  setHovered: (hover: boolean) => void
  hoverEnabled: boolean
  setHoverEnabled: (enabled: boolean) => void
}

const SideBar = ({
  sidebarMinimized,
  userMinimized,
  setUserMinimized
}: SideBarProps) => {
  const $userStore = useStore(userStore)
  const { pathname } = useLocation()

  const hasModuleAccess = (moduleName: string) => {
    if (!$userStore.customer) return true
    return $userStore.customer.modules.some(
      (m) => m.name === moduleName && m.customerModules.isActive
    )
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 hidden h-full pt-16 font-normal bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 lg:flex ${userMinimized ? 'w-20' : 'w-64'}`}
    >
      {/* Botón hamburguesa como último ítem del sidebar */}
      <ul className='space-y-2'>
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
                  className={`flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${sidebarMinimized ? 'justify-center' : ''}`}
                >
                  {item.icon}
                  {!sidebarMinimized && (
                    <span className='ml-3'>{item.label}</span>
                  )}
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
                onlyIcons={sidebarMinimized}
              />
            )
          }
          return null
        })}
        <Divider />
        <li
          className={
            !userMinimized
              ? 'flex items-center mt-8'
              : 'flex items-center mt-8 justify-center'
          }
        >
          <button
            className='ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            onClick={() => setUserMinimized(!userMinimized)}
            aria-label={userMinimized ? 'Expandir menú' : 'Minimizar menú'}
            type='button'
            style={{
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              padding: 0
            }}
          >
            {userMinimized ? (
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24'>
                <path
                  d='M10 6l6 6-6 6'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            ) : (
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24'>
                <path
                  d='M14 6l-6 6 6 6'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            )}
          </button>
        </li>
      </ul>
      <div className='relative flex flex-col flex-1 min-h-0 pt-5 overflow-y-auto'>
        <div className='flex-1 px-3 space-y-1 divide-y divide-gray-200 dark:divide-gray-700'>
          {/* Header del sidebar: logo + botón hamburguesa */}
          {/* This block is removed as per the edit hint */}
        </div>
      </div>
    </aside>
  )
}

export default SideBar
