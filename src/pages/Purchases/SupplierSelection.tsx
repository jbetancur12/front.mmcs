import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Criterion, SelectionSupplier } from './Types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Link } from 'react-router-dom'
import { Add, Visibility } from '@mui/icons-material'
import SupplierSelectionModal from 'src/Components/Purchases/SupplierSelectionModal'

// Definir el tipo para los proveedores

const SuppliersSelection: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [suppliers, setSuppliers] = useState<SelectionSupplier[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosPrivate.get<SelectionSupplier[]>(
          '/suppliers/selection-suppliers'
        )
        setSuppliers(response.data)
      } catch (error) {
        console.error('Error fetching suppliers', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  // Cargar criterios
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const response = await axiosPrivate.get<Criterion[]>(
          '/suppliers/selection-supplier-sub-items'
        )

        const processedCriteria = response.data.map((item) => ({
          ...item,
          requiresWhich: item.category === 'CALIDAD'
        })) as Criterion[] // Type assertion aquí

        setCriteria(processedCriteria)
        const uniqueCategories = [
          ...new Set(processedCriteria.map((item) => item.category))
        ] as string[] // Cast a string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error cargando criterios', error)
      }
    }
    loadCriteria()
  }, [])

  // Cargar proveedores
  const loadSuppliers = async () => {
    try {
      const response = await axiosPrivate.get<SelectionSupplier[]>(
        '/suppliers/selection-suppliers'
      )
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error cargando proveedores', error)
    }
  }

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<SelectionSupplier>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'supplier.name', header: 'Nombre' },
    { accessorKey: 'product', header: 'Producto o Servicio' },

    {
      accessorKey: 'selectionSupplierDate',
      header: 'Fecha de Selección',
      Cell: ({ row }) => {
        const rawDate = row.original.selectionSupplierDate

        const formattedDate = rawDate
          ? format(new Date(rawDate), "dd 'de' MMMM 'de' yyyy", { locale: es })
          : 'Fecha no disponible'

        return <span>{formattedDate}</span>
      }
    },

    {
      accessorKey: 'finalDecision',
      header: 'Decisión Final',
      Cell: ({ row }) => {
        const decision = row.original.finalDecision

        const getColor = (decision: string) => {
          switch (decision) {
            case 'APPROVED':
              return 'bg-green-200 text-green-700' // Verde para aprobado
            case 'APPROVED WITH RESERVE':
              return 'bg-orange-200 text-orange-700' // Naranja para aprobado con reserva
            case 'NOT APPROVED':
              return 'bg-red-200 text-red-700' // Rojo para no aprobado
            default:
              return 'bg-gray-200 text-gray-700' // Gris por defecto
          }
        }

        const getLabel = (decision: string) => {
          switch (decision) {
            case 'APPROVED':
              return 'Aprobado'
            case 'APPROVED WITH RESERVE':
              return 'Aprobado con Reserva'
            case 'NOT APPROVED':
              return 'No Aprobado'
            default:
              return 'Desconocido'
          }
        }

        return (
          <span
            className={`px-2 py-1 rounded-md font-semibold ${getColor(decision)}`}
          >
            {getLabel(decision)}
          </span>
        )
      }
    }
  ]

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Selección de Proveedores
      </Typography>

      <MaterialReactTable
        localization={MRT_Localization_ES}
        columns={columns}
        data={suppliers}
        state={{ isLoading: loading }}
        enableRowActions={true}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement='right' title='Ver'>
              <Link to={`${row.original.id}`}>
                <IconButton>
                  <Visibility />
                </IconButton>
              </Link>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <Button
            variant='contained'
            onClick={() => setModalOpen(true)}
            startIcon={<Add />}
            sx={{
              backgroundColor: '#9CF08B',
              fontWeight: 'bold',
              color: '#2D4A27',
              '&:hover': {
                backgroundColor: '#6DC662' // Azul más oscuro en hover
              }
            }}
          >
            Nuevo Proveedor
          </Button>
        )}
      />
      <SupplierSelectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadSuppliers}
        criteria={criteria}
        categories={categories}
      />
    </>
  )
}

export default SuppliersSelection
