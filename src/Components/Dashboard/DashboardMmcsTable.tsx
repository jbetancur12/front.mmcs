import { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  IconButton,
  Skeleton,
  Chip,
  Avatar,
  Paper,
  Tooltip
} from '@mui/material'
import {
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import useAxiosPrivate from '@utils/use-axios-private'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

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

const DashboardTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  const [tableData, setTableData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch files data
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(
        `/files/next-to-expire-grouped`,
        {}
      )
      setTableData(response.data || [])
    } catch (error) {
      console.error('Error fetching file data:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos de certificados',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])



  const handleRowClick = (row: Customer) => {
    navigate(`/customers/certificates-due/${row.id}`)
  }

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/certificates-due/${customerId}`)
  }

  const columnsCustomer = useMemo<MRT_ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Cliente',
        size: 250,
        enableEditing: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ 
                bgcolor: '#ff5722', 
                width: 32,
                height: 32
              }}
            >
              <BusinessIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="600">
                {row.original.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {row.original.identificacion}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Contacto',
        size: 200,
        enableEditing: false,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">
              {row.original.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.telefono}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'ciudad',
        header: 'Ubicación',
        size: 180,
        enableEditing: false,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">
              {row.original.ciudad}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.departamento}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: 'certificados',
        header: 'Certificados',
        size: 200,
        enableEditing: false,
        Cell: ({ row }) => {
          const certificados = row.original.certificados || []
          const now = new Date()
          
          let expiredCount = 0
          let soonToExpireCount = 0
          
          certificados.forEach(cert => {
            const nextDate = new Date(cert.nextCalibrationDate)
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            
            if (nextDate < now) {
              expiredCount++
            } else if (nextDate <= thirtyDaysFromNow) {
              soonToExpireCount++
            }
          })

          return (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${certificados.length}`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
              />
              {expiredCount > 0 && (
                <Chip
                  label={`Vencidos: ${expiredCount}`}
                  size="small"
                  sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}
                />
              )}
              {soonToExpireCount > 0 && (
                <Chip
                  label={`Próximos: ${soonToExpireCount}`}
                  size="small"
                  sx={{ bgcolor: '#fff3e0', color: '#f57c00' }}
                />
              )}
            </Box>
          )
        },
      }
    ],
    []
  )

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={400} height={40} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    )
  }

  if (tableData.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 8, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
            ¡Excelente!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
            Certificados al Día
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Todos los certificados están vigentes. No hay certificados vencidos o próximos a vencer.
          </Typography>
          <img
            src='/images/tick.png'
            alt='Certificados al dia'
            style={{ maxWidth: '200px', opacity: 0.8 }}
          />
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>




      {/* Table Section */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          columns={columnsCustomer}
          data={tableData}
          localization={MRT_Localization_ES}
          state={{
            isLoading: loading,
          }}
          enableRowActions
          positionActionsColumn="last"
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Ver certificados">
                <IconButton
                  size="small"
                  onClick={() => handleViewCustomer(row.original.id)}
                  sx={{
                    color: '#ff5722',
                    '&:hover': {
                      bgcolor: 'rgba(255, 87, 34, 0.1)'
                    }
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          muiTableProps={{
            sx: {
              '& .MuiTableHead-root': {
                '& .MuiTableCell-root': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 600,
                }
              },
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root:hover': {
                  backgroundColor: 'rgba(255, 87, 34, 0.04)',
                  cursor: 'pointer'
                }
              }
            }
          }}
          muiTableBodyRowProps={({ row }) => ({
            onClick: () => handleRowClick(row.original),
          })}
          muiSearchTextFieldProps={{
            placeholder: 'Buscar clientes...',
            sx: { minWidth: '300px' },
            variant: 'outlined',
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: '#fafafa',
            }
          }}
          muiBottomToolbarProps={{
            sx: {
              backgroundColor: '#fafafa',
            }
          }}
          initialState={{
            density: 'comfortable',
            pagination: {
              pageSize: 10,
              pageIndex: 0,
            },
            columnVisibility: {
              id: false
            }
          }}
          enableColumnFilterModes
          enableColumnOrdering
          enableFacetedValues
          enableRowSelection={false}
          enableStickyHeader
          muiTableContainerProps={{
            sx: {
              maxHeight: '600px',
            }
          }}
        />
      </Paper>
    </Container>
  )
}

export default DashboardTable