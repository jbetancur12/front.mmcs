import React, { useState } from 'react'
import { MRT_Cell, MRT_ColumnDef, MRT_Row } from 'material-react-table'
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import { SelectionSupplier } from './Types'
import {
  useSupplierSelectionCriteria,
  useSupplierSelections
} from 'src/hooks/purchases/useSuppliers'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import {
  Add,
  CheckCircle,
  Edit,
  HowToReg,
  Visibility,
  WarningAmber
} from '@mui/icons-material'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import SupplierSelectionModal from 'src/Components/Purchases/SupplierSelectionModal'

import { logger } from 'src/utils/logger'
// Definir el tipo para los proveedores

const DECISIONS: Record<
  string,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' }
> = {
  APPROVED: { label: 'Aprobado', color: 'success' },
  'APPROVED WITH RESERVE': { label: 'Aprobado con reserva', color: 'warning' },
  'NOT APPROVED': { label: 'No aprobado', color: 'error' },
  UNKNOWN: { label: 'Desconocido', color: 'default' }
}

const SuppliersSelection: React.FC = () => {
  const { data: suppliers = [], isLoading: loading } = useSupplierSelections()
  const { criteria, categories } = useSupplierSelectionCriteria({
    onError: (error) => logger.error('Error cargando criterios', error)
  })
  const [modalOpen, setModalOpen] = useState(false)

  const [editingSelection, setEditingSelection] =
    useState<SelectionSupplier | null>(null)

  const handleOpenEditModal = (selection: SelectionSupplier) => {
    setEditingSelection(selection)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingSelection(null) // Limpiar al cerrar
  }

  const handleSuccess = () => {
    // La mutación del modal invalida la lista de selecciones
  }

  const columns: MRT_ColumnDef<SelectionSupplier>[] = [
    { accessorKey: 'id', header: 'ID', size: 60 },
    {
      accessorKey: 'supplier.name',
      header: 'Proveedor',
      size: 240,
      Cell: ({ cell }: { cell: MRT_Cell<SelectionSupplier> }) => (
        <Typography variant='body2' fontWeight={600}>
          {cell.getValue<string>()}
        </Typography>
      )
    },
    { accessorKey: 'product', header: 'Producto o servicio', size: 380 },
    {
      accessorKey: 'selectionSupplierDate',
      header: 'Fecha de selección',
      size: 150,
      Cell: ({ row }: { row: MRT_Row<SelectionSupplier> }) => {
        const rawDate = row.original.selectionSupplierDate
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            {rawDate
              ? format(new Date(rawDate), 'dd MMM yyyy', { locale: es })
              : 'Sin fecha'}
          </span>
        )
      }
    },
    {
      accessorKey: 'finalDecision',
      header: 'Decisión final',
      size: 190,
      Cell: ({ row }: { row: MRT_Row<SelectionSupplier> }) => {
        const { label, color } =
          DECISIONS[row.original.finalDecision] ?? DECISIONS.UNKNOWN
        return (
          <Chip size='small' variant='outlined' color={color} label={label} />
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
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setModalOpen(true)}
            sx={{
              bgcolor: '#00BFA5',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#00ACC1' }
            }}
          >
            Nuevo proveedor
          </Button>
        }
        stats={
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4}>
              <LmsStatCard
                variant='quiet'
                label='Seleccionados'
                value={suppliers.length}
                icon={<HowToReg />}
                tone='teal'
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <LmsStatCard
                variant='quiet'
                label='Aprobados'
                value={
                  suppliers.filter((x) => x.finalDecision === 'APPROVED').length
                }
                icon={<CheckCircle />}
                tone='green'
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <LmsStatCard
                variant='quiet'
                label='Con reserva'
                value={
                  suppliers.filter(
                    (x) => x.finalDecision === 'APPROVED WITH RESERVE'
                  ).length
                }
                icon={<WarningAmber />}
                tone='orange'
              />
            </Grid>
          </Grid>
        }
      >
        <DataTable
          columns={columns}
          data={suppliers}
          itemLabel={['proveedor', 'proveedores']}
          searchPlaceholder='Buscar proveedores'
          state={{ isLoading: loading }}
          enableRowActions
          // PurchasesPage ya pone el marco de la tabla
          muiTablePaperProps={{ elevation: 0 }}
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title='Ver'>
                <IconButton
                  component={Link}
                  to={`${row.original.id}`}
                  size='small'
                  aria-label={`Ver ${row.original.supplier?.name}`}
                  sx={{ color: '#00695C' }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title='Editar evaluación'>
                <IconButton
                  onClick={() => handleOpenEditModal(row.original)}
                  size='small'
                  aria-label={`Editar evaluación de ${row.original.supplier?.name}`}
                  sx={{ color: '#2563eb' }}
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
