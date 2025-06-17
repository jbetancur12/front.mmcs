// components/RequirementsSection.tsx
import React from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Grid
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import {
  calibrationServiceRequirements,
  equipmentPurchaseRequirements,
  proficiencyTestingServiceRequirements,
  internalAuditServiceRequirements
} from 'src/utils/requirements'
import { RequirementsSectionProps } from '../types/PurchaseRequestTypes'

const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  formData,
  setFormData,
  requirementType,
  setRequirementType,
  newRequirement,
  setNewRequirement,
  editingRequirementIndex,
  setEditingRequirementIndex,
  editingRequirementValue,
  setEditingRequirementValue
}) => {
  const handleRequirementTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const type = event.target.value
    setRequirementType(type)

    let requirements: string[] = []
    switch (type) {
      case 'calibration':
        requirements = calibrationServiceRequirements
        break
      case 'equipment':
        requirements = equipmentPurchaseRequirements
        break
      case 'proficiency':
        requirements = proficiencyTestingServiceRequirements
        break
      case 'audit':
        requirements = internalAuditServiceRequirements
        break
      default:
        requirements = []
    }

    setFormData((prev) => ({
      ...prev,
      requirements
    }))
  }

  const handleEditRequirement = (index: number) => {
    if (formData.requirements) {
      setEditingRequirementIndex(index)
      setEditingRequirementValue(formData.requirements[index])
    }
  }

  const handleSaveRequirement = () => {
    if (editingRequirementIndex !== null) {
      setFormData((prev) => {
        const updatedRequirements = [...(prev.requirements || [])]
        updatedRequirements[editingRequirementIndex] = editingRequirementValue
        return {
          ...prev,
          requirements: updatedRequirements
        }
      })
      setEditingRequirementIndex(null)
      setEditingRequirementValue('')
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: (prev.requirements || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
      <Grid item xs={12} md={4} sx={{ mb: 2 }}>
        <TextField
          select
          fullWidth
          label='Tipo de Requerimientos'
          value={
            formData.purchaseType === 'II' && requirementType !== 'equipment'
              ? ''
              : requirementType
          }
          onChange={handleRequirementTypeChange}
        >
          <MenuItem value='equipment'>Compra de Equipos</MenuItem>
          {formData.purchaseType === 'I' && [
            <MenuItem key='calibration' value='calibration'>
              Servicios de Calibración
            </MenuItem>,
            <MenuItem key='proficiency' value='proficiency'>
              Ensayos de Aptitud
            </MenuItem>,
            <MenuItem key='audit' value='audit'>
              Auditoría Interna
            </MenuItem>,
            <MenuItem key='others' value='others'>
              Otros
            </MenuItem>
          ]}
        </TextField>
      </Grid>

      <TextField
        fullWidth
        label='Agregar Requisito'
        value={newRequirement}
        onChange={(e) => setNewRequirement(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton onClick={addRequirement}>
                <Add />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {formData.requirements?.map((req, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'columns',
              py: 1,
              width: '100%',
              borderBottom:
                index < (formData.requirements?.length ?? 0) - 1
                  ? '1px solid #eee'
                  : 'none'
            }}
          >
            {editingRequirementIndex === index ? (
              <TextField
                multiline
                fullWidth
                value={editingRequirementValue}
                onChange={(e) => setEditingRequirementValue(e.target.value)}
                onBlur={handleSaveRequirement}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveRequirement()}
                sx={{ flexGrow: 1 }}
              />
            ) : (
              <Typography variant='body2' sx={{ flexGrow: 1 }}>
                • {req}
              </Typography>
            )}

            <IconButton
              size='small'
              onClick={() => handleEditRequirement(index)}
            >
              <Edit fontSize='small' />
            </IconButton>

            <IconButton size='small' onClick={() => removeRequirement(index)}>
              <Delete fontSize='small' color='error' />
            </IconButton>
          </Box>
        ))}

        {formData.requirements?.length === 0 && (
          <Typography variant='body2' sx={{ pt: 1, color: 'text.secondary' }}>
            No se han agregado requisitos
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default RequirementsSection
