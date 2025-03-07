import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField
} from '@mui/material'
import { QuoteData, statusOptions, statusTransitions } from '../TableQuotes'
import { useEffect, useState } from 'react'

const StatusUpdateModal: React.FC<{
  open: boolean
  onClose: () => void
  quote: QuoteData | null
  onUpdate: (newStatus: string, comments: string) => void
}> = ({ open, onClose, quote, onUpdate }) => {
  const [newStatus, setNewStatus] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (quote) {
      setNewStatus(quote.status[quote.status.length - 1].status)
      setComments('')
    }
  }, [quote])

  const handleUpdate = () => {
    onUpdate(newStatus, comments)
    onClose()
  }

  if (!quote) return null

  const allowedTransitions =
    statusTransitions[quote.status[quote.status.length - 1].status] || []

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Actualizar Estado</DialogTitle>
      <DialogContent>
        <Select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          displayEmpty
          inputProps={{ 'aria-label': 'Without label' }}
          fullWidth
        >
          {allowedTransitions.map((key) => (
            <MenuItem key={key} value={key}>
              {statusOptions[key]}
            </MenuItem>
          ))}
        </Select>
        <TextField
          label='Observaciones'
          multiline
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleUpdate} variant='contained'>
          Actualizar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StatusUpdateModal
