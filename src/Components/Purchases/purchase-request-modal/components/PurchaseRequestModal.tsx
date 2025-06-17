// components/PurchaseRequestModal.tsx
import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
  Box,
  MenuItem
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { PurchaseRequestModalProps } from '../types/PurchaseRequestTypes'
import { usePurchaseRequestForm } from '../hooks/usePurchaseRequestForm'
import RequesterSection from './RequesterSection'
import ItemsSection from './ItemsSection'
import RequirementsSection from './RequirementsSection'

const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({
  open,
  onClose,
  onSuccess,
  existingRequest
}) => {
  const {
    formData,
    setFormData,
    currentItem,
    setCurrentItem,
    selectedRequester,
    setSelectedRequester,
    requesterOptions,
    loadingRequesters,
    newRequirement,
    setNewRequirement,
    error,
    requirementType,
    setRequirementType,
    editingRequirementIndex,
    setEditingRequirementIndex,
    editingRequirementValue,
    setEditingRequirementValue,
    handleSubmit,
    resetForm
  } = usePurchaseRequestForm(open, existingRequest, onSuccess)

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const onSubmit = async () => {
    const success = await handleSubmit()
    if (success) {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {existingRequest
          ? 'Editar Solicitud de Compra'
          : 'Nueva Solicitud de Compra'}
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ pt: 2 }}>
          {/* Basic Information Section */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Fecha de Elaboración *'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  value={
                    formData.elaborationDate
                      ? new Date(formData.elaborationDate)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={(e) => {
                    const dateValue = new Date(e.target.value)
                    if (!isNaN(dateValue.getTime())) {
                      setFormData({
                        ...formData,
                        elaborationDate: dateValue
                      })
                    }
                  }}
                  inputProps={{
                    max: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0]
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label='Tipo de Compra'
                  value={formData.purchaseType || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseType: e.target.value })
                  }
                  name='purchaseType'
                  required
                >
                  <MenuItem value='I'>Tipo I</MenuItem>
                  <MenuItem value='II'>Tipo II</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Requester Section */}
          <RequesterSection
            selectedRequester={selectedRequester}
            setSelectedRequester={setSelectedRequester}
            requesterOptions={requesterOptions}
            loadingRequesters={loadingRequesters}
            formData={formData}
            setFormData={setFormData}
            existingRequest={existingRequest}
          />

          {/* Items Section */}
          <Grid item xs={12}>
            <ItemsSection
              formData={formData}
              setFormData={setFormData}
              currentItem={currentItem}
              setCurrentItem={setCurrentItem}
            />
          </Grid>

          {/* Requirements Section */}
          <Grid item xs={12}>
            <RequirementsSection
              formData={formData}
              setFormData={setFormData}
              requirementType={requirementType}
              setRequirementType={setRequirementType}
              newRequirement={newRequirement}
              setNewRequirement={setNewRequirement}
              editingRequirementIndex={editingRequirementIndex}
              setEditingRequirementIndex={setEditingRequirementIndex}
              editingRequirementValue={editingRequirementValue}
              setEditingRequirementValue={setEditingRequirementValue}
            />
          </Grid>

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Box color='error.main'>{error}</Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant='outlined' onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={onSubmit}
          sx={{
            backgroundColor: '#9CF08B',
            color: '#2D4A27',
            '&:hover': { backgroundColor: '#6DC662' }
          }}
        >
          {existingRequest ? 'Guardar Cambios' : 'Crear Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
