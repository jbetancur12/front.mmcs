// components/ItemsSection.tsx
import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { PurchaseRequestItem } from 'src/pages/Purchases/Types'
import { ItemsSectionProps } from '../types/PurchaseRequestTypes'

const ItemsSection: React.FC<ItemsSectionProps> = ({
  formData,
  setFormData,
  currentItem,
  setCurrentItem
}) => {
  const addItem = () => {
    if (
      currentItem.description &&
      currentItem.quantity &&
      currentItem.quantity > 0
    ) {
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

  return (
    <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
      <Typography variant='subtitle1' sx={{ mb: 2 }}>
        Ítems Solicitados
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={2}>
          <TextField
            fullWidth
            label='Cant *'
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

        <Grid item xs={10}>
          <TextField
            fullWidth
            label='Descripción *'
            value={currentItem.description}
            onChange={(e) =>
              setCurrentItem((prev) => ({
                ...prev,
                description: e.target.value
              }))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant='outlined'
            onClick={addItem}
            startIcon={<Add />}
            disabled={
              !currentItem.description ||
              !(currentItem.quantity && currentItem.quantity > 0)
            }
          >
            Agregar Ítem
          </Button>
        </Grid>
      </Grid>

      {/* Lista de ítems agregados */}
      <Box sx={{ mt: 2 }}>
        {formData.items?.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1,
              p: 1,
              border: '1px solid #eee',
              borderRadius: 1
            }}
          >
            <Box sx={{ flex: 1 }}>
              (Cant: {item.quantity})<div>{item.description}</div>
            </Box>
            <IconButton onClick={() => removeItem(index)}>
              <Delete color='error' />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default ItemsSection
