import React, { useMemo, useState } from 'react'
import { type MRT_Cell, type MRT_ColumnDef, type MRT_Row } from 'material-react-table'
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  Article,
  Visibility as VisibilityIcon,
  CheckCircle,
  LocalShipping,
  Refresh as RefreshIcon,
  WarningAmber
} from '@mui/icons-material' // Añadido RefreshIcon
import { useSuppliers } from 'src/hooks/purchases/useSuppliers'
import PurchasesPage from 'src/Components/Purchases/PurchasesPage'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import {
  PURCHASE_TEAL,
  PURCHASE_TEAL_HOVER
} from 'src/Components/Purchases/purchaseTableStyle'

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

type EvaluationFilter = 'required' | 'upToDate' | 'unevaluated'

const evaluationGroup = (supplier: Supplier): EvaluationFilter | null => {
  const info = getEvaluationStatusInfo(supplier)
  if (!info) return null
  if (info.needsAction) return 'required'
  return info.color === 'success' ? 'upToDate' : 'unevaluated'
}

const SuppliersTable: React.FC = () => {
  const navigate = useNavigate()

  // GET /suppliers con caché compartida (src/hooks/purchases/useSuppliers)
  const {
    data: apiResponse, // Contiene el objeto completo: { totalItems, suppliers, ... }
    isLoading,
    isError,
    error,
    isFetching, // Para la barra de progreso durante refetches o paginación
    refetch // Para el botón de refrescar
  } = useSuppliers<SuppliersAPIResponse>()

  // Extraer la lista de proveedores del objeto de respuesta
  const allSuppliers = useMemo(
    () => apiResponse?.suppliers || [],
    [apiResponse]
  )
  const [quickFilter, setQuickFilter] = useState<EvaluationFilter | null>(null)
  const toggleQuick = (value: EvaluationFilter) =>
    setQuickFilter((current) => (current === value ? null : value))

  const suppliersForTable = useMemo(
    () =>
      quickFilter
        ? allSuppliers.filter((sp) => evaluationGroup(sp) === quickFilter)
        : allSuppliers,
    [allSuppliers, quickFilter]
  )
  const countOf = (group: EvaluationFilter) =>
    allSuppliers.filter((sp) => evaluationGroup(sp) === group).length

  const columns = useMemo<MRT_ColumnDef<Supplier>[]>(
    () => [
      {
        id: 'evaluationStatus',
        header: 'Estado de evaluación',
        size: 300,
        accessorFn: (row) => getEvaluationStatusInfo(row)?.text ?? '',
        Cell: ({ row }: { row: MRT_Row<Supplier> }) => {
          const statusInfo = getEvaluationStatusInfo(row.original)
          if (!statusInfo) return null
          return (
            <Tooltip title={statusInfo.text}>
              <Chip
                label={statusInfo.text}
                color={statusInfo.color}
                size='small'
                variant='outlined'
                sx={{ maxWidth: '100%' }}
              />
            </Tooltip>
          )
        }
      },
      {
        accessorKey: 'name',
        header: 'Proveedor',
        size: 240,
        Cell: ({ cell }: { cell: MRT_Cell<Supplier> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      { accessorKey: 'taxId', header: 'NIT/CC', size: 130 },
      {
        accessorKey: 'typePerson',
        header: 'Tipo de persona',
        size: 130,
        accessorFn: (row) => (row.typePerson === 1 ? 'Natural' : 'Jurídico')
      },
      {
        accessorKey: 'contactName',
        header: 'Contacto',
        size: 200,
        accessorFn: (row) => (row.typePerson === 1 ? row.name : row.contactName)
      },
      { accessorKey: 'phone', header: 'Teléfono', size: 130 },
      { accessorKey: 'email', header: 'Correo', size: 230 }
    ],
    []
  )

  return (
    <PurchasesPage
      title='Proveedores'
      subtitle='Consulta, evalúa y mantén al día los documentos de cada proveedor'
      icon={<LocalShipping />}
      stats={
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <LmsStatCard
              variant='quiet'
              label='Evaluación requerida'
              value={countOf('required')}
              icon={<WarningAmber />}
              tone='red'
              active={quickFilter === 'required'}
              onClick={() => toggleQuick('required')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard
              variant='quiet'
              label='Evaluación al día'
              value={countOf('upToDate')}
              icon={<CheckCircle />}
              tone='green'
              active={quickFilter === 'upToDate'}
              onClick={() => toggleQuick('upToDate')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard
              variant='quiet'
              label='Sin evaluar'
              value={countOf('unevaluated')}
              icon={<Article />}
              tone='blue'
              active={quickFilter === 'unevaluated'}
              onClick={() => toggleQuick('unevaluated')}
            />
          </Grid>
        </Grid>
      }
      actions={
        <>
          <Button
            variant='outlined'
            onClick={() => refetch()}
            startIcon={
              isFetching ? <CircularProgress size={20} /> : <RefreshIcon />
            }
            disabled={isFetching}
            sx={{
              color: PURCHASE_TEAL,
              borderColor: PURCHASE_TEAL,
              '&:hover': { borderColor: PURCHASE_TEAL_HOVER }
            }}
          >
            Refrescar
          </Button>
          <Button
            variant='contained'
            onClick={() => navigate('report')}
            startIcon={<VisibilityIcon />}
            sx={{
              bgcolor: PURCHASE_TEAL,
              '&:hover': { bgcolor: PURCHASE_TEAL_HOVER }
            }}
          >
            Ver en PDF
          </Button>
        </>
      }
    >
      <DataTable
        columns={columns}
        data={suppliersForTable}
        itemLabel={['proveedor', 'proveedores']}
        searchPlaceholder='Buscar proveedores'
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Ver detalles, documentos y evaluar'>
              <IconButton
                size='small'
                aria-label={`Ver detalles de ${row.original.name}`}
                sx={{ color: '#00695C' }}
                onClick={() =>
                  navigate(`/purchases/suppliers/details/${row.original.id}`)
                }
              >
                <Article />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        // PurchasesPage ya pone el marco de la tabla
        muiTablePaperProps={{ elevation: 0 }}
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
    </PurchasesPage>
  )
}

export default SuppliersTable
