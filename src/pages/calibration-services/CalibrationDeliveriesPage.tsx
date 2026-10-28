import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import SignalLoader from 'src/Components/Common/SignalLoader'
import FormDialog from 'src/Components/Common/FormDialog'
import { notify } from 'src/utils/notify'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CalibrationDeliveryCard,
  useCalibrationDeliveries,
  useCalibrationDeliveryMutations
} from '../../hooks/useCalibrationDeliveries'
import { getApiErrorMessage } from '../../utils/apiError'

type TabKey = 'available' | 'inTransit' | 'delivered'

const formatWhen = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : ''

const matches = (card: CalibrationDeliveryCard, query: string) => {
  const text = query.trim().toLowerCase()
  if (!text) return true
  return [
    card.customerName,
    card.serviceCode,
    card.city,
    card.address,
    card.siteName,
    ...card.items.map((item) => item.name)
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(text))
}

interface CardProps {
  card: CalibrationDeliveryCard
  busy: boolean
  onTake: () => void
  onRelease: () => void
  onSign: () => void
  onFail: () => void
}

const DeliveryCard = ({
  card,
  busy,
  onTake,
  onRelease,
  onSign,
  onFail
}: CardProps) => (
  <Paper
    variant='outlined'
    sx={{ p: 2, borderRadius: '16px', borderColor: '#e5e7eb' }}
  >
    <Stack spacing={1.25}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='flex-start'
        spacing={1}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
            {card.customerName}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {card.serviceCode}
            {card.siteName ? ` · ${card.siteName}` : ''}
          </Typography>
        </Box>
        {card.status === 'in_transit' ? (
          <Chip
            size='small'
            color={card.isMine ? 'primary' : 'default'}
            label={
              card.isMine ? 'La llevas tú' : `La lleva ${card.takenByName}`
            }
          />
        ) : null}
        {card.status === 'delivered' ? (
          <Chip size='small' color='success' label='Entregada' />
        ) : null}
      </Stack>

      {card.address || card.city ? (
        <Stack direction='row' spacing={0.75} alignItems='flex-start'>
          <PlaceOutlinedIcon
            sx={{ fontSize: 18, color: 'text.secondary', mt: 0.25 }}
          />
          <Typography variant='body2'>
            {[card.address, card.city].filter(Boolean).join(' · ')}
          </Typography>
        </Stack>
      ) : null}
      {card.contactName || card.contactPhone ? (
        <Stack direction='row' spacing={0.75} alignItems='center'>
          <PhoneOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant='body2'>
            {card.contactName}
            {card.contactPhone ? (
              <>
                {card.contactName ? ' · ' : ''}
                <a href={`tel:${card.contactPhone}`}>{card.contactPhone}</a>
              </>
            ) : null}
          </Typography>
        </Stack>
      ) : null}

      <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
        {card.items.map((item, index) => (
          <Chip
            key={`${item.name}-${index}`}
            size='small'
            variant='outlined'
            label={item.serial ? `${item.name} · ${item.serial}` : item.name}
          />
        ))}
      </Stack>

      {card.readyNotes ? (
        <Typography variant='body2' color='text.secondary'>
          Nota del laboratorio: {card.readyNotes}
        </Typography>
      ) : null}
      {card.lastFailureReason && card.status === 'ready' ? (
        <Alert severity='warning' sx={{ py: 0 }}>
          Último intento sin entregar: {card.lastFailureReason}
        </Alert>
      ) : null}
      {card.status === 'delivered' ? (
        <Typography variant='body2' color='text.secondary'>
          Recibió {card.receivedByName} · {formatWhen(card.deliveredAt)}
        </Typography>
      ) : null}

      {card.status === 'ready' ? (
        <Button
          variant='contained'
          disableElevation
          disabled={busy}
          onClick={onTake}
          sx={{
            bgcolor: '#00BFA5',
            '&:hover': { bgcolor: '#00897B' },
            textTransform: 'none',
            fontWeight: 700,
            py: 1.1
          }}
        >
          Yo la llevo
        </Button>
      ) : null}
      {card.status === 'in_transit' && card.isMine ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant='contained'
            disableElevation
            disabled={busy}
            onClick={onSign}
            sx={{
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00897B' },
              textTransform: 'none',
              fontWeight: 700,
              py: 1.1,
              flex: 1
            }}
          >
            Entregar y firmar
          </Button>
          <Button
            variant='outlined'
            disabled={busy}
            onClick={onFail}
            sx={{ textTransform: 'none' }}
          >
            No se pudo
          </Button>
          <Button
            variant='text'
            disabled={busy}
            onClick={onRelease}
            sx={{ textTransform: 'none' }}
          >
            Soltar
          </Button>
        </Stack>
      ) : null}
    </Stack>
  </Paper>
)

/**
 * Entregas de equipos a clientes. Quien tiene la capacidad de entregar ve las entregas listas, toma una ("Yo la
 * llevo"), la lleva y recoge la firma del cliente en pantalla. No necesita estar asignado al servicio ni ve nada más.
 */
