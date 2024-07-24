import { useState } from 'react'
import { Certificate, CertificateListItem } from './CertificateListItem'

interface SelectedHqProps {
  certificates: Certificate[]
  onDelete: (id: number) => void
  sedes: string[]
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  certificates,
  onDelete,
  sedes
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredCertificates = certificates.filter((certificate) => {
    const searchFields = [
      certificate.device.name,
      certificate.location,
      certificate.sede,
      certificate.activoFijo,
      certificate.serie
    ]

    return searchFields.some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })
  return (
    <div>
      <input
        type='text'
        placeholder='Buscar Equipo(s)...'
        className='w-[50%] px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mt-4'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredCertificates.map((certificate: Certificate) => (
          <CertificateListItem
            key={certificate.id}
            certificate={certificate}
            onDelete={onDelete}
            sedes={sedes}
          />
        ))}
      </ul>
    </div>
  )
}

export default SelectedHq
