import { useStore } from '@nanostores/react'
// import { useState } from "react";
// import { BiSolidFactory } from "react-icons/bi";
import { FaHospitalUser, FaUser } from 'react-icons/fa'
import { MdMicrowave } from 'react-icons/md'
import { BiSolidReport } from 'react-icons/bi'

import { Link, useLocation } from 'react-router-dom'
import { userStore } from '../store/userStore'
import DropdownButton from './DropdownButton'
import { CarRepair } from '@mui/icons-material'

// ...

const SideBar: React.FC = () => {
  const $userStore = useStore(userStore)

  let { pathname } = useLocation()

  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // const toggleDropdown = () => {
  //   setIsDropdownOpen(!isDropdownOpen);
  // };

  return (
    <aside
      id='sidebar'
      className='fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 hidden w-64 h-full pt-16 font-normal duration-75 lg:flex transition-width'
      aria-label='Sidebar'
    >
      <div className='relative flex flex-col flex-1 min-h-0 pt-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700'>
        <div className='flex flex-col flex-1 pt-5 pb-4 overflow-y-auto'>
          <div className='flex-1 px-3 space-y-1 bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700'>
            <ul className='pb-2 space-y-2'>
              <li className={pathname === '/' ? 'bg-green-100' : ''}>
                <Link
                  to='/'
                  className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  <svg
                    className='w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path d='M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z'></path>
                    <path d='M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z'></path>
                  </svg>
                  <span className='ml-3' sidebar-toggle-item=''>
                    Dashboard
                  </span>
                </Link>
              </li>
              <li className={pathname === '/customers' ? 'bg-green-100' : ''}>
                {$userStore.rol === 'admin' && (
                  <>
                    <Link
                      to='customers'
                      className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                    >
                      <FaHospitalUser className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                      <span className='ml-3' sidebar-toggle-item=''>
                        Empresas
                      </span>
                    </Link>
                    {/* <Link to="users" className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700">
                        <FaUser className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                        <span className="ml-3" sidebar-toggle-item="">Usuarios</span>
                      </Link> */}
                  </>
                )}
              </li>

              <li>
                {$userStore.rol === 'admin' && (
                  <DropdownButton
                    buttonText='Cotizaciones'
                    rol={$userStore.rol}
                    currentPath={pathname}
                    menuItems={[
                      {
                        label: 'Listar Cotizaciones',
                        url: 'cotizaciones',
                        roles: ['admin']
                      },
                      {
                        label: 'Listar Productos y Servicios',
                        url: 'productos-y-servicios',
                        roles: ['admin']
                      }

                      // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                    ]}
                    pathData='M18 1H6a3 3 0 0 0-3 3v18a1 1 0 0 0 1.707.707l2.138-2.137 1.323 1.984A1 1 0 0 0 8.9 23a.986.986 0 0 0 .806-.288L12 20.414l2.293 2.293a1 1 0 0 0 1.539-.153l1.323-1.984 2.138 2.137A1 1 0 0 0 21 22V4a3 3 0 0 0-3-3Zm1 18.586-1.293-1.293a.984.984 0 0 0-.806-.288 1 1 0 0 0-.733.44l-1.323 1.985-2.138-2.137a1 1 0 0 0-1.414 0L9.155 20.43l-1.323-1.985a1 1 0 0 0-1.539-.152L5 19.586V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1ZM13 11a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm4-4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0-9a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Z'
                  />
                )}
              </li>
              <li>
                {$userStore.rol === 'user' && (
                  <Link
                    to={`customers/${$userStore.customer.id}`}
                    className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    <MdMicrowave className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                    <span className='ml-3' sidebar-toggle-item=''>
                      Equipos
                    </span>
                  </Link>
                )}
              </li>
              <li>
                <Link
                  to='profiles'
                  className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  <FaUser className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                  <span className='ml-3' sidebar-toggle-item=''>
                    Biomedicos
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to='trazabilidad'
                  className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  <BiSolidReport className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                  <span className='ml-3' sidebar-toggle-item=''>
                    Trazabilidades
                  </span>
                </Link>
              </li>
              {/* {$userStore.rol === 'admin' && (
                <li>
                  <Link
                    to='datasheets'
                    className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    <Assignment className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                    <span className='ml-3' sidebar-toggle-item=''>
                      Hojas de Vida
                    </span>
                    <Science className='w-5 h-5 ml-4 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                  </Link>
                </li>
              )} */}

              {$userStore.rol === 'admin' && (
                <li>
                  <DropdownButton
                    buttonText='Hojas de Vida'
                    rol={$userStore.rol}
                    currentPath={pathname}
                    menuItems={[
                      {
                        label: 'Inventario',
                        url: 'datasheets',
                        roles: ['admin']
                      },
                      {
                        label: 'Alertas',
                        url: 'datasheets/alerts',
                        roles: ['admin']
                      }

                      // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                    ]}
                    pathData='M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H8v-2h6v2zm3-4H8v-2h8v2zm0-4H8V7h8v2z'
                  />
                </li>
              )}

              <li>
                <DropdownButton
                  buttonText='Calibraciones'
                  rol={$userStore.rol}
                  currentPath={pathname}
                  menuItems={[
                    {
                      label: 'Equipos',
                      url: 'calibraciones/equipos',
                      roles: ['admin']
                    },
                    {
                      label: 'Tipos de Certificado',
                      url: 'calibraciones/tipos-de-certificado',
                      roles: ['admin']
                    },
                    {
                      label: 'Certificados',
                      url: 'calibraciones/certificados',
                      roles: ['admin', 'user']
                    },
                    {
                      label: 'Subir Excel',
                      url: 'calibraciones/subir-excel',
                      roles: ['admin']
                    },
                    {
                      label: 'Plantillas',
                      url: 'calibraciones/templates',
                      roles: ['admin']
                    }

                    // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                  ]}
                  pathData='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'
                />
              </li>

              <li>
                {$userStore.rol === 'admin' && (
                  <Link
                    to='fleet'
                    className='flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700'
                  >
                    <CarRepair className='w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white' />
                    <span className='ml-3' sidebar-toggle-item=''>
                      Flota
                    </span>
                  </Link>
                )}
              </li>

              {/* <li>
                <DropdownButton
                  buttonText="Perfiles"
                  rol={$userStore.rol}
                  menuItems={[
                    {
                      label: "Crear Perfil",
                      url: "profiles/new",
                      roles: ["admin"],
                    },
                    {
                      label: "Perfiles",
                      url: "profiles",
                      roles: ["admin"],
                    },

                    // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                  ]}
                  pathData="M10 12c3.785 0 6.958 2.214 7.784 6H2.216c.826-3.786 3.999-6 7.784-6M6 6c0-2.206 1.794-4 4-4s4 1.794 4 4-1.794 4-4 4-4-1.794-4-4m7.758 4.673A5.983 5.983 0 0 0 16 6a6 6 0 1 0-9.758 4.673C2.583 12.048 0 15.445 0 20h20c0-4.555-2.583-7.952-6.242-9.327"
                />
              </li> */}
              {/* <li>
                <Link
                  to="trazabilidad"
                  className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        fillRule="evenodd"
                        d="M11,16 L4,16 C2.92670537,16 2,15.2056811 2,14.1428571 L2,9.85714286 C2,8.79431889 2.92670537,8 4,8 L11,8 L11,2 L13,2 L13,8 L20,8 C21.0732946,8 22,8.79431889 22,9.85714286 L22,14.1428571 C22,15.2056811 21.0732946,16 20,16 L13,16 L13,22 L11,22 L11,16 Z M4,10 L4,14 L20,14 L20,10 L4,10 Z"
                      ></path>{" "}
                    </g>
                  </svg>
                  <span className="ml-3" sidebar-toggle-item="">
                    Trazabilidad
                  </span>
                </Link>
              </li> */}
              <li>
                {/* <Link
                  to="repositorio"
                  className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.5 8H4m0-2v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-5.032a1 1 0 0 1-.768-.36l-1.9-2.28a1 1 0 0 0-.768-.36H5a1 1 0 0 0-1 1Z"
                    />
                  </svg>

                  <span className="ml-3" sidebar-toggle-item="">
                    Repositorio
                  </span>
                </Link> */}
              </li>
              {/* <li>
                <Link
                  to="settings"
                  className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span className="ml-3" sidebar-toggle-item="">
                    Settings
                  </span>
                </Link>
              </li> */}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default SideBar
