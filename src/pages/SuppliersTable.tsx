import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'

// Definir el tipo para los proveedores
interface Supplier {
  id: number
  name: string
  taxId: string
  typePerson: 0 | 1
  contactName: string
  email: string
  phone: string
}

const SuppliersTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosPrivate.get<Supplier[]>('/suppliers')
        setSuppliers(response.data)
      } catch (error) {
        console.error('Error fetching suppliers', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<Supplier>[] = [
    // { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'taxId', header: 'NIT/CC' },
    {
      accessorKey: 'typePerson',
      header: 'Tipo de Persona',
      accessorFn: (row) => (row.typePerson !== 0 ? 'Natural' : 'Jurídico')
    },
    {
      accessorKey: 'contactName',
      header: 'Contacto',
      accessorFn: (row) => (row.typePerson !== 0 ? row.name : row.contactName)
    },
    { accessorKey: 'phone', header: 'Teléfono' },
    { accessorKey: 'email', header: 'Correo Electrónico' }
  ]

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Lista de Proveedores
      </Typography>

      <MaterialReactTable
        columns={columns}
        data={suppliers}
        state={{ isLoading: loading }}
      />
    </>
  )
}

export default SuppliersTable
