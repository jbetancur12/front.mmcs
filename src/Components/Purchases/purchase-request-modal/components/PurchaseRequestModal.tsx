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
  MenuItem,
  Alert,
  Typography,
  Divider
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { PurchaseRequestModalProps } from '../types/PurchaseRequestTypes'
import { usePurchaseRequestForm } from '../hooks/usePurchaseRequestForm'
import RequesterSection from './RequesterSection'
import ItemsSection from './ItemsSection'
import RequirementsSection from './RequirementsSection'
import {
  PURCHASE_TEAL,
  PURCHASE_TEAL_HOVER
} from '../../purchaseTableStyle'

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
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant='h6' component='span' fontWeight={700}>
            {existingRequest
              ? `Editar solicitud · ${existingRequest.purchaseCode}`
              : 'Nueva solicitud de compra'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {existingRequest
              ? 'Cambia lo que haga falta y guarda'
              : 'Pide lo que necesita tu área. Compras la revisa y la aprueba.'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} aria-label='Cerrar'>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <Typography variant='subtitle1' fontWeight={700}>
              Solicitud
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              label='Fecha de elaboración'
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

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label='Tipo de compra'
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

          <RequesterSection
            selectedRequester={selectedRequester}
            setSelectedRequester={setSelectedRequester}
            requesterOptions={requesterOptions}
            loadingRequesters={loadingRequesters}
            formData={formData}
            setFormData={setFormData}
            existingRequest={existingRequest}
          />

          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <ItemsSection
              formData={formData}
              setFormData={setFormData}
              currentItem={currentItem}
              setCurrentItem={setCurrentItem}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>
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

          {error && (
            <Grid item xs={12}>
              <Alert severity='error'>{error}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button color='inherit' onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={onSubmit}
          sx={{
            bgcolor: PURCHASE_TEAL,
            '&:hover': { bgcolor: PURCHASE_TEAL_HOVER }
          }}
        >
          {existingRequest ? 'Guardar cambios' : 'Crear solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
