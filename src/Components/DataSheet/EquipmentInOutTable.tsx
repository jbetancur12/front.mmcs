import React, { useMemo } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import { Button, Chip, Container, Grid, Typography } from '@mui/material'
import { format, isValid } from 'date-fns'
import { ArrowBack, Download, History, SyncAlt } from '@mui/icons-material'
import { useEquipmentInOutReport } from '@hooks/dataSheets/useDataSheets'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'

interface EquipmentInOutRecord {
  id: number
  outReason: string
  outDate: string
  inDate: string | null
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string | null
  observationsOut: string | null
  registeredBy: string
  equipmentId: number
  createdAt: string
  updatedAt: string
}

type Cell = { cell: MRT_Cell<EquipmentInOutRecord> }

const buttonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

const dateText = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return isValid(date) ? format(date, 'dd/MM/yyyy') : null
}

/** Chip por significado: bueno/funciona en verde, malo/no funciona en rojo. */
const resultChip = (value?: string | null) => {
  if (!value) return '—'
  const good = value === 'Bueno' || value === 'Funciona'
  const bad = value === 'Malo' || value === 'No Funciona'
  return (
    <Chip
      size='small'
      variant='outlined'
      color={good ? 'success' : bad ? 'error' : 'default'}
      label={value}
    />
  )
}

const EquipmentInOutTable: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: inOutReport, isLoading } = useEquipmentInOutReport<{
    equipmentName: string
    internalCode: string
    equipmentInOutRecords: EquipmentInOutRecord[]
  }>(id)
  const inOutData = useMemo(
    () => inOutReport?.equipmentInOutRecords ?? [],
    [inOutReport]
  )
  const openLoans = inOutData.filter((record) => !record.inDate).length

  const columns = useMemo<MRT_ColumnDef<EquipmentInOutRecord>[]>(
    () => [
      {
        accessorKey: 'outReason',
        header: 'Motivo de salida',
        size: 190
      },
      {
        accessorKey: 'outDate',
        header: 'Salida',
        size: 120,
        Cell: ({ cell }: Cell) => dateText(cell.getValue<string>()) ?? '—'
      },
      {
        accessorKey: 'inDate',
        header: 'Entrada',
        size: 130,
        Cell: ({ cell }: Cell) => {
          const text = dateText(cell.getValue<string | null>())
          return (
            text ?? (
              <Chip
                size='small'
                variant='outlined'
                color='warning'
                label='En préstamo'
              />
            )
          )
        }
      },
      {
        accessorKey: 'visualOutInspection',
        header: 'Visual salida',
        size: 130,
        Cell: ({ cell }: Cell) => resultChip(cell.getValue<string>())
      },
      {
        accessorKey: 'visualInInspection',
        header: 'Visual entrada',
        size: 130,
        Cell: ({ cell }: Cell) => resultChip(cell.getValue<string>())
      },
      {
        accessorKey: 'operationalOutTest',
        header: 'Prueba salida',
        size: 140,
        Cell: ({ cell }: Cell) => resultChip(cell.getValue<string>())
      },
      {
        accessorKey: 'operationalInTest',
        header: 'Prueba entrada',
        size: 140,
        Cell: ({ cell }: Cell) => resultChip(cell.getValue<string>())
      },
      {
        accessorKey: 'registeredBy',
        header: 'Registrado por',
        size: 180
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Historial de entradas y salidas'
        subtitle={
          inOutReport
            ? `${inOutReport.equipmentName} · ${inOutReport.internalCode}`
            : 'Movimientos del equipo'
        }
        icon={<History />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={() => navigate(`/datasheets/${id}/in-out-report`)}
              sx={buttonSx}
            >
              Reporte PDF
            </Button>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/datasheets/${id}/in-out`)}
              sx={buttonSx}
            >
              Volver
            </Button>
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Movimientos'
            value={inOutData.length}
            icon={<SyncAlt />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='En préstamo'
            value={openLoans}
            icon={<History />}
            tone='orange'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={inOutData}
        itemLabel={['movimiento', 'movimientos']}
        searchPlaceholder='Buscar movimientos'
        state={{ isLoading }}
        initialState={{ density: 'compact' }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<History />}
            title='Este equipo no tiene movimientos'
            hint='Las salidas y entradas que se registren aparecerán aquí.'
          />
        )}
        renderDetailPanel={({ row }) => (
          <DetailSection title='Observaciones'>
            <DetailCell>
              <DetailField label='Al salir'>
                {row.original.observationsOut || 'Sin observaciones'}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Al entrar'>
                {row.original.observationsIn || 'Sin observaciones'}
              </DetailField>
            </DetailCell>
          </DetailSection>
        )}
      />
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mt: 1, display: 'block' }}
      >
        Abre una fila con la flecha para ver las observaciones de salida y
        entrada.
      </Typography>
    </Container>
  )
}

export default EquipmentInOutTable
