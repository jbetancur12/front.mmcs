import { Download, Edit, Print, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  styled,
  Table as MuiTable,
  Tooltip
} from '@mui/material'

import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { differenceInDays, format } from 'date-fns'

import { Link } from 'react-router-dom'
import { BlobProvider, PDFDownloadLink } from '@react-pdf/renderer'
import QuotePDF from './QuotePDF'
import Loader from './Loader2'
import useAxiosPrivate from '@utils/use-axios-private'

// Define interfaces
export interface QuoteData {
  id: number
  products: any // Se puede reemplazar por un tipo específico si conoces la estructura de los productos
  subtotal: number
  discountRatio: number
  total: number
  taxRatio: number
  taxTotal: number
  discountTotal: number
  observations: string
  comments: any
  otherFields: any
  customer: {
    nombre: string
    email: string
    telefono: string
    direccion: string
    ciudad: string
    identificacion: string
  }
  createdAt: string
  status: Record<string, any>
}

// API URL

export const statusOptions: any = {
  created: 'Creada',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  delivered: 'Entregada',
  canceled: 'Cancelada',
  invoiced: 'Facturada',
  paid: 'Pagada',
  pending: 'Pendiente',
  onCalibration: 'En calibración',
  onMaintenance: 'En mantenimiento'
}

const StyledTableCell = styled(TableCell)(() => ({
  fontWeight: 'bold',
  // backgroundColor: theme.palette.common.black,
  // color: theme.palette.common.white,
  border: 'none', // Eliminar bordes
  fontFamily: 'Roboto',
  lineHeight: 0.1,
  marginBottom: 20
}))

const StyledTableBodycell = styled(TableCell)(() => ({
  border: 'none', // Eliminar bordes
  fontFamily: 'Roboto',
  paddingTop: 0,
  paddingBottom: 0
}))

