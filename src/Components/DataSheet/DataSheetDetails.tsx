import SignalLoader from 'src/Components/Common/SignalLoader'
import { Suspense, lazy, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'

import { DataSheetData } from './ListDataSheet'
import DataSheetLifecycleDialog, {
  type DataSheetLifecycleTarget
} from './list-data-sheet/DataSheetLifecycleDialog'
import { useDataSheetActions } from './list-data-sheet/useDataSheetActions'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { useDataSheet } from '@hooks/dataSheets/useDataSheets'

const DataSheetPDF = lazy(() => import('./DataSheetPDF'))

const DataSheetDetail: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false)
  const { id } = useParams<{ id: string }>()
  const { data } = useDataSheet<DataSheetData>(id)
  const dataSheet = data ?? null
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
