import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { InterventionType, MaintenanceRecord, Reminder } from './types'

import { addMonths } from 'date-fns'
import { bigToast } from '../ExcelManipulation/Utils'
import { AxiosError, isAxiosError } from 'axios'
import useAxiosPrivate from '@utils/use-axios-private'

interface AddMaintenanceRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newRecord: MaintenanceRecord) => void
  interventionTypes: InterventionType[]
  vehicleId: number
}

const AddMaintenanceRecordModal: React.FC<AddMaintenanceRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  interventionTypes,
  vehicleId
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({})
  const [reminder, setReminder] = useState<Partial<Reminder>>({})
  const [selectedInterventionType, setSelectedInterventionType] = useState<
    number | ''
  >('')
  const [requiresReminder, setRequiresReminder] = useState(false)

  useEffect(() => {
    const selectedType = interventionTypes.find(
      (type) => type.id === selectedInterventionType
    )
    if (selectedType) {
      setRequiresReminder(selectedType.requiresReminder)
    }
  }, [selectedInterventionType, interventionTypes])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleInputChangeReminder = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setReminder({
      ...reminder,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    const maintenanceData = {
      ...formData,
      interventionTypeId: selectedInterventionType, // Incluir el ID del tipo de intervención
      vehicleId
    }

    const reminderData = {
      nextDueMileage:
        Number(formData.mileage ?? 0) + Number(reminder.mileage ?? 0),
      nextDueDate: addMonths(
        new Date(formData.date as string),
        reminder.months as number
      ),
      vehicleId,
      interventionTypeId: selectedInterventionType
    }

    const newRecord = {
      maintenanceData,
      reminderData
    }

    try {
      const { data } = await axiosPrivate.post(
        `/maintenanceRecord`,
        newRecord,
        {}
      )
      onSave(data) // Actualizar el estado con el nuevo registro
      onClose() // Cerrar el modal
    } catch (error) {
      if (isAxiosError(error)) {
        // Use isAxiosError to check if the error is an Axios error
        const axiosError = error as AxiosError
        if (axiosError.response) {
          bigToast(
            `Error al descargar el archivo: ${axiosError.response.statusText}`,
            'error'
          )
        } else {
          bigToast(
            `Error al descargar el archivo: ${axiosError.message}`,
            'error'
          )
        }
      } else if (error instanceof Error) {
        bigToast(
          `Error desconocido al descargar el archivo: ${error.message}`,
          'error'
        )
      } else {
        bigToast(
          'Ocurrió un error desconocido al descargar el archivo.',
          'error'
        )
      }
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4
        }}
      >
        <Typography variant='h6' gutterBottom>
          Agregar Registro de Mantenimiento
        </Typography>
        <TextField
          fullWidth
          label='Fecha'
          name='date'
          type='date'
          value={formData.date || ''}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
          InputLabelProps={{
            shrink: true
          }}
        />
        <TextField
          fullWidth
          label='Descripción'
          name='description'
          value={formData.description || ''}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label='Costo'
          name='cost'
          type='number'
          value={formData.cost || ''}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label='Servicio de Transporte'
          name='serviceProvider'
          value={formData.serviceProvider || ''}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label='Kilometraje'
          name='mileage'
          type='number'
          value={formData.mileage || ''}
          onChange={handleInputChange}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id='intervention-type-label'>
            Tipo de Intervención
          </InputLabel>
          <Select
            labelId='intervention-type-label'
            value={selectedInterventionType}
            onChange={(e) =>
              setSelectedInterventionType(Number(e.target.value))
            }
          >
            {interventionTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Mostrar campos adicionales si se requiere recordatorio */}
        {requiresReminder && (
          <Box>
            <TextField
              fullWidth
              label='Meses hasta el próximo recordatorio'
              name='months'
              type='number'
              value={reminder.months || ''}
              onChange={handleInputChangeReminder}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Kilómetros hasta el próximo recordatorio'
              name='mileage'
              type='number'
              value={reminder.mileage || ''}
              onChange={handleInputChangeReminder}
              sx={{ mb: 2 }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant='contained' color='primary' onClick={handleSave}>
            Guardar
          </Button>
          <Button variant='outlined' color='secondary' onClick={onClose}>
            Cancelar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default AddMaintenanceRecordModal
