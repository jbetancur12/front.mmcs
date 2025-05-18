import React, { useMemo } from 'react' // useEffect y useState ya no son necesarios para el fetch principal
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useNavigate } from 'react-router-dom'
import {
  Article,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material' // Añadido RefreshIcon
import { useQuery } from 'react-query'

// Interfaz para un proveedor, incluyendo los nuevos campos para el estado de evaluación
interface Supplier {
  id: number
  name: string
  taxId: string
  typePerson: 0 | 1
  contactName: string
  email: string
  phone: string
  // Campos que ahora envía el backend para determinar el estado de evaluación
  lastEvaluationDate?: string | null // Formato "YYYY-MM-DD"
  hasActivityInLast6Months?: boolean
  lastPurchaseDate?: string | null // Formato "YYYY-MM-DD" o ISO completo
  // Otros campos que pueda tener tu proveedor...
  // applyRetention?: boolean; // Si lo envías desde el backend
  // purchaseType?: 1 | 2;   // Si lo envías desde el backend
}

// Nueva interfaz para la respuesta completa del API de proveedores
interface SuppliersAPIResponse {
  totalItems: number
  suppliers: Supplier[] // El array de proveedores está aquí
  totalPages: number
  currentPage: number
}

const getEvaluationStatusInfo = (
  supplier: Supplier
): {
  text: string
  color: 'success' | 'warning' | 'error' | 'info'
  needsAction: boolean
} | null => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalizar 'hoy'

  // Fecha límite: hace 6 meses exactos desde hoy
  const sixMonthsAgoCutoff = new Date(today)
  sixMonthsAgoCutoff.setMonth(today.getMonth() - 6)

  const parseDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null
    const datePart = dateString.substring(0, 10)
    const parts = datePart.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day)
      }
    }
    const parsedDate = new Date(dateString)
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0)
      return parsedDate
    }
    return null
  }

  const lastEvalDate = parseDate(supplier.lastEvaluationDate)
  const lastPurchaseDate = parseDate(supplier.lastPurchaseDate)
  const isActiveRecently = supplier.hasActivityInLast6Months === true

  // --- Escenario 1: El proveedor TIENE evaluaciones previas ---
  if (lastEvalDate) {
    if (lastEvalDate < sixMonthsAgoCutoff) {
      // La última evaluación tiene más de 6 meses (está vencida)
      if (isActiveRecently) {
        // VENCIDA Y ACTIVO RECIENTEMENTE: Alerta CRÍTICA
        return {
          text: 'Evaluación REQUERIDA (Vencida, Activo)',
          color: 'error',
          needsAction: true
        }
      } else {
        // VENCIDA pero INACTIVO RECIENTEMENTE: Alerta menos crítica (según Nota 10)
        return {
          text: 'Eval. Pendiente (Inactivo)',
          color: 'warning',
          needsAction: true
        }
      }
    } else {
      // La última evaluación está DENTRO de los últimos 6 meses (al día)
      return { text: 'Evaluación Al Día', color: 'success', needsAction: false }
    }
  }
  // --- Escenario 2: El proveedor NO tiene evaluaciones previas ---
  else {
    if (lastPurchaseDate) {
      // Tiene historial de compras
      if (lastPurchaseDate < sixMonthsAgoCutoff) {
        // La última (y potencialmente primera) compra fue hace MÁS de 6 meses,
        // y nunca ha sido evaluado.
        // Si además está activo recientemente (compró de nuevo después de esa compra antigua), es aún más crítico.
        // Si no está activo recientemente, pero su única actividad fue >6m, también es una alerta.
        // La lógica aquí es que el "reloj de 6 meses" para la primera evaluación comenzó con esa compra antigua.
        return {
          text: 'Requiere 1RA EVALUACIÓN (Actividad >6m sin eval.)',
          color: 'error',
          needsAction: true
        }
      } else {
        // La última compra fue DENTRO de los últimos 6 meses.
        // Nunca ha sido evaluado. Aún no han pasado 6 meses desde esta última (quizás primera) compra.
        // Consideramos esto "normal" o "próxima evaluación" si está activo.
        return isActiveRecently
          ? {
              text: 'Activo Reciente (1ra Eval. Próxima)',
              color: 'info',
              needsAction: false
            }
          : {
              text: 'Sin Evaluar (Inactivo <6m)',
              color: 'info',
              needsAction: false
            } // Inactivo pero su última compra fue <6m
      }
    } else {
      // Sin evaluaciones previas Y SIN historial de compras registrado.
      // Si el flag `isActiveRecently` es true, significa que hay actividad que no es una compra (raro) o un nuevo proveedor
      // que aún no registra su primera compra en `lastPurchaseDate` pero sí en el flag de actividad.
      if (isActiveRecently) {
        return {
          text: 'Requiere 1RA EVALUACIÓN (Activo sin compras registradas)',
          color: 'warning',
          needsAction: true
        }
      }
      return {
        text: 'Sin Evaluar (Nuevo/Sin Compras)',
        color: 'info',
        needsAction: false
      }
    }
  }
}

