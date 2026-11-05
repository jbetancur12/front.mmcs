import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'

import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import { getApiErrorMessage } from 'src/utils/apiError'

export type DataSheetLifecycleMode = 'retire' | 'delete'

export interface DataSheetLifecycleTarget {
  id: number
  internalCode: string
  equipmentName: string
  serialNumber?: string
}

interface DataSheetLifecycleDialogProps {
  open: boolean
  mode: DataSheetLifecycleMode
  dataSheet: DataSheetLifecycleTarget | null
  onClose: () => void
  onRetire: (payload: { reason: string; releaseCode: boolean }) => Promise<void>
  onDelete?: (payload: { reason: string; force: boolean }) => Promise<void>
}

/**
 * Confirmación de baja o borrado definitivo de una hoja de vida. La baja pide
 * un motivo y permite liberar el código; el borrado definitivo exige escribir
 * el código del equipo porque destruye su historial.
 */
const DataSheetLifecycleDialog: React.FC<DataSheetLifecycleDialogProps> = ({
  open,
  mode,
  dataSheet,
  onClose,
  onRetire,
  onDelete
}) => {
  const [reason, setReason] = useState('')
  const [releaseCode, setReleaseCode] = useState(true)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setReleaseCode(true)
    setConfirmation('')
    setError(null)
    setLoading(false)
  }, [open, mode, dataSheet?.id])

  const isDelete = mode === 'delete'
  const codeMatches =
    Boolean(dataSheet) && confirmation.trim() === dataSheet?.internalCode
  const canSubmit =
    Boolean(dataSheet) &&
    reason.trim().length > 0 &&
    (isDelete ? codeMatches : true)

  const submit = async () => {
    if (!dataSheet || !canSubmit) return
    setLoading(true)
    setError(null)
    try {
      if (isDelete) {
        if (!onDelete) return
        await onDelete({ reason: reason.trim(), force: true })
      } else {
        await onRetire({ reason: reason.trim(), releaseCode })
      }
      onClose()
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          isDelete
            ? 'No se pudo eliminar el equipo'
            : 'No se pudo dar de baja el equipo'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={
        isDelete ? 'Eliminar equipo definitivamente' : 'Dar de baja el equipo'
      }
      subtitle={
        dataSheet
          ? `${dataSheet.internalCode} · ${dataSheet.equipmentName}`
          : undefined
      }
      submitLabel={isDelete ? 'Eliminar definitivamente' : 'Dar de baja'}
      onSubmit={submit}
      loading={loading}
      submitDisabled={!canSubmit}
      maxWidth='sm'
    >
      <Box sx={{ display: 'grid', gap: 2 }}>
        {isDelete ? (
          <Alert severity='error'>
            Esta acción borra el equipo y todo su historial de calibración,
            inspección y préstamos. No se puede deshacer.
          </Alert>
        ) : (
          <Alert severity='info'>
            El equipo deja de aparecer en alertas, cronogramas e inventario
            operativo. Su historial se conserva y puede restaurarse después.
          </Alert>
        )}

        {dataSheet?.serialNumber && (
          <Typography variant='body2' color='text.secondary'>
            Serie: {dataSheet.serialNumber}
          </Typography>
        )}

        <FormDialogSection title='Motivo'>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label='¿Por qué se retira el equipo?'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder='Equipo dado de baja, devuelto al cliente, duplicado...'
            sx={{ gridColumn: { sm: '1 / -1' } }}
          />
        </FormDialogSection>

        {!isDelete && (
          <FormControlLabel
            control={
              <Checkbox
                checked={releaseCode}
                onChange={(event) => setReleaseCode(event.target.checked)}
                sx={{ '&.Mui-checked': { color: 'primary.main' } }}
              />
            }
            label='Liberar el código interno para reutilizarlo en un equipo nuevo'
          />
        )}

        {isDelete && (
          <TextField
            fullWidth
            label={`Escribe ${dataSheet?.internalCode ?? 'el código'} para confirmar`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete='off'
          />
        )}

        {error && <Alert severity='error'>{error}</Alert>}
      </Box>
    </FormDialog>
  )
}

export default DataSheetLifecycleDialog
