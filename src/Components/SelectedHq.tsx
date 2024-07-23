import { Certificate, CertificateListItem } from './CertificateListItem'

interface SelectedHqProps {
  certificates: Record<string, Certificate>
  onDelete: (id: number) => void
  sedes: string[]
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  certificates,
  onDelete,
  sedes
}) => {
  return (
    <div>
      <ul>
        {Object.values(certificates).map((certificate: Certificate) => (
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