const CalibrationDeliveriesPage = () => {
  const { data, isLoading, isError } = useCalibrationDeliveries()
  const { take, release, fail, complete } = useCalibrationDeliveryMutations()
  const [tab, setTab] = useState<TabKey>('available')
  const [query, setQuery] = useState('')
  const [signing, setSigning] = useState<CalibrationDeliveryCard | null>(null)
  const [failing, setFailing] = useState<CalibrationDeliveryCard | null>(null)
  const [receivedByName, setReceivedByName] = useState('')
  const [receivedByRole, setReceivedByRole] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const busy =
    take.isLoading || release.isLoading || fail.isLoading || complete.isLoading

  const lists = useMemo(
    () => ({
      available: (data?.available || []).filter((card) => matches(card, query)),
      inTransit: (data?.inTransit || []).filter((card) => matches(card, query)),
      delivered: (data?.delivered || []).filter((card) => matches(card, query))
    }),
    [data, query]
  )
  const mine = lists.inTransit.filter((card) => card.isMine).length

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      notify.success(success)
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible completar la acción')
      )
    }
  }

  const openSign = (card: CalibrationDeliveryCard) => {
    setReceivedByName('')
    setReceivedByRole('')
    setSignature(null)
    setSigning(card)
  }

  const submitSign = async () => {
    if (!signing) return
    if (!receivedByName.trim()) {
      notify.error('Escribe el nombre de quien recibe.')
      return
    }
    if (!signature) {
      notify.error('Falta la firma de quien recibe.')
      return
    }
    await run(
      () =>
        complete.mutateAsync({
          serviceId: signing.serviceId,
          signatureData: signature,
          receivedByName: receivedByName.trim(),
          receivedByRole: receivedByRole.trim() || undefined
        }),
      'Entrega firmada.'
    )
    setSigning(null)
  }

  const submitFail = async () => {
    if (!failing) return
    if (reason.trim().length < 3) {
      notify.error('Escribe por qué no se pudo entregar.')
      return
    }
    await run(
      () =>
        fail.mutateAsync({
          serviceId: failing.serviceId,
          reason: reason.trim()
        }),
      'Quedó registrado y la entrega vuelve a la lista.'
    )
    setFailing(null)
    setReason('')
  }

  const current = lists[tab]

  return (
    <Container maxWidth='md' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Entregas'
        subtitle='Toma una entrega, llévala al cliente y recoge su firma en pantalla.'
        icon={<LocalShippingOutlinedIcon />}
      />

      <TextField
        fullWidth
        size='small'
        placeholder='Buscar por cliente, ciudad, código o equipo'
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ mb: 2 }}
      />

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => setTab(value)}
        variant='fullWidth'
        sx={{
          mb: 2,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
        }}
      >
        <Tab
          value='available'
          label={`Disponibles (${lists.available.length})`}
        />
        <Tab
          value='inTransit'
          label={`En camino (${lists.inTransit.length}${mine ? ` · tuyas ${mine}` : ''})`}
        />
        <Tab
          value='delivered'
          label={`Entregadas (${lists.delivered.length})`}
        />
      </Tabs>

      {isLoading ? <SignalLoader message='Cargando entregas' /> : null}
      {isError ? (
        <Alert severity='error'>No pudimos cargar las entregas.</Alert>
      ) : null}
      {!isLoading && !isError && current.length === 0 ? (
        <Alert severity='info'>
          {tab === 'available'
            ? 'No hay entregas listas ahora. Cuando el laboratorio marque una, aparece aquí.'
            : tab === 'inTransit'
              ? 'No hay entregas en camino.'
              : 'Todavía no has entregado nada en los últimos 7 días.'}
        </Alert>
      ) : null}

      <Stack spacing={1.5}>
        {current.map((card) => (
          <DeliveryCard
            key={card.serviceId}
            card={card}
            busy={busy}
            onTake={() =>
              void run(
                () => take.mutateAsync(card.serviceId),
                'Es tuya: llévala al cliente.'
              )
            }
            onRelease={() =>
              void run(
                () => release.mutateAsync(card.serviceId),
                'La entrega volvió a la lista.'
              )
            }
            onSign={() => openSign(card)}
            onFail={() => {
              setReason('')
              setFailing(card)
            }}
          />
        ))}
      </Stack>

      <FormDialog
        open={Boolean(signing)}
        onClose={() => (complete.isLoading ? undefined : setSigning(null))}
        title='Entregar y firmar'
        subtitle={
          signing ? `${signing.customerName} · ${signing.serviceCode}` : ''
        }
        submitLabel='Confirmar entrega'
        onSubmit={() => void submitSign()}
        loading={complete.isLoading}
      >
        <Stack spacing={2}>
          {signing ? (
            <Typography variant='body2' color='text.secondary'>
              Equipos: {signing.items.map((item) => item.name).join(', ')}
            </Typography>
          ) : null}
          <TextField
            required
            label='Nombre de quien recibe'
            value={receivedByName}
            onChange={(event) => setReceivedByName(event.target.value)}
          />
          <TextField
            label='Cargo de quien recibe'
            value={receivedByRole}
            onChange={(event) => setReceivedByRole(event.target.value)}
          />
          <SignaturePad
            value={signature}
            onChange={setSignature}
            label='Firma de quien recibe'
            helperText='Pásale la pantalla al cliente para que firme con el dedo.'
          />
        </Stack>
      </FormDialog>

      <FormDialog
        open={Boolean(failing)}
        onClose={() => (fail.isLoading ? undefined : setFailing(null))}
        title='No se pudo entregar'
        subtitle={
          failing ? `${failing.customerName} · ${failing.serviceCode}` : ''
        }
        submitLabel='Registrar'
        onSubmit={() => void submitFail()}
        loading={fail.isLoading}
      >
        <TextField
          required
          multiline
          minRows={3}
          label='¿Qué pasó?'
          placeholder='Cliente ausente, dirección distinta, no quisieron recibir...'
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </FormDialog>
    </Container>
  )
}

export default CalibrationDeliveriesPage
