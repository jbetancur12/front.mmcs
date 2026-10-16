// components/ItemsSection.tsx
import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material'
import { Add, DeleteOutline } from '@mui/icons-material'
import { PurchaseRequestItem } from 'src/pages/Purchases/Types'
import { ItemsSectionProps } from '../types/PurchaseRequestTypes'
import {
  PURCHASE_TEAL,
  PURCHASE_TEAL_HOVER
} from '../../purchaseTableStyle'

const ItemsSection: React.FC<ItemsSectionProps> = ({
  formData,
  setFormData,
  currentItem,
  setCurrentItem
}) => {
  const canAdd =
    !!currentItem.description?.trim() &&
    !!(currentItem.quantity && currentItem.quantity > 0)

  const addItem = () => {
    if (canAdd) {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          items: [
            ...(prev.items || []),
            {
              description: currentItem.description!,
              quantity: currentItem.quantity!,
              supplierIds: currentItem.supplierIds || []
            } as PurchaseRequestItem
          ]
        }
        return updatedFormData
      })

      setCurrentItem({
        quantity: 1,
        description: '',
        supplierIds: [],
        supplierInput: []
      })
    }
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }))
  }

  const items = formData.items ?? []

  return (
    <Box>
      <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1.5 }}>
        Ítems{items.length > 0 ? ` (${items.length})` : ''}
      </Typography>

      <Grid container spacing={2} alignItems='flex-start'>
        <Grid item xs={4} sm={2}>
          <TextField
            fullWidth
            required
            label='Cantidad'
            type='number'
            value={currentItem.quantity}
            onChange={(e) =>
              setCurrentItem((prev) => ({
                ...prev,
                quantity: Number(e.target.value)
              }))
            }
          />
        </Grid>

        <Grid item xs={8} sm={7}>
          <TextField
            fullWidth
            required
            label='Descripción'
            value={currentItem.description}
            helperText='Escribe lo que necesitas y pulsa Enter o Agregar'
            onChange={(e) =>
              setCurrentItem((prev) => ({
                ...prev,
                description: e.target.value
              }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Button
            fullWidth
            variant='contained'
            onClick={addItem}
            startIcon={<Add />}
            disabled={!canAdd}
            sx={{
              height: 56,
              bgcolor: PURCHASE_TEAL,
              '&:hover': { bgcolor: PURCHASE_TEAL_HOVER }
            }}
          >
            Agregar
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ mt: 1 }}>
        {items.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
            Aún no hay ítems. Agrega al menos uno para crear la solicitud.
          </Typography>
        ) : (
          items.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1,
                borderBottom:
                  index < items.length - 1 ? '1px solid #eee' : 'none'
              }}
            >
              <Typography
                variant='body2'
                fontWeight={700}
                sx={{ minWidth: 40, color: PURCHASE_TEAL }}
              >
                ×{item.quantity}
              </Typography>
              <Typography variant='body2' sx={{ flex: 1 }}>
                {item.description}
              </Typography>
              <Tooltip title='Quitar ítem'>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => removeItem(index)}
                  aria-label='Quitar ítem'
                >
                  <DeleteOutline />
                </IconButton>
              </Tooltip>
            </Box>
          ))
        )}
      </Box>
    </Box>
  )
}

export default ItemsSection