// Main component
const Table: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [tableData, setTableData] = useState<QuoteData[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Fetch devices data
  const fetchQuotes = async () => {
    setLoading(true)
    try {
      const response = await axiosPrivate.get(`/quotes`, {})

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching device data:', error)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<QuoteData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '# Cotización',
        size: 80,
        Cell: ({ row }) => <Box>VT-{row.original.id}</Box>
      },
      {
        accessorKey: 'customer.nombre',
        header: 'Cliente',
        size: 100
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 50,
        Cell: ({ row }) => {
          const status = row.original.status[row.original.status.length - 1]
          const dateDifference = differenceInDays(
            new Date(),
            new Date(status.date)
          )

          // Verificar si el estado es "onCalibration" o "onMaintenance" y han pasado más de 10 días
          const isOverdue =
            (status.status === 'onCalibration' ||
              status.status === 'onMaintenance') &&
            dateDifference > 10

          return (
            <Box
              sx={{
                fontWeight: 'bold',
                color: isOverdue
                  ? '#f44336'
                  : status.status === 'delivered'
                    ? '#4CAF50'
                    : 'inherit'
              }}
            >
              {statusOptions[status.status]}
            </Box>
          )
        }
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 50,
        Cell: ({ row }) =>
          new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(row.original.total)
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        size: 50,
        Cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'yyyy-MM-dd')
      }
    ],
    [] // No hay dependencias específicas aquí
  )

  return (
    <>
      <Toaster />
      <Loader loading={loading} />
      <Link to='new-quote'>
        <Button
          variant='contained'
          sx={{
            fontWeight: 'bold',
            color: '#DCFCE7',
            marginBottom: '1rem'
          }}
        >
          Crear Cotización
        </Button>
      </Link>
      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        enableRowActions={true}
        // enableColumnResizing={true}
        positionActionsColumn='last'
        localization={MRT_Localization_ES}
        // displayColumnDefOptions={{
        //   "mrt-row-actions": {
        //     muiTableHeadCellProps: {
        //       align: "center",
        //     },
        //     // size: 120,
        //   },
        // }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              textAlign: 'center'
            },
            '& .Mui-TableHeadCell-Content': {
              justifyContent: 'center'
            },
            '& .Mui-TableBodyCell-DetailPanel': {
              background: '#d6f7cf'
            }
          }
        }}
        columns={columns}
        data={tableData}
        initialState={{
          sorting: [
            {
              id: 'id',
              desc: true
            }
          ]
        }}
        // editingMode="modal" //default

        // enableEditing
        // onEditingRowSave={handleSaveRowEdits}
        // onEditingRowCancel={handleCancelRowEdits}
        // initialState={{
        //   columnVisibility: { id: false },
        // }}
        renderDetailPanel={({ row }) => {
          return (
            // <Box
            //   sx={{
            //     alignItems: "center",
            //     display: "flex",
            //     justifyContent: "space-around",
            //     left: "30px",
            //     maxWidth: "1000px",
            //     position: "sticky",
            //     width: "100%",
            //   }}
            // >
            //   <Box sx={{ textAlign: "center" }}>
            //     <List
            //       sx={{
            //         width: "100%",
            //         maxWidth: 360,
            //         bgcolor: "background.paper",
            //       }}
            //     >
            //       {row.original.status.map((status: any, index: number) => (
            //         <React.Fragment key={index}>
            //           <ListItem
            //             key={index}
            //             sx={{
            //               display: "flex",
            //               flexDirection: "column",
            //               alignItems: "center",
            //               padding: 2,
            //               border:
            //                 index === row.original.status.length - 1
            //                   ? `2px solid ${
            //                       status.status === "delivered"
            //                         ? "#4caf50"
            //                         : "#3f51b5"
            //                     }`
            //                   : "1px solid #ccc",
            //               borderRadius: 5,
            //             }}
            //           >
            //             <Typography variant="body1" color="text.primary">
            //               Estado: {status.status}
            //             </Typography>
            //             <Typography variant="body2" color="text.secondary">
            //               Fecha: {status.date}
            //             </Typography>
            //             <Typography variant="body2" color="text.secondary">
            //               Usuario: {status.user}
            //             </Typography>
            //           </ListItem>
            //           {index < row.original.status.length - 1 && <Divider />}
            //         </React.Fragment>
            //       ))}
            //     </List>
            //   </Box>
            // </Box>
            <MuiTable
              sx={{
                width: '550px',
                border: 'none',

                borderRadius: '5px',
                padding: '10px',
                fontFamily: 'Roboto'
              }}
              size='small'
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell>Fecha</StyledTableCell>
                  <StyledTableCell>Estado</StyledTableCell>
                  <StyledTableCell>Usuario</StyledTableCell>
                  <StyledTableCell>Observaciones</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {row.original.status.map((status: any, index: number) => {
                  const dateDifference = differenceInDays(
                    new Date(),
                    new Date(status.date)
                  )

                  // Verificar si el estado es "onCalibration" o "onMaintenance" y han pasado más de 10 días
                  const isOverdue =
                    (status.status === 'onCalibration' ||
                      status.status === 'onMaintenance') &&
                    dateDifference > 1
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        background: isOverdue
                          ? '#f44336'
                          : status.status === 'delivered'
                            ? '#4CAF50'
                            : 'inherit'
                      }}
                    >
                      <StyledTableBodycell component='th' scope='row'>
                        {format(new Date(status.date), 'yyyy-MM-dd HH:mm')}
                      </StyledTableBodycell>
                      <StyledTableBodycell>
                        {statusOptions[status.status]}
                      </StyledTableBodycell>
                      <StyledTableBodycell>{status.user}</StyledTableBodycell>
                      <StyledTableBodycell>
                        {status.comments}
                      </StyledTableBodycell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </MuiTable>
          )
        }}
        renderRowActions={({ row }) => {
          return (
            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                // width: 20,
                justifyContent: 'center'
              }}
            >
              <Tooltip arrow placement='right' title='Ver'>
                <Link to={`${row.original.id}`}>
                  <Visibility />
                </Link>
              </Tooltip>
              <Tooltip arrow placement='right' title='Ver'>
                <BlobProvider document={<QuotePDF quoteData={row.original} />}>
                  {({ url }) => (
                    <a href={url || ''} target='_blank'>
                      <Print />
                    </a>
                  )}
                </BlobProvider>
              </Tooltip>
              <Tooltip arrow placement='right' title='descargar'>
                <PDFDownloadLink
                  document={<QuotePDF quoteData={row.original} />}
                  fileName={'Cotización-' + row.original.id + '.pdf'}
                >
                  <Download />
                </PDFDownloadLink>
              </Tooltip>
              <Tooltip arrow placement='right' title='Editar'>
                <Link to={`edit-quote/${row.original.id}`}>
                  <Edit />
                </Link>
              </Tooltip>
            </Box>
          )
        }}
      />
    </>
  )
}

//example of creating a mui dialog modal for creating new rows

export default Table
