import SignalLoader from 'src/Components/Common/SignalLoader'
import { Suspense, lazy, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material'

import { DataSheetData } from './ListDataSheet'
import DataSheetLifecycleDialog, {
  type DataSheetLifecycleTarget
} from './list-data-sheet/DataSheetLifecycleDialog'
import { useDataSheetActions } from './list-data-sheet/useDataSheetActions'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  useDataSheet,
  useDataSheetLifecycle
} from '@hooks/dataSheets/useDataSheets'

const DataSheetPDF = lazy(() => import('./DataSheetPDF'))

interface LifecycleLog {
  id: number
  action: string
  reason?: string | null
  createdAt: string
  user?: {
    id?: number
    nombre?: string | null
    email?: string | null
  } | null
}

const ACTION_LABELS: Record<string, string> = {
  retired: 'Dado de baja',
  code_released: 'Código liberado',
  restored: 'Restaurado',
  deleted: 'Eliminado definitivamente'
}

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('es-CO') : '—'

const userLabel = (log: LifecycleLog) =>
  log.user?.nombre || log.user?.email || '—'

const DataSheetDetail: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false)
  const { id } = useParams<{ id: string }>()
  const { data } = useDataSheet<DataSheetData>(id)
  const dataSheet = data ?? null
  const { data: lifecycleLogs = [] } = useDataSheetLifecycle<LifecycleLog>(id)
  const actions = useDataSheetActions()
  const canRetire = useCan(PERMISSIONS.CALIBRATION_DATASHEET_RETIRE)
  const canDelete = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DELETE)
  const [lifecycle, setLifecycle] = useState<{
    mode: 'retire' | 'delete'
    target: DataSheetLifecycleTarget
  } | null>(null)

  if (!dataSheet) return <div>Loading...</div>

  const isRetired = Boolean(dataSheet.isRetired || dataSheet.retiredAt)

  const target: DataSheetLifecycleTarget = {
    id: Number(id),
    internalCode: dataSheet.internalCode,
    equipmentName: dataSheet.equipmentName,
    serialNumber: dataSheet.serialNumber
  }

  return (
    <>
      <Box
        display='flex'
        flexWrap='wrap'
        alignItems='center'
        justifyContent='space-between'
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant='h5' fontWeight={700}>
            {dataSheet.equipmentName}
          </Typography>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography variant='body2' color='text.secondary'>
              {dataSheet.internalCode}
            </Typography>
            {isRetired && (
              <Chip size='small' variant='outlined' label='Dado de baja' />
            )}
          </Stack>
        </Box>
        <Stack direction='row' spacing={1}>
          {isRetired ? (
            canRetire && (
              <Button
                variant='outlined'
                onClick={() =>
                  actions.restoreDataSheetFromRetirement(Number(id))
                }
              >
                Restaurar
              </Button>
            )
          ) : (
            <>
              {canRetire && (
                <Button
                  variant='outlined'
                  onClick={() => setLifecycle({ mode: 'retire', target })}
                >
                  Dar de baja
                </Button>
              )}
              {canDelete && (
                <Button
                  color='error'
                  variant='outlined'
                  onClick={() => setLifecycle({ mode: 'delete', target })}
                >
                  Eliminar definitivamente
                </Button>
              )}
            </>
          )}
        </Stack>
      </Box>

      {isRetired && (
        <Alert severity='info' sx={{ mb: 2 }}>
          <Typography fontWeight={700}>Equipo dado de baja</Typography>
          <Typography variant='body2'>
            Fecha: {formatDateTime(dataSheet.retiredAt ?? undefined)}
          </Typography>
          <Typography variant='body2'>
            Motivo: {dataSheet.retiredReason || 'Sin motivo registrado'}
          </Typography>
        </Alert>
      )}

      {lifecycleLogs.length > 0 && (
        <Paper variant='outlined' sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
          <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>
            Bitácora del equipo
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={1}>
            {lifecycleLogs.map((log) => (
              <Box key={log.id}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 0.25, sm: 1 }}
                  alignItems={{ xs: 'flex-start', sm: 'baseline' }}
                >
                  <Typography fontWeight={600}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {formatDateTime(log.createdAt)} · {userLabel(log)}
                  </Typography>
                </Stack>
                {log.reason && (
                  <Typography variant='body2' sx={{ mt: 0.25 }}>
                    Motivo: {log.reason}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {!showPreview ? (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          py={10}
        >
          <Typography variant='h6' gutterBottom>
            La vista previa de la hoja de vida se carga bajo demanda.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            El detalle del equipo ya esta disponible y el render PDF solo se
            monta cuando lo solicitas.
          </Typography>
          <Button variant='contained' onClick={() => setShowPreview(true)}>
            Ver PDF
          </Button>
        </Box>
      ) : (
        <>
          <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
            <Button variant='outlined' onClick={() => setShowPreview(false)}>
              Ocultar vista previa
            </Button>
          </Stack>
          <Suspense
            fallback={
              <Box display='flex' justifyContent='center' py={6}>
                <SignalLoader />
              </Box>
            }
          >
            <DataSheetPDF dataSheet={dataSheet} />
          </Suspense>
        </>
      )}

      <DataSheetLifecycleDialog
        open={Boolean(lifecycle)}
        mode={lifecycle?.mode ?? 'retire'}
        dataSheet={lifecycle?.target ?? null}
        onClose={() => setLifecycle(null)}
        onRetire={async ({ reason, releaseCode }) => {
          if (!lifecycle) return
          await actions.retireDataSheetWithReason(
            lifecycle.target.id,
            reason,
            releaseCode
          )
        }}
        onDelete={async ({ reason, force }) => {
          if (!lifecycle) return
          await actions.deleteDataSheetPermanently(
            lifecycle.target.id,
            reason,
            force
          )
        }}
      />
    </>
  )
}

export default DataSheetDetail
