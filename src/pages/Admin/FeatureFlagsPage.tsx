import {
  Alert,
  Box,
  Card,
  Chip,
  Container,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import { ToggleOnOutlined } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import SignalLoader from 'src/Components/Common/SignalLoader'
import {
  type FeatureFlagAdminRow,
  useFeatureFlagsAdmin,
  useSetFeatureFlag
} from 'src/hooks/useFeatureFlags'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import { brand, neutral } from 'src/theme/designTokens'

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : null

const FlagCard = ({
  flag,
  busy,
  onToggle
}: {
  flag: FeatureFlagAdminRow
  busy: boolean
  onToggle: (flag: FeatureFlagAdminRow, enabled: boolean) => void
}) => {
  const changedAt = formatDate(flag.updatedAt)
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${neutral.border}`,
        borderRadius: 2,
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
          <Typography variant='subtitle1' fontWeight={700}>
            {flag.name}
          </Typography>
          <Chip
            size='small'
            variant='outlined'
            color={flag.enabled ? 'success' : 'default'}
            label={flag.enabled ? 'Encendida' : 'Apagada'}
          />
        </Stack>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          {flag.description}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', mt: 0.5 }}
        >
          Por defecto: {flag.defaultEnabled ? 'encendida' : 'apagada'}
          {changedAt ? ` · Último cambio: ${changedAt}` : ''}
        </Typography>
      </Box>
      <Switch
        checked={flag.enabled}
        disabled={busy}
        onChange={(_, checked) => onToggle(flag, checked)}
        inputProps={{ 'aria-label': `${flag.name}: encender o apagar` }}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': { color: brand.main },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: brand.main
          }
        }}
      />
    </Card>
  )
}

/** Panel de desarrollador: enciende o apaga funciones en construcción sin editar variables ni desplegar. */
const FeatureFlagsPage = () => {
  const { data, isLoading, error } = useFeatureFlagsAdmin()
  const setFlag = useSetFeatureFlag()

  const handleToggle = (flag: FeatureFlagAdminRow, enabled: boolean) => {
    setFlag.mutate(
      { key: flag.key, enabled },
      {
        onSuccess: () =>
          notify.success(`${flag.name} ${enabled ? 'encendida' : 'apagada'}`),
        onError: (err) =>
          notify.error(
            'No se pudo cambiar la función',
            getApiErrorReason(err) ?? undefined
          )
      }
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Funciones'
        subtitle='Enciende o apaga funciones en construcción sin desplegar'
        icon={<ToggleOnOutlined />}
      />
      <Alert severity='info' sx={{ mb: 3 }}>
        El cambio aplica a todos los usuarios. El servidor deja de atender la
        función al instante; las pantallas abiertas se actualizan al volver a la
        ventana o en menos de un minuto.
      </Alert>
      {isLoading && <SignalLoader />}
      {error ? (
        <Alert severity='error'>
          {getApiErrorReason(error) ?? 'No se pudieron cargar las funciones'}
        </Alert>
      ) : null}
      <Stack spacing={2}>
        {data?.map((flag) => (
          <FlagCard
            key={flag.key}
            flag={flag}
            busy={setFlag.isLoading}
            onToggle={handleToggle}
          />
        ))}
      </Stack>
    </Container>
  )
}

export default FeatureFlagsPage
