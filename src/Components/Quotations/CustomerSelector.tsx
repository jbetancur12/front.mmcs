// CustomerSelector.tsx
import React from 'react'
import AsyncSelect from 'react-select/async'
import { Paper } from '@mui/material'
import { Customer } from './types'

interface CustomerSelectorProps {
  loadOptions: (inputValue: string) => Promise<any>
  setCustomer: (customer: Customer | null) => void
  customer: Customer | null
  id?: string
  onlyRead: boolean
  styles: any
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  loadOptions,
  setCustomer,
  customer,
  onlyRead,
  styles
}) => {
  const getCustomerValue = () => {
    if (!customer) return null
    return {
      value: customer.id,
      label: customer.nombre,
      // Extraer solo las propiedades necesarias
      id: customer.id,
      nombre: customer.nombre,
      email: customer.email,
      telefono: customer.telefono,
      direccion: customer.direccion,
      ciudad: customer.ciudad
    }
  }
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <AsyncSelect
        isDisabled={onlyRead}
        cacheOptions
        placeholder='Buscar Cliente'
        loadOptions={loadOptions}
        onChange={(selectedOption: any) => setCustomer(selectedOption)}
        value={getCustomerValue()} // Usar value en lugar de defaultValue
        styles={styles(!!customer)}
        key={customer?.id} // Forzar re-render cuando cambie el cliente
      />
    </Paper>
  )
}
