import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import {
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { AccessTime, Add, Cancel, CheckCircle } from '@mui/icons-material'
import { PurchaseRequest as IPurchaseRequest } from './Types'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import CreatePurchaseRequestModal from 'src/Components/Purchases/PurchaseRequestModal'
import { PurchaseRequestStatus } from './Enums'
import { format } from 'date-fns'

import RenderRowActions from 'src/Components/Purchases/RenderRowActions'
import { useQuery, useQueryClient } from 'react-query'
import Swal from 'sweetalert2'
import { useHasRole } from '@utils/functions'
import { PurchaseRequestModal } from 'src/Components/Purchases/purchase-request-modal'
import { useNavigate } from 'react-router-dom'
import { FaUser } from 'react-icons/fa'

// Función para obtener las solicitudes de compra
const fetchPurchaseRequests = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  const { data } = await axiosPrivate.get<{
    count: number
    purchaseRequests: IPurchaseRequest[]
  }>('/purchaseRequests')
  return data
}

const PurchaseRequest: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const allowCreationRequest = useHasRole([
    'admin',
    'comp_requester',
    'comp_admin'
  ])
  // Uso de react-query para obtener los datos
  const { data, isLoading } = useQuery('purchaseRequests', () =>
    fetchPurchaseRequests(axiosPrivate)
  )

  const purchaseRequests = data?.purchaseRequests ?? []
  const totalRecords = data?.count ?? 0

  const [modalOpen, setModalOpen] = useState(false)
  const [_, setProviders] = useState<any[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPREdit, setSelectedPREdit] = useState<IPurchaseRequest | null>(
    null
  )

  const handleOpenEditModal = (purchaseRequest: IPurchaseRequest) => {
    setSelectedPREdit(purchaseRequest)
    setEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setSelectedPREdit(null)
    setEditModalOpen(false)
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries('purchaseRequests')
    // No necesitas llamar a handleCloseEditModal aquí si el modal se cierra solo
    // o si onSuccess en el modal ya lo hace (que es el caso).
  }

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await axiosPrivate.get('/suppliers')
        setProviders(response.data)
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }
    fetchProviders()
  }, [])

  const handleSuccess = () => {
    queryClient.invalidateQueries('purchaseRequests')
  }

  // Función para mostrar el popup de configuración del número inicial
  const showInitialSetupPopup = async () => {
    const { value: initialId } = await Swal.fire({
      title: 'Configurar número inicial',
      input: 'number',
      inputAttributes: {
        min: '1'
      },
      inputPlaceholder: 'Ingrese el número inicial (ej. 1000)',
      showCancelButton: true,
      confirmButtonText: 'Guardar'
    })

    if (initialId) {
      try {
        await axiosPrivate.post('/purchaseRequests/set-initial-id', {
          initialId
        })
        Swal.fire(
          '¡Configurado!',
          'El número inicial ha sido establecido.',
          'success'
        )
        // Actualiza la query para refrescar el count si es necesario
        queryClient.invalidateQueries('purchaseRequests')
        // Abre el modal para crear la solicitud
        setModalOpen(true)
      } catch (error) {
        Swal.fire('Error', 'No se pudo establecer el número inicial.', 'error')
      }
    }
  }

  // Función para manejar la apertura del modal
  const handleOpenModal = () => {
    if (totalRecords === 0) {
      // Si no hay registros, se solicita configurar el número inicial
      showInitialSetupPopup()
    } else {
      // Si ya existen registros, abre el modal normalmente
      setModalOpen(true)
    }
  }

  // Definir las columnas de la tabla
  const columns: MRT_ColumnDef<IPurchaseRequest>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'elaborationDate', header: 'Fecha de Elaboración' },
    { accessorKey: 'applicantName', header: 'Nombre del Solicitante' },
    // En tu archivo de columnas
    {
      accessorKey: 'status',
      header: 'Estado',
      Cell: ({ cell }) => {
        const status = cell.getValue() as PurchaseRequestStatus
        let color: 'warning' | 'success' | 'error'
        let estilo

        switch (status) {
          case PurchaseRequestStatus.Pending:
            color = 'warning'
            estilo = {
              backgroundColor: '#fff3e0',
              color: '#ef6c00',
              fontWeight: 600,
              borderRadius: '12px',
              padding: '4px 12px'
            }
            break
          case PurchaseRequestStatus.PreApproved:
            color = 'success'
            estilo = {
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600,
              borderRadius: '12px',
              padding: '4px 12px'
            }
            break
          case PurchaseRequestStatus.Accepted:
            color = 'success'
            estilo = {
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600,
              borderRadius: '12px',
              padding: '4px 12px'
            }
            break
          case PurchaseRequestStatus.Rejected:
            color = 'error'
            estilo = {
              backgroundColor: '#ffebee',
              color: '#c62828',
              fontWeight: 600,
              borderRadius: '12px',
              padding: '4px 12px'
            }
            break
          default:
            throw new Error(`Estado desconocido: ${status}`)
        }

        const chipElement = (
          <Chip
            label={status.toUpperCase()}
            color={color}
            sx={estilo}
            icon={
              {
                [PurchaseRequestStatus.Pending]: (
                  <AccessTime fontSize='small' />
                ),
                [PurchaseRequestStatus.Accepted]: (
                  <CheckCircle fontSize='small' />
                ),
                [PurchaseRequestStatus.PreApproved]: (
                  <CheckCircle fontSize='small' />
                ),
                [PurchaseRequestStatus.Rejected]: <Cancel fontSize='small' />
              }[status]
            }
          />
        )

        if (status === PurchaseRequestStatus.Rejected) {
          const rejectionReason = cell.row.original.rejectionReason
          return (
            <Tooltip arrow title={rejectionReason || 'Sin motivo de rechazo'}>
              {chipElement}
            </Tooltip>
          )
        }

        return chipElement
      }
    },
    {
      accessorKey: 'approvalDate',
      header: 'Aprobado el',
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    {
      accessorKey: 'approver.nombre',
      header: 'Aprobado por',
      Cell: ({ cell }) => {
        const approver = cell.row.original.approver
        const approverName =
          approver && approver.nombre ? approver.nombre : 'N/A'
        return approverName
      }
    }
  ]

  return (
    <>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Solicitudes de Compra
      </Typography>

      <MaterialReactTable
        columns={columns}
        data={purchaseRequests}
        state={{ isLoading }}
        localization={MRT_Localization_ES}
        enableRowActions={true}
        renderRowActions={({ row }) => (
          <RenderRowActions
            row={row}
            queryClient={queryClient}
            onEdit={() => handleOpenEditModal(row.original)}
          />
        )}
        renderTopToolbarCustomActions={() =>
          allowCreationRequest && (
            <Grid container>
              <Button
                variant='contained'
                onClick={handleOpenModal}
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
                Nuevo Solicitud de Compra
              </Button>
              <IconButton
                onClick={() => navigate('/purchases/personnel-management')}
                title='Crear nueva solicitud de compra'
                sx={{ ml: 1 }}
              >
                <Tooltip title='Crear personal de compras'>
                  <FaUser />
                </Tooltip>
              </IconButton>
            </Grid>
          )
        }
        muiTableBodyCellProps={{
          sx: { textAlign: 'left' }
        }}
      />

      <CreatePurchaseRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        //providers={providers}
      />
      {selectedPREdit && ( // Solo renderiza si hay una PR seleccionada para editar
        <PurchaseRequestModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          existingRequest={selectedPREdit}
        />
      )}
    </>
  )
}

export default PurchaseRequest
