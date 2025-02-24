import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Button, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useNavigate } from 'react-router-dom'
import { Visibility } from '@mui/icons-material'

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
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    const fetchSuppliers = async () => {
      try {
        const response = await axiosPrivate.get<Supplier[]>('/suppliers')
        if (isMounted) setSuppliers(response.data)
      } catch (error) {
        if (isMounted) console.error('Error fetching suppliers', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSuppliers()

    return () => {
      isMounted = false
    }
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
        localization={MRT_Localization_ES}
        columns={columns}
        data={suppliers}
        state={{ isLoading: loading }}
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            onClick={() => navigate(`report`)}
            startIcon={<Visibility />}
            sx={{
              backgroundColor: '#9CF08B',
              fontWeight: 'bold',
              color: '#2D4A27',
              '&:hover': {
                backgroundColor: '#6DC662' // Azul más oscuro en hover
              }
            }}
          >
            Ver en PDF
          </Button>
        )}
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
      />
    </>
  )
}

export default SuppliersTable
