import React from 'react'
import { Modal, Box, Typography, Button, Paper } from '@mui/material'

type ModalProps = {
  onClose: () => void
  children: React.ReactNode
  open: boolean // Añadir una prop para controlar la visibilidad del modal
}

const ModalHq: React.FC<ModalProps> = ({ onClose, children, open }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby='modal-modal-title'
      aria-describedby='modal-modal-description'
    >
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          outline: 0 // Esto evita el borde azul en algunos navegadores
        }}
      >
        {children}
        <Button
          variant='contained'
          color='secondary'
          onClick={onClose}
          sx={{ mt: 2 }}
        >
          Close
        </Button>
      </Paper>
    </Modal>
  )
}

export default ModalHq
