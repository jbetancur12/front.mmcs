import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import SideBar from './SideBar'

const Layout: React.FC = () => {
  return (
    <>
      <Header />
      <div className='flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900'>
        <SideBar />
        <div className='relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900'>
          <main>
            <div className='px-4 pt-6'>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout
