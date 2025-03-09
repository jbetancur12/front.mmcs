// ProductRow.tsx
import React from 'react'
import AsyncSelect from 'react-select/async'
import { TextField, Button } from '@mui/material'
import { HandleProductChangeType, Product } from './types'
import { NumericFormatCustom } from '../NumericFormatCustom'

interface ProductRowProps {
  index: number
  product: Product
  handleProductChange: HandleProductChangeType
  handleRemoveProduct: (index: number) => void
  loadOptions: (inputValue: string) => Promise<any>
  disabled: boolean

  quoteType: 'equipos' | 'mantenimiento'
}

export const ProductRow: React.FC<ProductRowProps> = ({
  index,
  product,
  handleProductChange,
  handleRemoveProduct,
  loadOptions,
  disabled,
  quoteType
}) => (
  <div style={{ display: 'flex', marginBottom: '8px' }}>
    <div style={{ marginRight: '10px', width: '50%' }}>
      <AsyncSelect
        cacheOptions
        isDisabled={disabled}
        loadOptions={loadOptions}
        onChange={(selectedOption: any) =>
          handleProductChange(index, 'product', selectedOption, quoteType)
        }
        placeholder='Buscar Producto'
        value={{ label: product.name, value: index.toString() }}
        // classNamePrefix='react-select'
      />
    </div>

    {quoteType === 'mantenimiento' && (
      <TextField
        label='No. Visitas'
        type='number'
        value={product.visits || 1}
        onChange={(e) =>
          handleProductChange(
            index,
            'visits',
            parseInt(e.target.value),
            quoteType
          )
        }
        sx={{ mr: 2, width: '100%', flex: 0.5 }}
        InputProps={{ inputProps: { min: 1 } }}
      />
    )}

    <TextField
      disabled={disabled}
      label='Precio'
      variant='outlined'
      value={product.price}
      onChange={(e) =>
        handleProductChange(
          index,
          'price',
          parseFloat(e.target.value),
          quoteType
        )
      }
      InputProps={{
        inputComponent: NumericFormatCustom as any
      }}
      sx={{ mr: 2, width: '100%', flex: 1 }}
    />

    <TextField
      disabled={disabled}
      label='Cantidad'
      variant='outlined'
      type='number'
      value={product.quantity}
      onChange={(e) =>
        handleProductChange(
          index,
          'quantity',
          parseInt(e.target.value),
          quoteType
        )
      }
      sx={{ mr: 2, width: '100%', flex: 0.5 }}
    />

    <TextField
      disabled={disabled}
      label='Total'
      variant='outlined'
      value={
        quoteType === 'mantenimiento'
          ? product.quantity * product.price * (product.visits || 1)
          : product.quantity * product.price
      }
      sx={{ mr: 2, width: '100%', flex: 1 }}
      InputProps={{
        readOnly: true,
        inputComponent: NumericFormatCustom as any
      }}
    />

    <Button
      disabled={disabled}
      variant='contained'
      color='error'
      onClick={() => handleRemoveProduct(index)}
      sx={{ mr: 1, width: '10px' }}
    >
      X
    </Button>
  </div>
)
