import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography
} from '@mui/material'
import { CloseOutlined } from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import SignalLoader from 'src/Components/Common/SignalLoader'
import { useManagementReportDetail } from 'src/hooks/useManagementReport'
import { brand, neutral } from 'src/theme/designTokens'
import type {
  ManagementReportDetailColumn,
  ManagementReportDetailRow
} from 'src/types/managementReport'
import { getApiErrorMessage } from 'src/utils/apiError'
import { formatInt } from 'src/utils/formatNumber'

const PAGE_SIZE = 25

const formatDate = (value: unknown) =>
  typeof value === 'string' && value
    ? new Date(value).toLocaleDateString('es-CO')
    : '—'

const formatMoney = (value: unknown) =>
  typeof value === 'number'
    ? value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      })
    : '—'

const buildColumns = (
  columns: ManagementReportDetailColumn[]
): MRT_ColumnDef<ManagementReportDetailRow>[] =>
  columns.map((column): MRT_ColumnDef<ManagementReportDetailRow> => {
    const right = column.type === 'money' || column.type === 'number'
    return {
      id: column.key,
      header: column.label,
      accessorFn: (row) => String(row[column.key] ?? ''),
      Cell: ({ row }) => {
        const value = row.original[column.key]
        if (column.type === 'date') return formatDate(value)
        if (column.type === 'money') return formatMoney(value)
        if (column.type === 'number') {
          return typeof value === 'number' ? formatInt(value) : '—'
        }
        const text = value === null || value === undefined ? '—' : String(value)
        // El código lleva a la pantalla real del registro
        if (column.key === 'code' && row.original.link) {
          return (
            <Link
              component={RouterLink}
              to={row.original.link}
              underline='hover'
              sx={{ color: brand.ink, fontWeight: 600 }}
            >
              {text}
            </Link>
          )
        }
        if (
          column.key === 'customer' &&
          row.original.link &&
          !row.original.code
        ) {
          return (
            <Link
              component={RouterLink}
              to={row.original.link}
              underline='hover'
              sx={{ color: brand.ink, fontWeight: 600 }}
            >
              {text}
            </Link>
          )
        }
        return text
      },
      ...(right
        ? {
            muiTableHeadCellProps: { align: 'right' as const },
            muiTableBodyCellProps: {
              align: 'right' as const,
              sx: { whiteSpace: 'nowrap' }
            }
          }
        : {})
    }
  })

interface DetailDialogProps {
  open: boolean
  code: string | null
  month: string
  profile: 'full' | 'no_amounts'
  onClose: () => void
}

/**
 * Lista de registros detrás de un número del reporte: las mismas consultas del
 * indicador, con total que coincide con la tarjeta, búsqueda y paginación en el
 * servidor, y enlace de cada fila a su pantalla.
 */
const DetailDialog = ({
  open,
  code,
  month,
  profile,
  onClose
}: DetailDialogProps) => {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search)
      setPageIndex(0)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (open) {
      setSearch('')
      setDebounced('')
      setPageIndex(0)
    }
  }, [open, code])

  const { data, isLoading, isError, error } = useManagementReportDetail({
    month,
    profile,
    code,
    page: pageIndex + 1,
    search: debounced,
    enabled: open && Boolean(code)
  })

  const columns = useMemo(() => buildColumns(data?.columns ?? []), [data])
  const totalText = data
    ? [
        `${formatInt(data.totals.count)} registros`,
        data.totals.valor !== undefined ? formatMoney(data.totals.valor) : null,
        data.totals.summary ?? null
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant='h6' component='span' fontWeight={700}>
          {data?.title ?? 'Lista del indicador'}
        </Typography>
        {data && (
          <Typography variant='body2' color='text.secondary'>
            {data.periodLabel}
          </Typography>
        )}
        <IconButton
          aria-label='Cerrar la lista'
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <SignalLoader />
        ) : isError ? (
          <Alert severity='error'>
            {getApiErrorMessage(error, 'No se pudo cargar la lista')}
          </Alert>
        ) : data ? (
          <>
            <Stack
              direction='row'
              spacing={1}
              alignItems='baseline'
              sx={{ mb: 1.5 }}
            >
              <Typography variant='subtitle1' fontWeight={700}>
                {data.totals.label}:
              </Typography>
              <Typography
                variant='subtitle1'
                fontWeight={700}
                sx={{ color: brand.ink }}
              >
                {totalText}
              </Typography>
            </Stack>
            <Box sx={{ overflowX: 'auto' }}>
              <DataTable
                key={`${data.code}-${profile}`}
                columns={columns}
                data={data.rows}
                manualFiltering
                manualPagination
                enableSorting={false}
                enableColumnFilters={false}
                enableStickyHeader={false}
                rowCount={data.count}
                state={{
                  globalFilter: search,
                  pagination: { pageIndex, pageSize: PAGE_SIZE }
                }}
                onGlobalFilterChange={(value: string | undefined) =>
                  setSearch(value ?? '')
                }
                onPaginationChange={(updater) => {
                  const next =
                    typeof updater === 'function'
                      ? updater({ pageIndex, pageSize: PAGE_SIZE })
                      : updater
                  setPageIndex(next.pageIndex)
                }}
                muiTablePaginationProps={{ rowsPerPageOptions: [PAGE_SIZE] }}
                muiTablePaperProps={{
                  elevation: 0,
                  sx: {
                    borderRadius: '12px',
                    border: `1px solid ${neutral.border}`,
                    overflow: 'hidden'
                  }
                }}
                getRowId={(row, index) =>
                  `${row.code ?? row.customer}-${index}`
                }
              />
            </Box>
            {data.count === 0 && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {data.searched
                  ? 'Ningún registro coincide con la búsqueda.'
                  : 'No hay registros en esta lista.'}
              </Typography>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default DetailDialog
