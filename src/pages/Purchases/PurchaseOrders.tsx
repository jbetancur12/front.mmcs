import React from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Visibility } from '@mui/icons-material'
import { PurchaseOrderData as IPurchaseOrder } from './Types'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
// import { PurchaseOrderStatus } from './Enums'
import { format } from 'date-fns'

import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'

// Función para obtener las órdenes de compra
const fetchPurchaseOrders = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<IPurchaseOrder[]>('/purchaseOrders')
  return data
}

const PurchaseOrders: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { data, isLoading } = useQuery('purchaseOrders', () =>
    fetchPurchaseOrders(axiosPrivate)
  )

  const purchaseOrders = data ?? []

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<IPurchaseOrder>[] = [
    { accessorKey: 'code', header: 'Codigo' },
    {
      accessorKey: 'requestDate',
      header: 'Fecha de Orden',
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    { accessorKey: 'supplier.name', header: 'Proveedor' },
    { accessorKey: 'supplier.phone', header: 'Telefono' },
    { accessorKey: 'paymentMethod', header: 'Metodo de Pago' },
    // {
    //   accessorKey: 'status',
    //   header: 'Estado',
    //   Cell: ({ cell }) => {
    //     const status = cell.getValue() as PurchaseOrderStatus
    //     let color: 'warning' | 'success' | 'error'
    //     let estilo

    //     switch (status) {
    //       case PurchaseOrderStatus.Pending:
    //         color = 'warning'
    //         estilo = {
    //           backgroundColor: '#fff3e0',
    //           color: '#ef6c00',
    //           fontWeight: 600,
    //           borderRadius: '12px',
    //           padding: '4px 12px'
    //         }
    //         break
    //       case PurchaseOrderStatus.Approved:
    //         color = 'success'
    //         estilo = {
    //           backgroundColor: '#e8f5e9',
    //           color: '#2e7d32',
    //           fontWeight: 600,
    //           borderRadius: '12px',
    //           padding: '4px 12px'
    //         }
    //         break
    //       case PurchaseOrderStatus.Rejected:
    //         color = 'error'
    //         estilo = {
    //           backgroundColor: '#ffebee',
    //           color: '#c62828',
    //           fontWeight: 600,
    //           borderRadius: '12px',
    //           padding: '4px 12px'
    //         }
    //         break
    //       default:
    //         throw new Error(`Estado desconocido: ${status}`)
    //     }

    //     const chipElement = (
    //       <Chip
    //         label={status.toUpperCase()}
    //         color={color}
    //         sx={estilo}
    //         icon={
    //           {
    //             [PurchaseOrderStatus.Pending]: <AccessTime fontSize='small' />,
    //             [PurchaseOrderStatus.Approved]: (
    //               <CheckCircle fontSize='small' />
    //             ),
    //             [PurchaseOrderStatus.Rejected]: <Cancel fontSize='small' />
    //           }[status]
    //         }
    //       />
    //     )

    //     if (status === PurchaseOrderStatus.Rejected) {
    //       const rejectionReason = cell.row.original.rejectionReason
    //       return (
    //         <Tooltip arrow title={rejectionReason || 'Sin motivo de rechazo'}>
    //           {chipElement}
    //         </Tooltip>
    //       )
    //     }

    //     return chipElement
    //   }
    // },

    {
      accessorKey: 'total',
      header: 'Total',
      Cell: ({ cell }) => {
        const total = cell.getValue() as number
        return total
          ? new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
              //   minimumFractionDigits: 2,
              //   maximumFractionDigits: 2
            }).format(total)
          : 'N/A'
      }
    }
  ]

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
        renderRowActions={({ row }) => <RenderRowActions row={row} />}
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
      />
    </>
  )
}

export default PurchaseOrders

const RenderRowActions = ({ row }: { row: any }) => {
  return (
    <Stack direction='row' spacing={1}>
      {/* Botón de Visibilidad: siempre se muestra */}
      <Tooltip title='Ver'>
        <Link to={`${row.original.id}`}>
          <IconButton>
            <Visibility />
          </IconButton>
        </Link>
      </Tooltip>
    </Stack>
  )
}
