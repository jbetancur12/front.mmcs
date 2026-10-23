import React, { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Chip, Link, Typography } from '@mui/material'
import {
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row
} from 'material-react-table'
import DataTable from '../Common/DataTable'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from 'src/constants/calibrationServices'
import {
  ContractedServiceRow,
  ContractedServicesResponse
} from 'src/types/customerIndicators'
import {
  TEAL_TEXT,
  formatCount,
  formatShortDate,
  formatSigned
} from './indicatorFormat'

type RowProps = { row: MRT_Row<ContractedServiceRow> }
type CellProps = { cell: MRT_Cell<ContractedServiceRow> }

interface Props {
  data: ContractedServicesResponse | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const signedColor = (value: number) =>
  value > 0 ? '#2e7d32' : value < 0 ? '#c62828' : '#6b7280'

/** Solo personal interno: ODS del año con cotización y novedades; de aquí sale la meta. */
const ContractedServicesPanel: React.FC<Props> = ({
  data,
  isLoading,
  isError,
  onRetry
}) => {
  const totals = data?.totals

  const columns = useMemo<MRT_ColumnDef<ContractedServiceRow>[]>(
    () => [
      {
        accessorKey: 'odsCode',
        header: 'ODS',
        size: 150,
        Cell: ({ row }: RowProps) => (
          <Link
            component={RouterLink}
            to={`/calibration-services/${row.original.id}`}
            underline='hover'
            sx={{ fontWeight: 700, color: TEAL_TEXT }}
          >
            {row.original.odsCode}
          </Link>
        ),
        Footer: () => (
          <Typography variant='body2' fontWeight={700}>
            {formatCount(totals?.services ?? 0)} ODS
          </Typography>
        )
      },
      {
        accessorKey: 'quoteCode',
        header: 'Cotización',
        size: 130,
        Cell: ({ cell }: CellProps) => cell.getValue<string | null>() ?? '—'
      },
      {
        accessorKey: 'odsGeneratedAt',
        header: 'Fecha ODS',
        size: 120,
        Cell: ({ cell }: CellProps) => formatShortDate(cell.getValue<string>())
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 190,
        Cell: ({ cell }: CellProps) => {
          const status = cell.getValue<ContractedServiceRow['status']>()
          return (
            <Chip
              size='small'
              variant='outlined'
              color={CALIBRATION_SERVICE_STATUS_COLORS[status]}
              label={CALIBRATION_SERVICE_STATUS_LABELS[status] ?? status}
            />
          )
        }
      },
      {
        accessorKey: 'quoted',
        header: 'Equipos cotizados',
        size: 130,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Cell: ({ cell }: CellProps) => formatCount(cell.getValue<number>()),
        Footer: () => (
          <Typography variant='body2' fontWeight={700}>
            {formatCount(totals?.quoted ?? 0)}
          </Typography>
        )
      },
      {
        accessorKey: 'adjustmentsNet',
        header: 'Novedades',
        size: 130,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Cell: ({ row }: RowProps) => {
          const { adjustmentsNet, pendingAdjustments } = row.original
          return (
            <Box>
              <Typography
                variant='body2'
                fontWeight={600}
                sx={{ color: signedColor(adjustmentsNet) }}
              >
                {formatSigned(adjustmentsNet)}
              </Typography>
              {pendingAdjustments > 0 && (
                <Typography
                  variant='caption'
                  sx={{ color: '#b45309', fontWeight: 600 }}
                >
                  {pendingAdjustments} por aprobar
                </Typography>
              )}
            </Box>
          )
        },
        Footer: () => {
          const net = totals?.adjustmentsNet ?? 0
          return (
            <Box>
              <Typography
                variant='body2'
                fontWeight={700}
                sx={{ color: signedColor(net) }}
              >
                {formatSigned(net)}
              </Typography>
              {!!totals?.pendingAdjustments && (
                <Typography
                  variant='caption'
                  sx={{ color: '#b45309', fontWeight: 600 }}
                >
                  {totals.pendingAdjustments} por aprobar
                </Typography>
              )}
            </Box>
          )
        }
      },
      {
        accessorKey: 'effective',
        header: 'Equipos finales',
        size: 130,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        muiTableFooterCellProps: { align: 'right' },
        Cell: ({ cell }: CellProps) => (
          <Typography variant='body2' fontWeight={700}>
            {formatCount(cell.getValue<number>())}
          </Typography>
        ),
        Footer: () => (
          <Typography variant='body2' fontWeight={700}>
            {formatCount(totals?.effective ?? 0)}
          </Typography>
        )
      },
      {
        id: 'documents',
        header: 'Documentos',
        size: 220,
        enableSorting: false,
        Cell: ({ row }: RowProps) => {
          const { ods, technicalProgress, adjustments } = row.original.documents
          const parts = [
            ods ? 'ODS' : null,
            technicalProgress
              ? `${technicalProgress} avance${technicalProgress > 1 ? 's' : ''}`
              : null,
            adjustments
              ? `${adjustments} novedad${adjustments > 1 ? 'es' : ''}`
              : null
          ].filter(Boolean)
          return (
            <Typography
              variant='body2'
              color={parts.length ? 'text.primary' : 'text.secondary'}
            >
              {parts.length ? parts.join(' · ') : 'Sin documentos'}
            </Typography>
          )
        }
      }
    ],
    [totals]
  )

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant='h6' fontWeight='bold'>
          Servicios contratados {data?.year ?? ''}
        </Typography>
        <Chip size='small' variant='outlined' label='Solo Metromedics' />
        {isError && (
          <Typography variant='body2' color='error' role='alert'>
            No se pudo cargar el panel.{' '}
            <Link component='button' type='button' onClick={onRetry}>
              Reintentar
            </Link>
          </Typography>
        )}
      </Box>
      <DataTable
        columns={columns}
        data={data?.services ?? []}
        itemLabel={['ODS', 'ODS']}
        searchPlaceholder='Buscar ODS o cotización'
        state={{ isLoading }}
        initialState={{
          density: 'comfortable',
          pagination: { pageSize: 10, pageIndex: 0 }
        }}
      />
    </Box>
  )
}

export default ContractedServicesPanel
