import SignalLoader from 'src/Components/Common/SignalLoader'
import React from 'react'

interface LoaderProps {
  loading: boolean
}

const Loader: React.FC<LoaderProps> = ({ loading }) => {
  return loading ? (
    <div className='fixed top-0 left-0 w-full h-full bg-white bg-opacity-70 flex justify-center items-center z-50'>
      <SignalLoader size='large' />
    </div>
  ) : null
}

export default Loader
