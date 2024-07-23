import { Certificate, CertificateListItem } from './CertificateListItem'

interface SelectedHqProps {
  certificates: Record<string, Certificate>
  onDelete: (id: number) => void
}

const SelectedHq: React.FC<SelectedHqProps> = ({ certificates, onDelete }) => {
  return (
    <div>
      <ul>
        {Object.values(certificates).map((certificate: Certificate) => (
          <CertificateListItem
            key={certificate.id}
            certificate={certificate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}

export default SelectedHq
