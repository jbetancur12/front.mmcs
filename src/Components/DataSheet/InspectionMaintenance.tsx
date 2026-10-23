import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { format, isValid } from 'date-fns'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import {
  Add,
  ArrowBack,
  Build,
  Delete,
  Edit,
  Engineering,
  Straighten,
  Visibility
} from '@mui/icons-material'
import { bigToast } from '../ExcelManipulation/Utils'
import {
  useDataSheet,
  useDeleteDataSheetRecord
} from '@hooks/dataSheets/useDataSheets'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'

export interface InspectionHistoryData {
  id: number
  equipmentName: string
  date: string
  brand: string
  serialNumber: string
  model: string
  serviceType: string
  internalCode: string
  activity: string
  comments: string
  verifiedBy: string
  equipmentId: number
  calibrationId?: number
  inspectionMaintenanceId?: number
}

const CALIBRATION = 'Calibración'

const outlinedButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

const InspectionMaintenance: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: dataSheetData, isLoading } = useDataSheet<
    InspectionHistoryData & { calibrationHistories?: InspectionHistoryData[] }
  >(id)
  const tableData = dataSheetData ?? null
  const records = useMemo<InspectionHistoryData[]>(
    () => dataSheetData?.calibrationHistories ?? [],
    [dataSheetData]
  )
  const calibrationCount = records.filter(
    (record) => record.activity === CALIBRATION
  ).length
  const deleteRecordMutation = useDeleteDataSheetRecord()
  const [recordToDelete, setRecordToDelete] =
    useState<InspectionHistoryData | null>(null)

  const columns = useMemo<MRT_ColumnDef<InspectionHistoryData>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Fecha',
        size: 110,
        Cell: ({ cell }: { cell: MRT_Cell<InspectionHistoryData> }) => {
          const date = new Date(cell.getValue<string>())
          return isValid(date) ? format(date, 'dd/MM/yyyy') : '—'
        }
      },
      {
        accessorKey: 'activity',
        header: 'Actividad',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<InspectionHistoryData> }) => {
          const activity = cell.getValue<string>()
          return (
            <Chip
              size='small'
              variant='outlined'
              color={activity === CALIBRATION ? 'info' : 'success'}
              label={activity}
            />
          )
        }
      },
      {
        accessorKey: 'comments',
        header: 'Comentarios',
        size: 260
      },
      {
        accessorKey: 'verifiedBy',
        header: 'Verificador',
        size: 190
      }
    ],
    []
  )

  const handleAddMaintenance = () => {
    navigate('/dataSheets/' + id + '/new-maintenance', {
      state: { tableData, type: 'maintenance', id: id }
    })
  }

  const handleAddCalibration = () => {
    navigate('/dataSheets/' + id + '/new-calibration', {
      state: { tableData, type: 'calibration', id: id }
    })
  }

  const handleView = (row: InspectionHistoryData) => {
    if (row.activity === CALIBRATION) {
      bigToast(
        'Buscar certificado de calibración en las trazabilidades',
        'success'
      )
      return
    }
    navigate(`${row.id}`)
  }

  const handleEdit = (row: InspectionHistoryData) => {
    if (row.activity === CALIBRATION) {
      navigate(`/dataSheets/${row.id}/edit-calibration`, {
        state: { edit: true, data: row, type: 'calibration', id: row.id }
      })
    } else {
      navigate(`/dataSheets/${row.id}/edit-maintenance`, {
        state: { edit: true, data: row, type: 'maintenance', id: row.id }
      })
    }
  }

  const handleConfirmDelete = async () => {
    const row = recordToDelete
    if (!row) return
    const endpoint =
      row.activity === CALIBRATION
        ? `/calibration/${row.calibrationId}`
        : `/inspectionMaintenance/${row.inspectionMaintenanceId}`
    try {
      const response = await deleteRecordMutation.mutateAsync(endpoint)
      if (response.status === 204 || response.status === 200) {
        bigToast(`${row.activity} eliminada correctamente`, 'success')
      } else {
        bigToast('Error al eliminar', 'error')
      }
    } catch (error) {
      bigToast('Error al eliminar', 'error')
    } finally {
      setRecordToDelete(null)
    }
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Inspección y mantenimiento'
        subtitle={
          tableData
            ? `${tableData.equipmentName} · ${tableData.internalCode}`
            : 'Historial de calibraciones y mantenimientos del equipo'
        }
        icon={<Engineering />}
        actions={
          <>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleAddMaintenance}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                bgcolor: '#00BFA5',
                '&:hover': { bgcolor: '#00897B' }
              }}
            >
              Agregar mantenimiento
            </Button>
            <Button
              variant='outlined'
              startIcon={<Add />}
              onClick={handleAddCalibration}
              sx={{ ...outlinedButtonSx, whiteSpace: 'nowrap' }}
            >
              Agregar calibración
            </Button>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/datasheets')}
              sx={outlinedButtonSx}
            >
              Volver
            </Button>
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Registros'
            value={records.length}
            icon={<Engineering />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Calibraciones'
            value={calibrationCount}
            icon={<Straighten />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Mantenimientos'
            value={records.length - calibrationCount}
            icon={<Build />}
            tone='green'
          />
        </Grid>
      </Grid>

      {tableData && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            borderRadius: '16px',
            border: '1px solid #e5e7eb'
          }}
        >
          <DetailSection title='Datos del equipo'>
            <DetailCell>
              <DetailField label='Nombre'>
                {tableData.equipmentName}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Código interno'>
                {tableData.internalCode}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Marca'>
                {tableData.brand || 'Sin registrar'}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Modelo'>
                {tableData.model || 'Sin registrar'}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Número de serie'>
                {tableData.serialNumber || 'Sin registrar'}
              </DetailField>
            </DetailCell>
            <DetailCell>
              <DetailField label='Tipo de servicio'>
                {tableData.serviceType || 'Sin registrar'}
              </DetailField>
            </DetailCell>
          </DetailSection>
        </Paper>
      )}

      <DataTable
        columns={columns}
        data={records}
        itemLabel={['registro', 'registros']}
        searchPlaceholder='Buscar registros'
        enableRowActions
        state={{ isLoading }}
        initialState={{ density: 'compact' }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<Engineering />}
            title='Este equipo no tiene registros'
            hint='Agrega un mantenimiento o una calibración para empezar el historial.'
          />
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip
              title={
                row.original.activity === CALIBRATION
                  ? 'Ver certificado'
                  : 'Ver'
              }
            >
              <IconButton
                size='small'
                aria-label={`Ver ${row.original.activity}`}
                sx={{ color: '#00695C' }}
                onClick={() => handleView(row.original)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar'>
              <IconButton
                size='small'
                aria-label={`Editar ${row.original.activity}`}
                sx={{ color: '#2563eb' }}
                onClick={() => handleEdit(row.original)}
              >
                <Edit fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton
                size='small'
                aria-label={`Eliminar ${row.original.activity}`}
                color='error'
                onClick={() => setRecordToDelete(row.original)}
              >
                <Delete fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />

      <ConfirmDialog
        open={Boolean(recordToDelete)}
        tone='danger'
        title={`Eliminar ${recordToDelete?.activity ?? 'registro'}`}
        message='No podrá recuperar esta información una vez eliminada.'
        confirmLabel='Eliminar'
        loading={deleteRecordMutation.isLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setRecordToDelete(null)}
      />
    </Container>
  )
}

export default InspectionMaintenance
