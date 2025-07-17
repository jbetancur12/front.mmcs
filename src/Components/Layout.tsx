import React from 'react'
import Header from './Header'
import SideBar from './SideBar'

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Header />
      <div className='flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900'>
        <SideBar />
        <div className='relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900'>
          <main>
            <div className='px-4 py-6 h-full'>{children}</div>
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout
