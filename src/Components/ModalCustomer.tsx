import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Modal, Box, TextField, Button, Typography } from '@mui/material'
import axios from 'axios'
import { apiUrl, bigToast } from './ExcelManipulation/Utils'

interface ModalCustomerProps {
  open: boolean
  onClose: Dispatch<SetStateAction<boolean>>
  name: string
  dataReturned: (data: any) => void
}

const formFields = [
  'nombre',
  'email',
  'identificacion',
  'direccion',
  'telefono',
  'ciudad',
  'departamento',
  'pais'
]

const ModalCustomer: React.FC<ModalCustomerProps> = ({
  open,
  onClose,
  name,
  dataReturned
}) => {
  const [formValues, setFormValues] = useState<
    Record<string, string | boolean>
  >(formFields.reduce((obj, field) => ({ ...obj, [field]: '' }), {}))
  const [errors, setErrors] = useState<any>(
    formFields.reduce((obj, field) => ({ ...obj, [field]: false }), {})
  )

  const handleClose = () => onClose(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues,
      [event.target.name]: event.target.value
    })
    setErrors({
      ...errors,
      [event.target.name]: event.target.value === ''
    })
  }

  useEffect(() => {
    setFormValues({
      ...formValues,
      nombre: name
    })
  }, [name])

  const handleSubmit = async () => {
    const newErrors = formFields.reduce(
      (obj: Record<string, boolean>, field) => ({
        ...obj,
        [field]: formValues[field] === ''
      }),
      {}
    )
    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      return
    }

    try {
      const response = await axios.post(`${apiUrl}/customers`, formValues, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status === 201) {
        bigToast('Cliente Creado Exitosamente!', 'success')
        dataReturned(response.data)
        onClose(false)
      } else {
        console.error('Error al crear cliente')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const body = (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4
      }}
    >
      <Typography variant='h5' component='div'>
        Crear Cliente
      </Typography>
      {formFields.map((field) => (
        <TextField
          key={field}
          name={field}
          label={field.charAt(0).toUpperCase() + field.slice(1)}
          value={formValues[field]}
          onChange={handleChange}
          fullWidth
          margin='normal'
          error={errors[field]}
        />
      ))}
      <Button onClick={handleClose}>Close</Button>
      <Button onClick={handleSubmit}>Crear</Button>
    </Box>
  )

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        {body}
      </Modal>
    </div>
  )
}

export default ModalCustomer
