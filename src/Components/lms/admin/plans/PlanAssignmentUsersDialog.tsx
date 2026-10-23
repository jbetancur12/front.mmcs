import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  TextField,
  Typography
} from '@mui/material'
import { ManageAccounts as EditUsersIcon } from '@mui/icons-material'
import {
  useInternalUsers,
  useUpdatePlanAssignmentUsers
} from 'src/hooks/useLms'
import { notify as appNotify } from 'src/utils/notify'
import { getStructuredApiErrorMessage } from 'src/utils/apiError'
import {
  PlanDialogHeader,
  planDialogPaperProps,
  primaryButtonSx
} from './planUi'

interface PlanAssignmentUsersDialogProps {
  open: boolean
  planName: string
  planAssignmentId: number | null
  userIds: number[]
  onClose: () => void
}

type InternalUser = { id: number; name: string; email: string }

/** Quitar o agregar personas a un destino de "usuarios concretos". */
const PlanAssignmentUsersDialog: React.FC<PlanAssignmentUsersDialogProps> = ({
  open,
  planName,
  planAssignmentId,
  userIds,
  onClose
}) => {
  const { data: users = [], isLoading } = useInternalUsers({ enabled: open })
  const updateMutation = useUpdatePlanAssignmentUsers()
  const [selected, setSelected] = useState<number[]>([])
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    if (open) {
      setSelected(userIds)
      setNotify(true)
    }
  }, [open, userIds])

  const byId = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  )
  const nameOf = (id: number) => byId.get(id)?.name || `Usuario ${id}`

  const added = selected.filter((id) => !userIds.includes(id))
  const removed = userIds.filter((id) => !selected.includes(id))
  const hasChanges = added.length > 0 || removed.length > 0

  // Incluye a quienes ya están aunque no salgan en la lista (p. ej. inactivos)
  const options = useMemo<InternalUser[]>(() => {
    const missing = userIds
      .filter((id) => !byId.has(id))
      .map((id) => ({ id, name: `Usuario ${id}`, email: '' }))
    return [...users, ...missing]
  }, [users, userIds, byId])

  const handleSave = async () => {
    if (!planAssignmentId || !hasChanges) return
    try {
      await updateMutation.mutateAsync({
        id: planAssignmentId,
        userIds: selected,
        notify
      })
      appNotify.success(
        'Destino actualizado',
        [
          added.length > 0 ? `${added.length} agregado(s)` : null,
          removed.length > 0 ? `${removed.length} quitado(s)` : null
        ]
          .filter(Boolean)
          .join(' · ')
      )
      onClose()
    } catch (error) {
      appNotify.error(
        getStructuredApiErrorMessage(error, 'No se pudo actualizar el destino.')
      )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={planDialogPaperProps}
    >
      <PlanDialogHeader
        title='Editar usuarios del destino'
        subtitle={planName}
        icon={<EditUsersIcon />}
        onClose={onClose}
      />
      <DialogContent sx={{ pt: 3 }}>
        <Autocomplete
          multiple
          loading={isLoading}
          options={options}
          value={options.filter((user) => selected.includes(user.id))}
          onChange={(_, value) => setSelected(value.map((user) => user.id))}
          getOptionLabel={(option) =>
            option.email ? `${option.name} (${option.email})` : option.name
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                size='small'
                label={option.name}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label='Usuarios'
              placeholder='Buscar por nombre o correo'
              sx={{ mt: 1 }}
            />
          )}
        />

        {hasChanges && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {removed.length > 0 && (
              <Alert severity='warning'>
                <Typography variant='body2'>
                  Se quita a <b>{removed.map(nameOf).join(', ')}</b>. Pierde
                  solo los cursos que le daba este destino; conserva sus
                  asignaciones directas, otros planes, progreso y certificados.
                </Typography>
              </Alert>
            )}
            {added.length > 0 && (
              <Alert severity='info'>
                <Typography variant='body2'>
                  Se agrega a <b>{added.map(nameOf).join(', ')}</b>. Su plazo en
                  días empieza a contar hoy.
                </Typography>
              </Alert>
            )}
            {added.length > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notify}
                    onChange={(event) => setNotify(event.target.checked)}
                  />
                }
                label='Enviar el aviso del plan a quienes se agregan'
              />
            )}
          </Box>
        )}

        {selected.length === 0 && (
          <Alert severity='error' sx={{ mt: 2 }}>
            El destino necesita al menos una persona. Para quitarlo por completo
            usa Desasignar.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={
            !hasChanges || selected.length === 0 || updateMutation.isLoading
          }
          startIcon={
            updateMutation.isLoading ? (
              <CircularProgress size={16} color='inherit' />
            ) : undefined
          }
          sx={primaryButtonSx}
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PlanAssignmentUsersDialog
