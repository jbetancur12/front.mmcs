// ProductsSection.tsx
import React from 'react'
import { Paper, Button } from '@mui/material'
import { ProductRow } from './ProductRow'
import { HandleProductChangeType, Product } from './types'

interface ProductsSectionProps {
  products: Product[]
  handleAddProduct: () => void
  handleProductChange: HandleProductChangeType
  handleRemoveProduct: (index: number) => void
  loadOptions: (inputValue: string) => Promise<any>
  onlyRead: boolean
  quoteType: 'equipos' | 'mantenimiento'
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  handleAddProduct,
  handleProductChange,
  handleRemoveProduct,
  loadOptions,
  onlyRead,
  quoteType
}) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    {products.map((product, index) => (
      <ProductRow
        key={index}
        index={index}
        product={product}
        handleProductChange={handleProductChange}
        handleRemoveProduct={handleRemoveProduct}
        loadOptions={loadOptions}
        disabled={onlyRead}
        quoteType={quoteType}
      />
    ))}
    <Button
      variant='contained'
      onClick={handleAddProduct}
      sx={{ mb: 2 }}
      disabled={onlyRead}
    >
      Agregar Producto
    </Button>
  </Paper>
)
