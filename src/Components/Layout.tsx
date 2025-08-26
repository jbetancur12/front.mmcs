import React, { useState } from 'react'
import Header from './Header'
import SideBar from './SideBar'

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // userMinimized: si el usuario ha minimizado el sidebar
  const [userMinimized, setUserMinimized] = useState(false)
  // hovered: si el mouse está sobre el sidebar
  const [hovered, setHovered] = useState(false)
  // hoverEnabled: si el modo hover está activado
  const [hoverEnabled, setHoverEnabled] = useState(true)
  // mobileMenuOpen: si el menú móvil está abierto
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // El sidebar está minimizado si hoverEnabled está activo y el usuario lo minimizó y no está en hover
  const sidebarMinimized = hoverEnabled ? userMinimized && !hovered : false

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Header toggleMobileMenu={toggleMobileMenu} />
      {/* Overlay para cerrar el menú móvil */}
      {mobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden'
          onClick={toggleMobileMenu}
        />
      )}
      <div className='flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900'>
        <SideBar
          sidebarMinimized={sidebarMinimized}
          userMinimized={userMinimized}
          setUserMinimized={setUserMinimized}
          setHovered={setHovered}
          hoverEnabled={hoverEnabled}
          setHoverEnabled={setHoverEnabled}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <div
          className={`relative w-full h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 ${sidebarMinimized ? 'lg:ml-20' : 'lg:ml-64'}`}
        >
          <main>
            <div className='px-4 py-6 h-full'>{children}</div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout
