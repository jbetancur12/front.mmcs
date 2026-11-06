import { Close, DeleteForever } from '@mui/icons-material'
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material'
import { type MRT_ColumnDef } from 'material-react-table'
import React, { useMemo } from 'react'

import DataTable from 'src/Components/Common/DataTable'

import { useDeletedDataSheets } from './useDataSheets'

interface DeletedLog {
  id: number
  internalCode: string
  reason?: string | null
  createdAt: string
  user?: {
    id?: number
    nombre?: string | null
    email?: string | null
  } | null
  snapshot?: {
    equipmentName?: string | null
    serialNumber?: string | null
    serviceType?: string | null
    counts?: {
      calibrations?: number
      inspections?: number
      history?: number
      inOuts?: number
    } | null
  } | null
}

interface DeletedDataSheetsDialogProps {
  open: boolean
  onClose: () => void
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString('es-CO') : '—'

const userLabel = (log: DeletedLog) =>
  log.user?.nombre || log.user?.email || '—'

/**
 * Bitácora de equipos eliminados definitivamente. El equipo ya no existe en la
 * tabla, pero el snapshot de la baja conserva sus datos y el motivo.
 */
const DeletedDataSheetsDialog: React.FC<DeletedDataSheetsDialogProps> = ({
  open,
  onClose
}) => {
  const { data: logs = [], isLoading } = useDeletedDataSheets()

  const columns = useMemo<MRT_ColumnDef<DeletedLog>[]>(
    () => [
      {
        accessorKey: 'internalCode',
        header: 'Código',
        size: 120
      },
      {
        id: 'equipo',
        header: 'Equipo',
        accessorFn: (row) => row.snapshot?.equipmentName ?? '',
        size: 220
      },
      {
        id: 'serie',
        header: 'Serie',
        accessorFn: (row) => row.snapshot?.serialNumber ?? '',
        size: 160
      },
      {
        id: 'tipo',
        header: 'Tipo de servicio',
        accessorFn: (row) => row.snapshot?.serviceType ?? '',
        size: 180
      },
      {
        accessorKey: 'reason',
        header: 'Motivo',
        size: 260,
        Cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.reason || 'Sin motivo registrado'}
          </Typography>
        )
      },
      {
        id: 'usuario',
        header: 'Eliminado por',
        accessorFn: userLabel,
        size: 200
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        size: 170,
        Cell: ({ row }) => (
          <Typography variant='body2'>
            {formatDate(row.original.createdAt)}
          </Typography>
        )
      },
      {
        id: 'historial',
        header: 'Historial',
        size: 150,
        Cell: ({ row }) => {
          const counts = row.original.snapshot?.counts
          if (!counts) return <Typography variant='body2'>—</Typography>
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip
                size='small'
                variant='outlined'
                label={`${counts.calibrations ?? 0} cal.`}
              />
              <Chip
                size='small'
                variant='outlined'
                label={`${counts.inspections ?? 0} insp.`}
              />
            </Box>
          )
        }
      }
    ],
    []
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box>
          <Typography variant='h6' component='span' fontWeight={700}>
            Equipos eliminados
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Bitácora de equipos borrados definitivamente. Esta información no se
            puede restaurar.
          </Typography>
        </Box>
        <IconButton aria-label='Cerrar' onClick={onClose} edge='end'>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <DataTable<DeletedLog>
          columns={columns}
          data={logs}
          itemLabel={['equipo eliminado', 'equipos eliminados']}
          searchPlaceholder='Buscar por código, equipo, serie o motivo'
          state={{ isLoading }}
          enableRowActions={false}
          initialState={{
            pagination: { pageIndex: 0, pageSize: 10 },
            density: 'compact'
          }}
          renderEmptyRowsFallback={() => (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <DeleteForever
                sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant='body2' color='text.secondary'>
                Todavía no hay equipos eliminados definitivamente.
              </Typography>
            </Box>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}

export default DeletedDataSheetsDialog
