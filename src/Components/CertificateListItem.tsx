import { Link } from 'react-router-dom'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'

export interface Certificate {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  certificateTypeId: number
  createdAt: string
  updatedAt: string
  device: {
    id: number
    name: string
    createdAt: string
    updatedAt: string
  }
}

interface CertificateListItemProps {
  certificate: Certificate
  onDelete: (id: number) => void
}

export const CertificateListItem: React.FC<CertificateListItemProps> = ({
  certificate,
  onDelete
}) => {
  const $userStore = useStore(userStore)
  return (
    <div className='flex items-center justify-between p-4 border-b border-gray-200'>
      <div>
        <Link to={`/calibraciones/certificados/${certificate.id}`}>
          <h3 className='text-lg font-semibold'>{certificate.device.name}</h3>

          <p className='text-gray-500'>Ciudad: {certificate.city}</p>
          <p className='text-gray-500'>Ubicación: {certificate.location}</p>
          <p className='text-gray-500'>Sede: {certificate.sede}</p>
          <p className='text-gray-500'>Activo Fijo: {certificate.activoFijo}</p>
          <p className='text-gray-500'>Serie: {certificate.serie}</p>
          <p className='text-gray-500'>
            Fecha de Calibración:{' '}
            {new Date(certificate.calibrationDate).toLocaleDateString()}
          </p>
          <p className='text-gray-500'>
            Proxima Fecha de Calibración:{' '}
            {new Date(certificate.nextCalibrationDate).toLocaleDateString()}
          </p>
        </Link>
      </div>
      {$userStore.rol === 'admin' && (
        <div className='flex items-center'>
          <button
            className='px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600'
            onClick={() => onDelete(certificate.id)}
          >
            Eliminar
          </button>
          {/* <button
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600"
          onClick={() => handleDownload(certificate.filePath)}
        >
          Download
        </button> */}
        </div>
      )}
    </div>
  )
}
