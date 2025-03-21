import React, { useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Visibility, Add, CheckCircle, Cancel } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseOrderData as IPurchaseOrder } from './Types'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { format } from 'date-fns'
import { useQuery, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import CreatePurchaseVerificationModal from 'src/Components/Purchases/PurchaseVerificationModal'

// Función para obtener las órdenes de compra
const fetchPurchaseOrders = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<IPurchaseOrder[]>('/purchaseOrders')
  return data
}

const PurchaseOrders: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient() //
  const { data, isLoading } = useQuery('purchaseOrders', () =>
    fetchPurchaseOrders(axiosPrivate)
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<IPurchaseOrder | null>(null)

  const purchaseOrders = data ?? []

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<IPurchaseOrder>[] = [
    { accessorKey: 'code', header: 'Código' },
    {
      accessorKey: 'requestDate',
      header: 'Fecha de Orden',
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    { accessorKey: 'supplier.name', header: 'Proveedor' },
    { accessorKey: 'supplier.phone', header: 'Teléfono' },
    { accessorKey: 'paymentMethod', header: 'Método de Pago' },
    {
      accessorKey: 'total',
      header: 'Total',
      Cell: ({ cell }) => {
        const total = cell.getValue() as number
        return total
          ? new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(total)
          : 'N/A'
      }
    }
  ]

  // Función para abrir el modal con la orden seleccionada
  const openVerificationModal = (purchaseOrder: IPurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder)
    setModalOpen(true)
  }

  // Manejo del éxito en la creación de la verificación
  const handleVerificationSuccess = () => {
    // Aquí podrías refrescar los datos o mostrar una notificación
    queryClient.invalidateQueries('purchaseOrders')
    setModalOpen(false)
    setSelectedPurchaseOrder(null)
  }

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Órdenes de Compra
      </Typography>

      <MaterialReactTable
        columns={columns}
        data={purchaseOrders}
        state={{ isLoading }}
        localization={MRT_Localization_ES}
        enableRowActions={true}
        renderRowActions={({ row }) => (
          <RenderRowActions
            row={row}
            openVerificationModal={openVerificationModal}
          />
        )}
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
      />

      {selectedPurchaseOrder && (
        <CreatePurchaseVerificationModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedPurchaseOrder(null)
          }}
          onSuccess={handleVerificationSuccess}
          purchaseOrder={selectedPurchaseOrder}
        />
      )}
    </>
  )
}

export default PurchaseOrders

interface RenderRowActionsProps {
  row: any
  openVerificationModal: (purchaseOrder: IPurchaseOrder) => void
}

const RenderRowActions: React.FC<RenderRowActionsProps> = ({
  row,
  openVerificationModal
}) => {
  const isVerified = row.original.verified
  return (
    <Stack direction='row' spacing={1} alignItems='center'>
      {isVerified ? <CheckCircle color='success' /> : <Cancel color='error' />}
      <Tooltip title='Ver'>
        <Link to={`${row.original.id}`}>
          <IconButton>
            <Visibility />
          </IconButton>
        </Link>
      </Tooltip>
      <Tooltip
        title={isVerified ? 'Verificación creada' : 'Crear Verificación'}
      >
        {/* El span es necesario para que el tooltip funcione en un botón deshabilitado */}
        <span>
          <IconButton
            onClick={() => openVerificationModal(row.original)}
            disabled={isVerified}
          >
            <Add />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
