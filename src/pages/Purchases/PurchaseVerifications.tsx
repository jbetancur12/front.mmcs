import React from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { Typography } from '@mui/material'
import { format } from 'date-fns'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { MRT_Localization_ES } from 'material-react-table/locales/es'

/* Interfaces de Tipos */
interface PurchaseRequest {
  purchaseCode: string
}

interface PurchaseOrder {
  code: string
  purchaseRequest: PurchaseRequest
}

export interface PurchaseVerification {
  id: number
  receivedDate: string
  invoiceNumber: string
  purchaseOrder: PurchaseOrder
  // otros campos que retorne el endpoint, si se necesitan
}

/* Función para obtener las verificaciones */
const fetchPurchaseVerifications = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<PurchaseVerification[]>(
    '/purchaseVerifications'
  )
  return data
}

const PurchaseVerificationsTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { data, isLoading } = useQuery('purchaseVerifications', () =>
    fetchPurchaseVerifications(axiosPrivate)
  )

  const columns: MRT_ColumnDef<PurchaseVerification>[] = [
    {
      accessorKey: 'receivedDate',
      header: 'Fecha de Elaboración',
      Cell: ({ cell }) => {
        const dateStr = cell.getValue<string>()
        return dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : 'N/A'
      }
    },
    {
      accessorFn: (row) => row.purchaseOrder.code,
      header: 'Orden No'
    },
    {
      accessorFn: (row) => row.purchaseOrder.purchaseRequest.purchaseCode,
      header: 'Solicitud No'
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice'
    }
  ]

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Verificaciones
      </Typography>
      <MaterialReactTable
        localization={MRT_Localization_ES}
        columns={columns}
        data={data ?? []}
        state={{ isLoading }}
        enablePagination
        enableSorting
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
      />
    </>
  )
}

export default PurchaseVerificationsTable
