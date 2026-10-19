import React, { useMemo, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import {
  AccessTime,
  Add,
  Cancel,
  CheckCircle,
  ErrorOutline,
  ListAlt,
  ShoppingCart,
  ShoppingCartCheckout
} from '@mui/icons-material'
import { PurchaseRequest as IPurchaseRequest } from './Types'
import { PurchaseRequestStatus } from './Enums'
import { differenceInDays, format } from 'date-fns'

import RenderRowActions from 'src/Components/Purchases/RenderRowActions'
import { useQueryClient } from 'react-query'
import {
  usePurchaseRequests,
  useSetInitialPurchaseRequestId
} from 'src/hooks/purchases/usePurchaseRequests'
import { useSuppliers } from 'src/hooks/purchases/useSuppliers'
import Swal from 'sweetalert2'
import { useCan } from '@utils/functions'
import { PurchaseRequestModal } from 'src/Components/Purchases/purchase-request-modal'
import { useNavigate } from 'react-router-dom'
import { FaUser } from 'react-icons/fa'

// Import the new generic solution
import { usePersistentTableState } from '../../hooks/usePersistentTableState'
import {
  createTableStateHandlers,
  generateTableId,
  getModuleTableConfig
} from '../../utils/tableStateUtils'
import ActiveFiltersIndicator from '../../Components/Table/ActiveFiltersIndicator'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import {
  PURCHASE_TEAL,
  PURCHASE_TEAL_HOVER,
  purchaseTableStyle
} from 'src/Components/Purchases/purchaseTableStyle'

type QuickFilter = 'all' | 'pending' | 'toOrder' | 'late'

import { PERMISSIONS } from 'src/constants/permissions'

const PurchaseRequest: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const allowCreationRequest = useCan(PERMISSIONS.PURCHASES_REQUEST_CREATE)

  // Use the new generic persistent table state
  const tableConfig = getModuleTableConfig('purchases')
  const persistentTableState = usePersistentTableState({
    tableId: generateTableId('purchases', 'purchase-requests'),
    persistedProperties: tableConfig.persistedProperties,
    defaultState: {
      pagination: {
        pageIndex: 0,
        pageSize: tableConfig.defaultPageSize
      }
    }
  })

  // Create standardized event handlers
  const tableHandlers = createTableStateHandlers(persistentTableState)
  // Uso de react-query para obtener los datos
  const { data, isLoading } = usePurchaseRequests()
  // Precarga el listado de proveedores (caché compartida con /suppliers)
  useSuppliers()
  const setInitialId = useSetInitialPurchaseRequestId()

  const allRequests = data?.purchaseRequests ?? []
  const totalRecords = data?.count ?? 0
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  // Aprobadas (o pre-aprobadas) que todavía no tienen orden de compra
  const needsOrder = (r: IPurchaseRequest) =>
    (r.status === PurchaseRequestStatus.PreApproved ||
      r.status === PurchaseRequestStatus.Accepted) &&
    !r.hasOrder
  const isLate = (r: IPurchaseRequest) =>
    needsOrder(r) && differenceInDays(new Date(), new Date(r.createdAt)) > 7

  const counts = useMemo(
    () => ({
      pending: allRequests.filter(
        (r) => r.status === PurchaseRequestStatus.Pending
      ).length,
      toOrder: allRequests.filter(needsOrder).length,
      late: allRequests.filter(isLate).length
    }),
    [allRequests]
  )

  const purchaseRequests = useMemo(() => {
    switch (quickFilter) {
      case 'pending':
        return allRequests.filter(
          (r) => r.status === PurchaseRequestStatus.Pending
        )
      case 'toOrder':
        return allRequests.filter(needsOrder)
      case 'late':
        return allRequests.filter(isLate)
      default:
        return allRequests
    }
  }, [allRequests, quickFilter])

  const toggleQuick = (value: QuickFilter) =>
    setQuickFilter((current) => (current === value ? 'all' : value))

  const [modalOpen, setModalOpen] = useState(false)
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
        await setInitialId.mutateAsync(initialId)
        Swal.fire(
          '¡Configurado!',
          'El número inicial ha sido establecido.',
          'success'
        )
        // La mutación invalida 'purchaseRequests' para refrescar el count
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
    {
      accessorKey: 'purchaseCode',
      header: 'Código',
      size: 150,
      Cell: ({ cell }) => (
        <Typography variant='body2' fontWeight={600} noWrap>
          {cell.getValue<string>()}
        </Typography>
      )
    },
    {
      accessorKey: 'elaborationDate',
      header: 'Elaborada el',
      size: 120,
      Cell: ({ cell }) => {
        const date = cell.getValue<string>()
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    },
    {
      accessorKey: 'applicantName',
      header: 'Solicitante',
      size: 230,
      Cell: ({ cell }) => {
        const name = cell.getValue<string>() ?? ''
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
          .toUpperCase()
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: PURCHASE_TEAL,
                width: 28,
                height: 28,
                fontSize: 12
              }}
            >
              {initials}
            </Avatar>
            <Typography variant='body2' noWrap>
              {name}
            </Typography>
          </Box>
        )
      }
    },
    {
      accessorKey: 'purchaseType',
      header: 'Tipo',
      size: 80,
      filterVariant: 'select',
      filterSelectOptions: ['I', 'II'],
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue<string>()}
          size='small'
          variant='outlined'
          sx={{ minWidth: 36, fontWeight: 600 }}
        />
      )
    },
    // En tu archivo de columnas
    {
      accessorKey: 'status',
      header: 'Estado',
      size: 230,
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
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={color}
            variant='outlined'
            sx={{ ...estilo, backgroundColor: 'transparent' }}
            size='small'
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

        const request = cell.row.original
        if (isLate(request)) {
          const days = differenceInDays(new Date(), new Date(request.createdAt))
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {chipElement}
              <Chip
                label={`Sin orden · ${days} días`}
                size='small'
                color='warning'
                variant='outlined'
              />
            </Box>
          )
        }

        return chipElement
      }
    },
    {
      accessorKey: 'approvalDate',
      header: 'Aprobada el',
      size: 120,
      Cell: ({ cell }) => {
        const date = cell.getValue() as string
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      }
    }
    // {
    //   accessorKey: 'approver.nombre',
    //   header: 'Aprobado por',
    //   Cell: ({ cell }) => {
    //     const approver = cell.row.original.approver
    //     const approverName =
    //       approver && approver.nombre ? approver.nombre : 'N/A'
    //     return approverName
    //   }
    // }
  ]

  return (
    <>
      <PurchasesPage
        title='Solicitudes de compra'
        subtitle='Pide, aprueba y haz seguimiento de lo que necesita cada área'
        icon={<ShoppingCart />}
        actions={
          allowCreationRequest && (
            <>
              <Tooltip title='Crear personal de compras'>
                <IconButton
                  onClick={() => navigate('/purchases/personnel-management')}
                  sx={{ color: PURCHASE_TEAL }}
                >
                  <FaUser />
                </IconButton>
              </Tooltip>
              <Button
                variant='contained'
                onClick={handleOpenModal}
                startIcon={<Add />}
                sx={{
                  bgcolor: PURCHASE_TEAL,
                  '&:hover': { bgcolor: PURCHASE_TEAL_HOVER }
                }}
              >
                Nueva solicitud
              </Button>
            </>
          )
        }
        stats={
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Todas'
                value={totalRecords}
                icon={<ListAlt />}
                tone='teal'
                active={quickFilter === 'all'}
                onClick={() => setQuickFilter('all')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Pendientes de aprobar'
                value={counts.pending}
                icon={<AccessTime />}
                tone='orange'
                active={quickFilter === 'pending'}
                onClick={() => toggleQuick('pending')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Por generar orden'
                value={counts.toOrder}
                icon={<ShoppingCartCheckout />}
                tone='blue'
                active={quickFilter === 'toOrder'}
                onClick={() => toggleQuick('toOrder')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Sin orden hace más de 7 días'
                value={counts.late}
                icon={<ErrorOutline />}
                tone='red'
                active={quickFilter === 'late'}
                onClick={() => toggleQuick('late')}
              />
            </Grid>
          </Grid>
        }
      >
        <ActiveFiltersIndicator
          tableState={persistentTableState.tableState}
          onClearFilters={persistentTableState.clearFilters}
          showDetails={true}
        />

        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={purchaseRequests}
          state={{
            isLoading,
            ...tableHandlers.state
          }}
          onColumnFiltersChange={tableHandlers.onColumnFiltersChange}
          onSortingChange={tableHandlers.onSortingChange}
          onPaginationChange={tableHandlers.onPaginationChange}
          enableRowActions={true}
          enablePinning
          initialState={{
            density: 'compact',
            columnPinning: { right: ['mrt-row-actions'] }
          }}
          muiSearchTextFieldProps={{
            ...purchaseTableStyle.muiSearchTextFieldProps,
            placeholder: 'Buscar solicitudes...'
          }}
          renderRowActions={({ row }) => (
            <RenderRowActions
              row={row}
              queryClient={queryClient}
              onEdit={() => handleOpenEditModal(row.original)}
            />
          )}
          muiTableBodyRowProps={({ row }) =>
            isLate(row.original)
              ? {
                sx: {
                  backgroundColor: 'rgba(255, 193, 7, 0.15)',
                  '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.25)' }
                }
              }
              : {}
          }
          renderTopToolbarCustomActions={() => (
            <ActiveFiltersIndicator
              tableState={persistentTableState.tableState}
              onClearFilters={persistentTableState.clearFilters}
              compact={true}
            />
          )}
        />
      </PurchasesPage>

      <PurchaseRequestModal
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
