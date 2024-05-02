import React from 'react'
import Table from '../Components/TableFiles'
import { Typography } from '@mui/material'

const Files: React.FC = () => {
  return (
    <>
      <div className='flex flex-col '>
        <div className='overflow-x-auto'>
          <div className='inline-block min-w-full align-middle'>
            <div className='overflow-hidden shadow'>
              <div className='flex justify-center w-screen'>
                <Typography variant='h6' gutterBottom>
                  Cronograma de Calibraciones
                </Typography>
              </div>
              <Table />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Files