const SuppliersTable: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  // Refactorizado para usar useQuery y la nueva interfaz de respuesta
  const {
    data: apiResponse, // Contiene el objeto completo: { totalItems, suppliers, ... }
    isLoading,
    isError,
    error,
    isFetching, // Para la barra de progreso durante refetches o paginación
    refetch // Para el botón de refrescar
  } = useQuery<SuppliersAPIResponse, Error>(
    'suppliersList', // Clave de la query
    async () => {
      // Aquí podrías pasar parámetros de paginación si implementas paginación del lado del servidor
      // const params = { page: pageIndex + 1, limit: pageSize, search: globalFilterValue };
      const response = await axiosPrivate.get<SuppliersAPIResponse>(
        '/suppliers' /*, { params }*/
      )
      return response.data
    },
    {
      // Opciones de React Query
      // keepPreviousData: true, // Útil para paginación server-side para evitar parpadeos
    }
  )

  // Extraer la lista de proveedores del objeto de respuesta
  const suppliersForTable = apiResponse?.suppliers || []

  const columns = useMemo<MRT_ColumnDef<Supplier>[]>(
    () => [
      {
        id: 'evaluationStatus',
        header: 'Estado Evaluación',
        size: 200,
        muiTableBodyCellProps: { align: 'center' },
        muiTableHeadCellProps: { sx: { textAlign: 'center' } },
        Cell: ({ row }) => {
          const statusInfo = getEvaluationStatusInfo(row.original)
          if (!statusInfo) return null
          return (
            <Chip
              label={statusInfo.text}
              color={statusInfo.color}
              size='small'
              variant={statusInfo.needsAction ? 'filled' : 'outlined'}
              sx={{ minWidth: 160, textTransform: 'capitalize' }}
            />
          )
        }
      },
      { accessorKey: 'name', header: 'Nombre', size: 200 },
      { accessorKey: 'taxId', header: 'NIT/CC', size: 120 },
      {
        accessorKey: 'typePerson',
        header: 'Tipo Persona',
        size: 120,
        accessorFn: (row) => (row.typePerson === 1 ? 'Natural' : 'Jurídico') // Corregido 0 para Jurídico
      },
      {
        accessorKey: 'contactName',
        header: 'Contacto',
        size: 200,
        accessorFn: (row) => (row.typePerson === 1 ? row.name : row.contactName) // Corregido
      },
      { accessorKey: 'phone', header: 'Teléfono', size: 120 },
      { accessorKey: 'email', header: 'Correo', size: 200 }
    ],
    []
  )

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h5'>Lista de Proveedores</Typography>
        <Box>
          <Button
            variant='outlined'
            onClick={() => refetch()} // Botón para refrescar datos
            startIcon={
              isFetching ? <CircularProgress size={20} /> : <RefreshIcon />
            }
            disabled={isFetching}
            sx={{ mr: 1 }}
          >
            Refrescar
          </Button>
          <Button
            variant='contained'
            onClick={() => navigate('report')}
            startIcon={<VisibilityIcon />}
            sx={{
              backgroundColor: '#9CF08B',
              fontWeight: 'bold',
              color: '#2D4A27',
              '&:hover': { backgroundColor: '#6DC662' }
            }}
          >
            Ver en PDF
          </Button>
        </Box>
      </Box>

      <MaterialReactTable
        localization={MRT_Localization_ES}
        columns={columns}
        data={suppliersForTable} // Usar la lista extraída
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Ver Detalles, Documentos y Evaluar'>
              <IconButton
                color='primary'
                onClick={() =>
                  navigate(`/purchases/suppliers/details/${row.original.id}`)
                }
              >
                <Article />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        muiTableBodyCellProps={{ sx: { textAlign: 'left' } }}
        initialState={{
          density: 'compact',
          pagination: { pageSize: 10, pageIndex: 0 }, // Paginación del lado del cliente por defecto
          sorting: [{ id: 'name', desc: false }]
        }}
        // Props para conectar el estado de React Query con MRT
        state={{
          isLoading: isLoading, // Para el spinner de carga inicial
          showProgressBars: isFetching // Para la barra de progreso en refetches
          // Si implementas paginación/filtros del lado del servidor, aquí pasarías esos estados
        }}
        // Si quieres paginación del lado del servidor, necesitarías:
        // manualPagination
        // rowCount={apiResponse?.totalItems || 0}
        // onPaginationChange={ (updater) => { /* actualizar estado de paginación y re-llamar query */ }}
        muiToolbarAlertBannerProps={
          isError
            ? {
                // Mostrar banner de error de MRT
                color: 'error',
                children: error?.message || 'Error cargando los datos.'
              }
            : undefined
        }
      />
    </>
  )
}

export default SuppliersTable
