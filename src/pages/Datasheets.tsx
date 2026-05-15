import React from 'react'
import DatasheetForm from '../Components/DataSheet/EquipmentLifeCycleForm'

const Datasheets: React.FC = () => {
  return (
    <>
      <div className='flex flex-col'>
        <div className='overflow-x-auto'>
          <div className='inline-block min-w-full align-middle'>
            <div className='overflow-hidden shadow'>
              <DatasheetForm />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Datasheets
