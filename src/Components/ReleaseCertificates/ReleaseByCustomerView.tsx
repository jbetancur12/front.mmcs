import React, { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import {
  ExpandMoreRounded,
  VisibilityOutlined,
  WarningAmberRounded
} from '@mui/icons-material'
import {
  useCustomerBulkActions,
  useCustomersSummary,
  useFetchReadyToSign,
  useReleaseCertificates
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import ReleaseServicePicker from './ReleaseServicePicker'
import ReleaseStatusPill from './ReleaseStatusPill'
import {
  ReleaseCertificate,
  ReleaseCustomerSummary,
  ReleaseServiceOption
} from './ReleaseCertificates.types'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import { brand, intent, neutral } from 'src/theme/designTokens'

const PAGE_SIZE = 25
const ITEMS_STEP = 100

interface ReleaseByCustomerViewProps {
  canSign: boolean
  canReview: boolean
  onOpen: (id: number) => void
  onSign: (ids: number[]) => void
}

const formatDate = (value: string | null) =>
  value ? value.split('-').reverse().join('/') : '—'

interface BlockProps {
  title: string
  hint?: string
  items: ReleaseCertificate[]
  onOpen: (id: number) => void
}

/** Un bloque de estado dentro de un cliente: título con cantidad y los certificados en una tabla compacta. */
const CertificateBlock: React.FC<BlockProps> = ({
  title,
  hint,
  items,
  onOpen
}) => {
  if (items.length === 0) return null
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 0.25 }}>
        {title} ({items.length})
      </Typography>
      {hint && (
        <Typography variant='caption' color='text.secondary' display='block'>
          {hint}
        </Typography>
      )}
      <TableContainer
        sx={{ border: `1px solid ${neutral.border}`, borderRadius: 1, mt: 0.5 }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ bgcolor: neutral.surfaceHead }}>
              <TableCell>Número</TableCell>
              <TableCell>Instrumento</TableCell>
              <TableCell>Serie</TableCell>
              <TableCell>Calibración</TableCell>
              <TableCell>ODS</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((certificate) => {
              const otherCustomer = certificate.anomalies.some(
                (a) => a.code === 'CLIENTE_DISTINTO'
              )
              return (
                <TableRow
                  key={certificate.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onDoubleClick={() => onOpen(certificate.id)}
                >
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {certificate.documentNumber ?? 'Sin número'}
                      {certificate.anomalies.length > 0 && (
                        <Tooltip
                          title={certificate.anomalies
                            .map((a) => a.message)
                            .join(' · ')}
                        >
                          <WarningAmberRounded
                            fontSize='small'
                            sx={{ color: intent.warningInk }}
                          />
                        </Tooltip>
                      )}
                      {otherCustomer && (
                        <Chip
                          size='small'
                          color='warning'
                          variant='outlined'
                          label='¿Es de este cliente?'
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{certificate.instrument ?? '—'}</TableCell>
                  <TableCell>{certificate.serie ?? '—'}</TableCell>
                  <TableCell>
                    {formatDate(certificate.calibrationDate)}
                  </TableCell>
                  <TableCell>
                    {certificate.service?.serviceCode ?? '—'}
                  </TableCell>
                  <TableCell>
                    <ReleaseStatusPill status={certificate.status} />
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Revisar'>
                      <IconButton
                        size='small'
                        aria-label={`Revisar ${certificate.documentNumber ?? certificate.id}`}
                        sx={{ color: brand.ink }}
                        onClick={() => onOpen(certificate.id)}
                      >
                        <VisibilityOutlined fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

interface AssignDialogProps {
  open: boolean
  customer: ReleaseCustomerSummary
  ids: number[]
  onClose: () => void
}

/** Liga a una misma orden de servicio los certificados del cliente que aún no tienen. */
const AssignServiceDialog: React.FC<AssignDialogProps> = ({
  open,
  customer,
  ids,
  onClose
}) => {
  const [service, setService] = useState<ReleaseServiceOption | null>(null)
  const { linkService } = useCustomerBulkActions()
  useEffect(() => {
    if (!open) setService(null)
  }, [open])

  const assign = () => {
    if (!service) return
    linkService.mutate(
      { ids, serviceId: service.id },
      {
        onSuccess: (results) => {
          const failed = results.filter((r) => !r.ok)
          if (failed.length === 0)
            notify.success(
              `${results.length} certificados ligados a ${service.serviceCode}`
            )
          else
            notify.warning(
              `${results.length - failed.length} ligados, ${failed.length} no se pudieron ligar`,
              failed[0].error
            )
          onClose()
        },
        onError: (error) =>
          notify.error(
            'No se pudo ligar a la orden',
            getApiErrorReason(error) ?? undefined
          )
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Asignar orden de servicio</DialogTitle>
      <DialogContent>
        <Alert severity='info' sx={{ mb: 2 }}>
          Se ligan {ids.length} certificado(s) de {customer.name} que aún no
          tienen servicio. Se busca por SCL, ODS u oferta y se ofrecen primero
          los servicios de este cliente.
        </Alert>
        <ReleaseServicePicker
          value={service}
          customerId={customer.customerId}
          onChange={setService}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={linkService.isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          disabled={!service || linkService.isLoading}
          onClick={assign}
          sx={{ bgcolor: brand.main, '&:hover': { bgcolor: brand.hover } }}
        >
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface PanelBodyProps extends ReleaseByCustomerViewProps {
  customer: ReleaseCustomerSummary
}

/** Lo que se ve al abrir un cliente: acciones y sus certificados por bloque de estado. */
const PanelBody: React.FC<PanelBodyProps> = ({
  customer,
  canSign,
  canReview,
  onOpen,
  onSign
}) => {
  const [limit, setLimit] = useState(ITEMS_STEP)
  const [assigning, setAssigning] = useState(false)
  const [loadingSign, setLoadingSign] = useState(false)
  const { data, isLoading } = useReleaseCertificates({
    customerId: customer.customerId ?? undefined,
    pdfCustomerName: customer.identified
      ? undefined
      : customer.key.replace(/^pdf:/, ''),
    page: 1,
    limit
  })
  const fetchReadyToSign = useFetchReadyToSign()
  const { verifyClean } = useCustomerBulkActions()
  const items = data?.items ?? []

  const toReview = items.filter(
    (c) => c.status === 'pendiente_revision' || c.status === 'requiere_ajustes'
  )
  const verified = items.filter((c) => c.status === 'verificado')
  const signed = items.filter((c) => c.status === 'firmado')
  const released = items.filter((c) => c.status === 'liberado')
  const clean = toReview.filter(
    (c) => c.status === 'pendiente_revision' && c.anomalies.length === 0
  )
  const readyToSign = verified.filter((c) => c.kind === 'principal')
  const withoutService = items.filter(
    (c) => !c.serviceId && c.status !== 'liberado'
  )

  const verifyAll = () => {
    if (customer.customerId === null) return
    verifyClean.mutate(customer.customerId, {
      onSuccess: ({ results, skipped }) => {
        const failed = results.filter((r) => !r.ok)
        const done = results.length - failed.length
        const left = skipped + failed.length
        if (left === 0) notify.success(`${done} certificados verificados`)
        else
          notify.warning(
            `${done} verificados; ${left} quedan para revisar uno a uno`,
            failed[0]?.error
          )
      },
      onError: (error) =>
        notify.error(
          'No se pudo verificar',
          getApiErrorReason(error) ?? undefined
        )
    })
  }

  const signReady = async () => {
    setLoadingSign(true)
    try {
      const ready = await fetchReadyToSign(customer.customerId)
      if (ready.length === 0)
        notify.info('No hay certificados verificados para firmar')
      else onSign(ready.map((item) => item.id))
    } catch (error) {
      notify.error(
        'No se pudo traer los certificados verificados',
        getApiErrorReason(error) ?? undefined
      )
    } finally {
      setLoadingSign(false)
    }
  }

  if (isLoading) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Cargando los certificados del cliente…
      </Typography>
    )
  }

  return (
    <Box>
      {!customer.identified ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Estos certificados dicen «{customer.name}» en el PDF, pero ese cliente
          no se identificó en la plataforma. Ábrelos y elige el cliente para
          poder verificarlos.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {canReview && (
            <Button
              size='small'
              variant='outlined'
              disabled={clean.length === 0 || verifyClean.isLoading}
              onClick={verifyAll}
            >
              Verificar los sin rarezas ({clean.length})
            </Button>
          )}
          {canSign && (
            <Button
              size='small'
              variant='outlined'
              disabled={readyToSign.length === 0 || loadingSign}
              onClick={signReady}
            >
              Firmar los verificados ({readyToSign.length})
            </Button>
          )}
          {canReview && (
            <Button
              size='small'
              variant='outlined'
              disabled={withoutService.length === 0}
              onClick={() => setAssigning(true)}
            >
              Asignar orden de servicio ({withoutService.length})
            </Button>
          )}
        </Box>
      )}

      <CertificateBlock
        title='Por revisar'
        hint='Pendientes de revisión y con ajustes pedidos. Los marcados con «¿Es de este cliente?» dicen otro cliente en el PDF: valídalos antes de verificar.'
        items={toReview}
        onOpen={onOpen}
      />
      <CertificateBlock
        title='Verificados'
        hint='Listos para firmar (o para liberar, si son anexos o de terceros).'
        items={verified}
        onOpen={onOpen}
      />
      <CertificateBlock
        title='Firmados, por liberar'
        hint='Abre cada uno para liberarlo.'
        items={signed}
        onOpen={onOpen}
      />
      {released.length > 0 && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{ border: `1px solid ${neutral.border}` }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography variant='subtitle2' fontWeight={700}>
              Liberados ({released.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CertificateBlock
              title='Liberados'
              items={released}
              onOpen={onOpen}
            />
          </AccordionDetails>
        </Accordion>
      )}
      {items.length === 0 && (
        <Typography variant='body2' color='text.secondary'>
          Este cliente no tiene certificados.
        </Typography>
      )}
      {(data?.total ?? 0) > items.length && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant='caption' color='text.secondary' display='block'>
            Mostrando {items.length} de {data?.total}.
          </Typography>
          <Button
            size='small'
            onClick={() => setLimit((current) => current + ITEMS_STEP)}
          >
            Ver más
          </Button>
        </Box>
      )}
      <AssignServiceDialog
        open={assigning}
        customer={customer}
        ids={withoutService.map((c) => c.id)}
        onClose={() => setAssigning(false)}
      />
    </Box>
  )
}

const COUNT_CHIPS: {
  key: keyof ReleaseCustomerSummary['counts']
  label: string
  color: string
  bg: string
}[] = [
  {
    key: 'pendiente_revision',
    label: 'por revisar',
    color: intent.warningInk,
    bg: intent.warningSoft
  },
  {
    key: 'requiere_ajustes',
    label: 'ajustes',
    color: intent.dangerInk,
    bg: intent.dangerSoft
  },
  {
    key: 'verificado',
    label: 'verificados',
    color: brand.ink,
    bg: brand.soft
  },
  {
    key: 'firmado',
    label: 'firmados',
    color: intent.infoInk,
    bg: intent.infoSoft
  },
  {
    key: 'liberado',
    label: 'liberados',
    color: intent.successInk,
    bg: intent.successSoft
  }
]

/**
 * Vista «Por cliente»: un acordeón por cliente con sus contadores por estado; al abrirlo se ven sus certificados separados por
 * estado (lo liberado plegado) y las acciones que valen para ese cliente.
 */
const ReleaseByCustomerView: React.FC<ReleaseByCustomerViewProps> = (props) => {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useCustomersSummary({
    search,
    page,
    limit: PAGE_SIZE
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <Box>
      <TextField
        size='small'
        label='Buscar cliente'
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        sx={{ mb: 2, minWidth: 280 }}
      />
      {isLoading && (
        <Typography variant='body2' color='text.secondary'>
          Cargando clientes…
        </Typography>
      )}
      {data?.items.length === 0 && (
        <Typography variant='body2' color='text.secondary'>
          No hay clientes con certificados{search ? ' para esa búsqueda' : ''}.
        </Typography>
      )}
      {data?.items.map((customer) => (
        <Accordion
          key={customer.key}
          disableGutters
          elevation={0}
          TransitionProps={{ unmountOnExit: true }}
          sx={{
            border: `1px solid ${neutral.border}`,
            borderRadius: 2,
            mb: 1,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                width: '100%'
              }}
            >
              <Typography fontWeight={700} sx={{ minWidth: 220 }}>
                {customer.name}
              </Typography>
              {!customer.identified && (
                <Chip
                  size='small'
                  color='warning'
                  variant='outlined'
                  label='Sin identificar'
                />
              )}
              {COUNT_CHIPS.filter((chip) => customer.counts[chip.key] > 0).map(
                (chip) => (
                  <Chip
                    key={chip.key}
                    size='small'
                    label={`${customer.counts[chip.key]} ${chip.label}`}
                    sx={{
                      bgcolor: chip.bg,
                      color: chip.color,
                      fontWeight: 600
                    }}
                  />
                )
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <PanelBody customer={customer} {...props} />
          </AccordionDetails>
        </Accordion>
      ))}
      {(data?.total ?? 0) > PAGE_SIZE && (
        <Pagination
          sx={{ mt: 2 }}
          count={Math.ceil((data?.total ?? 0) / PAGE_SIZE)}
          page={page}
          onChange={(_event, value) => setPage(value)}
        />
      )}
    </Box>
  )
}

export default ReleaseByCustomerView
