import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CampaignOutlined, Sync } from '@mui/icons-material'
import {
  techErrorMessage,
  useAlertMatches,
  useRematchAlerts,
  useUpdateAlertMatch
} from '@hooks/useTechManagement'
import { InvimaAlertMatch } from 'src/types/techManagement'
import {
  ALERT_TYPE_LABELS,
  formatDate,
  MATCH_STATUS,
  MATCHED_BY_LABELS,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  StatusChip
} from './techUi'
import { useTechAccess } from './useTechAccess'

const cardSx = { borderRadius: '16px', border: '1px solid #e5e7eb' }

/** Alertas, recalls e informes de seguridad del INVIMA que cruzan con equipos del inventario, y su gestión. */
const AlertMatchesTab = ({ customerId }: { customerId: string }) => {
  const access = useTechAccess(customerId)
  const [status, setStatus] = useState('pendiente')
  const [managing, setManaging] = useState<InvimaAlertMatch | null>(null)
  const [nextStatus, setNextStatus] = useState('gestionada')
  const [actionTaken, setActionTaken] = useState('')
  const { data, isLoading } = useAlertMatches(customerId, { status: status || undefined, pageSize: 200 })
  const rematch = useRematchAlerts(customerId)
  const update = useUpdateAlertMatch(customerId)

  const openManage = (match: InvimaAlertMatch) => {
    setManaging(match)
    setNextStatus(match.status === 'pendiente' ? 'gestionada' : match.status)
    setActionTaken(match.actionTaken || '')
  }

  const handleRematch = async () => {
    try {
      const result = await rematch.mutateAsync()
      notifySuccess(result.created ? `${result.created} cruce(s) nuevo(s)` : 'No hay cruces nuevos')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudieron cruzar las alertas'))
    }
  }

  const handleSave = async () => {
    if (!managing) return
    try {
      await update.mutateAsync({ id: managing.id, payload: { status: nextStatus, actionTaken } })
      notifySuccess('Alerta actualizada')
      setManaging(null)
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo actualizar la alerta'))
    }
  }

  return (
    <Stack spacing={3}>
      <Box display='flex' gap={1.5} flexWrap='wrap' alignItems='center'>
        <TextField select size='small' label='Estado' value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value=''>Todas</MenuItem>
          {Object.entries(MATCH_STATUS).map(([value, meta]) => (
            <MenuItem key={value} value={value}>
              {meta.label}
            </MenuItem>
          ))}
        </TextField>
        {access.canManageInventory && (
          <Button startIcon={<Sync />} onClick={handleRematch} disabled={rematch.isLoading} sx={{ textTransform: 'none' }}>
            Volver a cruzar con el inventario
          </Button>
        )}
      </Box>

      {isLoading && <CircularProgress />}
      {!isLoading && !data?.items.length && (
        <Alert severity='success' icon={<CampaignOutlined />}>
          No hay alertas del INVIMA {status === 'pendiente' ? 'pendientes ' : ''}que crucen con el inventario.
        </Alert>
      )}

      {data?.items.map((match) => (
        <Card key={match.id} elevation={0} sx={cardSx}>
          <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box flex={1} minWidth={260}>
              <Box display='flex' gap={1} alignItems='center' flexWrap='wrap' mb={0.5}>
                <StatusChip {...MATCH_STATUS[match.status]} />
                {match.alert && <StatusChip label={ALERT_TYPE_LABELS[match.alert.type]} color='info' />}
                <Typography variant='caption' color='text.secondary'>
                  Cruce por {MATCHED_BY_LABELS[match.matchedBy] || match.matchedBy}
                </Typography>
              </Box>
              <Typography fontWeight={600}>
                {match.alert?.code} · {match.alert?.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Publicada el {formatDate(match.alert?.publishedAt)}
                {match.alert?.affectedLots && ` · Lotes: ${match.alert.affectedLots}`}
                {match.alert?.url && (
                  <>
                    {' · '}
                    <Link href={match.alert.url} target='_blank' rel='noopener noreferrer'>
                      Ver en el INVIMA
                    </Link>
                  </>
                )}
              </Typography>
              {match.alert?.description && (
                <Typography variant='body2' mt={1}>
                  {match.alert.description}
                </Typography>
              )}
              <Typography variant='body2' mt={1}>
                <strong>Equipo:</strong>{' '}
                {[match.equipment?.name, match.equipment?.brand, match.equipment?.model, match.equipment?.serie && `Serie ${match.equipment.serie}`, match.equipment?.lot && `Lote ${match.equipment.lot}`, match.equipment?.sede]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
              {match.actionTaken && (
                <Typography variant='body2' color='text.secondary' mt={0.5}>
                  <strong>Acción tomada:</strong> {match.actionTaken}
                </Typography>
              )}
            </Box>
            {access.canWriteSurveillance && (
              <Box>
                <Button variant='outlined' size='small' onClick={() => openManage(match)} sx={{ textTransform: 'none' }}>
                  Gestionar
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!managing} onClose={() => setManaging(null)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle
          sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
        >
          Gestionar alerta
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Stack spacing={2}>
            <TextField select size='small' label='Estado' value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              <MenuItem value='gestionada'>Gestionada</MenuItem>
              <MenuItem value='no_aplica'>No aplica (p. ej. otro lote)</MenuItem>
              <MenuItem value='pendiente'>Pendiente</MenuItem>
            </TextField>
            <TextField
              multiline
              minRows={3}
              label='Acción tomada o por qué no aplica'
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setManaging(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={update.isLoading} sx={primaryButtonSx}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default AlertMatchesTab
