import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { Box, Button, Grid, IconButton, Tooltip } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Criterion, SelectionSupplier } from './Types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { Add, CheckCircle, Edit, HowToReg, Visibility, WarningAmber } from '@mui/icons-material'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import SupplierSelectionModal from 'src/Components/Purchases/SupplierSelectionModal'

// Definir el tipo para los proveedores

const SuppliersSelection: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [suppliers, setSuppliers] = useState<SelectionSupplier[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)

  const [editingSelection, setEditingSelection] =
    useState<SelectionSupplier | null>(null)

  useEffect(() => {
    loadSuppliers() // Cargar proveedores al montar el componente
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
    setLoading(true)
    try {
      const response = await axiosPrivate.get<SelectionSupplier[]>(
        '/suppliers/selection-suppliers'
      )
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error cargando proveedores', error)
    } finally {
      setLoading(false) // Asegurarse de que el loading se desactive al finalizar
    }
  }

  const handleOpenEditModal = (selection: SelectionSupplier) => {
    setEditingSelection(selection)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingSelection(null) // Limpiar al cerrar
  }

  const handleSuccess = () => {
    loadSuppliers() // Recargar la lista después de crear/editar
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
      <PurchasesPage
        title='Selección de proveedores'
        subtitle='Proveedores evaluados y aprobados para compras'
        icon={<HowToReg />}
        actions={
          <Button variant='contained' startIcon={<Add />} onClick={() => setModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
            Nuevo proveedor
          </Button>
        }
        stats={
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4}>
              <LmsStatCard label='Seleccionados' value={suppliers.length} icon={<HowToReg />} tone='teal' />
            </Grid>
            <Grid item xs={6} sm={4}>
              <LmsStatCard label='Aprobados' value={suppliers.filter((x) => x.finalDecision === 'APPROVED').length} icon={<CheckCircle />} tone='green' />
            </Grid>
            <Grid item xs={6} sm={4}>
              <LmsStatCard label='Con reserva' value={suppliers.filter((x) => x.finalDecision === 'APPROVED WITH RESERVE').length} icon={<WarningAmber />} tone='orange' />
            </Grid>
          </Grid>
        }
      >
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={suppliers}
          state={{ isLoading: loading }}
          enableRowActions={true}
          enablePinning
          initialState={{ columnPinning: { right: ['mrt-row-actions'] } }}
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title='Ver'>
                <Link to={`${row.original.id}`}>
                  <IconButton size='small' sx={{ color: '#00BFA5' }}>
                    <Visibility />
                  </IconButton>
                </Link>
              </Tooltip>
              <Tooltip title='Editar evaluación'>
                <IconButton
                  onClick={() => handleOpenEditModal(row.original)}
                  size='small'
                  color='primary'
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </PurchasesPage>
      <SupplierSelectionModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        criteria={criteria}
        categories={categories}
        existingSelectionData={editingSelection}
      />
    </>
  )
}

export default SuppliersSelection
