import { useStore } from "@nanostores/react";
// import { useState } from "react";
// import { BiSolidFactory } from "react-icons/bi";
import { FaHospitalUser } from "react-icons/fa";

import { Link } from "react-router-dom";
import { userStore } from "../store/userStore";
import DropdownButton from "./DropdownButton";

const SideBar: React.FC = () => {
  const $userStore = useStore(userStore);

  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // const toggleDropdown = () => {
  //   setIsDropdownOpen(!isDropdownOpen);
  // };

  return (
    <aside
      id="sidebar"
      className="fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 hidden w-64 h-full pt-16 font-normal duration-75 lg:flex transition-width"
      aria-label="Sidebar"
    >
      <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="flex-1 px-3 space-y-1 bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            <ul className="pb-2 space-y-2">
              <li>
                <a
                  href="/dashboard"
                  className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                  </svg>
                  <span className="ml-3" sidebar-toggle-item="">
                    Dashboard
                  </span>
                </a>
              </li>
              <li>
                {$userStore.rol === "admin" && (
                  <>
                    <Link
                      to="customers"
                      className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <FaHospitalUser className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
                      <span className="ml-3" sidebar-toggle-item="">
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
                {$userStore.rol === "admin" && (
                  <DropdownButton
                    buttonText="Cotizaciones"
                    rol={$userStore.rol}
                    menuItems={[
                      {
                        label: "Listar Cotizaciones",
                        url: "cotizaciones",
                        roles: ["admin"],
                      },
                      {
                        label: "Listar Productos y Servicios",
                        url: "productos-y-servicios",
                        roles: ["admin"],
                      },

                      // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                    ]}
                    pathData="M18 1H6a3 3 0 0 0-3 3v18a1 1 0 0 0 1.707.707l2.138-2.137 1.323 1.984A1 1 0 0 0 8.9 23a.986.986 0 0 0 .806-.288L12 20.414l2.293 2.293a1 1 0 0 0 1.539-.153l1.323-1.984 2.138 2.137A1 1 0 0 0 21 22V4a3 3 0 0 0-3-3Zm1 18.586-1.293-1.293a.984.984 0 0 0-.806-.288 1 1 0 0 0-.733.44l-1.323 1.985-2.138-2.137a1 1 0 0 0-1.414 0L9.155 20.43l-1.323-1.985a1 1 0 0 0-1.539-.152L5 19.586V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1ZM13 11a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm4-4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0-9a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Z"
                  />
                )}
              </li>

              <li>
                <DropdownButton
                  buttonText="Calibraciones"
                  rol={$userStore.rol}
                  menuItems={[
                    {
                      label: "Equipos",
                      url: "calibraciones/equipos",
                      roles: ["admin"],
                    },
                    {
                      label: "Tipos de Certificado",
                      url: "calibraciones/tipos-de-certificado",
                      roles: ["admin"],
                    },
                    {
                      label: "Certificados",
                      url: "calibraciones/certificados",
                      roles: ["admin", "user"],
                    },
                    // { label: "Sidebar", url: "https://flowbite-admin-dashboard.vercel.app/layouts/sidebar/" },
                  ]}
                  pathData="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                />
              </li>
              {/* 
              <li>
                <a
                  href="https://flowbite-admin-dashboard.vercel.app/settings/"
                  className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700 "
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
                </a>
              </li> */}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
