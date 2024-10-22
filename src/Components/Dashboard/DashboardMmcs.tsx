import { useEffect, useMemo, useState } from 'react'

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'

import useAxiosPrivate from '@utils/use-axios-private'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@mui/material'

interface Device {
  id: number
  name: string
  formatId: number | null
  certificateTemplateId: number
  magnitude: string
  unit: string
  createdAt: string // ISO string date
  updatedAt: string // ISO string date
}

interface Certificado {
  id: number
  city: string
  location: string
  activoFijo: string
  serie: string
  calibrationDate: string // ISO string date
  nextCalibrationDate: string // ISO string date
  device: Device
}

interface Customer {
  id: number
  nombre: string
  identificacion: string
  direccion: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  certificados: Certificado[]
}

const Dashboard: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  const [tableData, setTableData] = useState<Customer[]>([])

  // Fetch files data
  const fetchFiles = async () => {
    try {
      const response = await axiosPrivate.get(
        `/files/next-to-expire-grouped`,
        {}
      )

      // @ts-ignore: Ignorar el error en esta línea
      setTableData(response.data)
    } catch (error) {
      console.error('Error fetching file data:', error)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const columnsCustomer = useMemo<MRT_ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        size: 10,
        enableEditing: false
      },

      {
        accessorKey: 'nombre', //access nested data with dot notation
        header: 'Nombre',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'identificacion', //access nested data with dot notation
        header: 'Identificación',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'direccion', //access nested data with dot notation
        header: 'Dirección',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'email', //access nested data with dot notation
        header: 'Email',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'telefono', //access nested data with dot notation
        header: 'Telefono',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'ciudad', //access nested data with dot notation
        header: 'Ciudad',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'departamento', //access nested data with dot notation
        header: 'Departamento',
        size: 10,
        enableEditing: false
      }
    ],
    []
  )

  const handleRowClick = (row: Customer) => {
    navigate(`/customers/certificates-due/${row.id}`) // Navigate to a details page, using row.id
  }

  if (tableData.length < 1) {
    return (
      <div className='flex justify-center flex-col items-center h-screen'>
        <h2 className='text-3xl'>Certificados al dia</h2>
        <img
          src='/images/tick.png'
          alt='Certificados al dia'
          width={'25%'}
          className='px-4 mt-7'
        />
      </div>
    )
  }

  return (
    <>
      <Typography variant='h4' gutterBottom sx={{ textAlign: 'center' }}>
        Clientes con Certificados Vencidos o Próximos a Vencer
      </Typography>

      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center'
            },
            size: 120
          }
        }}
        columns={columnsCustomer}
        data={tableData}
        enableColumnOrdering
        enableHiding={false}
        initialState={{
          columnVisibility: {
            filePath: false,
            id: false,
            'certificateType.name': false,
            name: false,
            activoFijo: false
          }
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => handleRowClick(row.original), // Navigate on row click
          sx: { cursor: 'pointer' } // Change cursor to pointer for visual feedback
        })}
      />
    </>
  )
}

export default Dashboard
