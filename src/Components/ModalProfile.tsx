import { Dialog } from '@mui/material'
import ProfileCreationForm from './ProfileCreationForm'

interface ModalProfileProps {
  open: boolean
  onClose: () => void
}

const ModalProfile: React.FC<ModalProfileProps> = ({ open, onClose }) => {
  const handleClose = () => {
    console.log('====>')
    onClose()
  }
  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <ProfileCreationForm onSave={handleClose} />
      </Dialog>
    </div>
  )
}

export default ModalProfile
