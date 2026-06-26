import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography
} from '@mui/material'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS } from '../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceAdjustmentType
} from '../../types/calibrationService'

interface CalibrationServiceAdjustmentDialogProps {
  open: boolean
  service: CalibrationService
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    adjustments: Array<{
      serviceItemId?: number | null
      changeType: CalibrationServiceAdjustmentType
      itemName?: string | null
      quotedQuantity?: number
      actualQuantity: number
      description: string
      technicalNotes?: string | null
      requiresCommercialAdjustment: boolean
      contractModificationRequired: boolean
      supportChannel?: string | null
      supportReference?: string | null
      supportNotifiedAt?: string
    }>
  }) => void | Promise<void>
}

interface DraftAdjustmentItem {
  serviceItemId: number
  itemName: string
  quotedQuantity: number
  actualQuantity: string
  selected: boolean
}

const DEFAULT_TYPE: CalibrationServiceAdjustmentType = 'quantity_more'
const ROWS_PER_PAGE = 10

const CalibrationServiceAdjustmentDialog = ({
  open,
  service,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentDialogProps) => {
  const eligibleItems = useMemo(
    () =>
      (service.items || []).filter(
        (item) =>
          item.otherFields?.operationalStatus === 'completed' ||
          item.otherFields?.operationalStatus === 'in_progress'
      ),
    [service.items]
  )

  const [serviceItemId, setServiceItemId] = useState<string>('')
  const [changeType, setChangeType] =
    useState<CalibrationServiceAdjustmentType>(DEFAULT_TYPE)
  const [itemName, setItemName] = useState('')
  const [quotedQuantity, setQuotedQuantity] = useState('0')
  const [actualQuantity, setActualQuantity] = useState('1')
  const [selectedItems, setSelectedItems] = useState<DraftAdjustmentItem[]>([])
  const [description, setDescription] = useState('')
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [requiresCommercialAdjustment, setRequiresCommercialAdjustment] =
    useState(true)
  const [contractModificationRequired, setContractModificationRequired] =
    useState(true)
  const [supportChannel, setSupportChannel] = useState('whatsapp')
  const [supportReference, setSupportReference] = useState('')
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setServiceItemId('')
    setChangeType(DEFAULT_TYPE)
    setItemName('')
    setQuotedQuantity('0')
    setActualQuantity('1')
    setSelectedItems(
      eligibleItems.map((item) => ({
        serviceItemId: item.id,
        itemName: item.itemName,
        quotedQuantity: item.quantity || 0,
        actualQuantity: String(item.quantity || 0),
        selected: false
      }))
    )
    setDescription('')
    setTechnicalNotes('')
    setRequiresCommercialAdjustment(true)
    setContractModificationRequired(true)
    setSupportChannel('whatsapp')
    setSupportReference('')
    setPage(0)
    setSearchQuery('')
  }, [eligibleItems, open])

  useEffect(() => {
    const selectedItem = eligibleItems.find(
      (item) => String(item.id) === serviceItemId
    )

    if (selectedItem) {
      setItemName(selectedItem.itemName)
      setQuotedQuantity(String(selectedItem.quantity || 0))
      setActualQuantity(String(selectedItem.quantity || 0))
    } else if (changeType === 'extra_item') {
      setQuotedQuantity('0')
      setActualQuantity('1')
    }
  }, [eligibleItems, serviceItemId, changeType])

  const isExtraItem = changeType === 'extra_item'
  const isQuantityMore = changeType === 'quantity_more'
  const isQuantityLess = changeType === 'quantity_less'
  const actualQuantityLabel = isExtraItem
    ? 'Cantidad real'
    : isQuantityMore
      ? 'Cantidad real total'
      : isQuantityLess
        ? 'Cantidad recibida / ejecutada'
        : 'Cantidad real'
  const actualQuantityHelperText = isExtraItem
    ? 'Indica cuántas unidades nuevas aparecieron para este ítem no cotizado.'
    : isQuantityMore
      ? 'Escribe la cantidad total real. Ejemplo: si cotizaste 1 y llegaron 3, aquí va 3.'
      : isQuantityLess
        ? 'Escribe la cantidad total realmente recibida o ejecutada.'
        : 'Indica la cantidad real total del ítem.'
  const selectedBatchItems = selectedItems.filter((item) => item.selected)
  const canSubmit =
    description.trim().length >= 5 &&
    (!contractModificationRequired || Boolean(supportChannel)) &&
    (isExtraItem
      ? actualQuantity.trim() && itemName.trim()
      : selectedBatchItems.length > 0 &&
        selectedBatchItems.every((item) => item.actualQuantity.trim()))

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return selectedItems
    const q = searchQuery.toLowerCase().trim()
    return selectedItems.filter((item) =>
      item.itemName.toLowerCase().includes(q)
    )
  }, [selectedItems, searchQuery])

  const paginatedItems = useMemo(
    () => filteredItems.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE),
    [filteredItems, page]
  )

  const handleToggleSelectedItem =
    (serviceItemIdValue: number) =>
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setSelectedItems((currentItems) =>
        currentItems.map((item) =>
          item.serviceItemId === serviceItemIdValue
            ? { ...item, selected: checked }
            : item
        )
    )
  }

  const handleSelectedItemActualQuantity =
    (serviceItemIdValue: number) => (event: ChangeEvent<HTMLInputElement>) => {
      setSelectedItems((currentItems) =>
        currentItems.map((item) =>
          item.serviceItemId === serviceItemIdValue
            ? { ...item, actualQuantity: event.target.value }
            : item
        )
      )
    }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    if (isExtraItem) {
      await onSubmit({
        adjustments: [
          {
            serviceItemId: serviceItemId ? Number(serviceItemId) : null,
            changeType,
            itemName: itemName.trim() || null,
            quotedQuantity: Number(quotedQuantity || '0'),
            actualQuantity: Number(actualQuantity || '0'),
            description: description.trim(),
            technicalNotes: technicalNotes.trim() || null,
            requiresCommercialAdjustment,
            contractModificationRequired,
            supportChannel: contractModificationRequired
              ? supportChannel
              : null,
            supportReference: supportReference.trim() || null,
            supportNotifiedAt: new Date().toISOString()
          }
        ]
      })
      return
    }

    await onSubmit({
      adjustments: selectedBatchItems.map((item) => ({
        serviceItemId: item.serviceItemId,
        changeType,
        itemName: item.itemName,
        quotedQuantity: item.quotedQuantity,
        actualQuantity: Number(item.actualQuantity || '0'),
        description: description.trim(),
        technicalNotes: technicalNotes.trim() || null,
        requiresCommercialAdjustment,
        contractModificationRequired,
        supportChannel: contractModificationRequired ? supportChannel : null,
        supportReference: supportReference.trim() || null,
        supportNotifiedAt: new Date().toISOString()
      }))
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Registrar novedad de ejecución</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            Registra aquí diferencias entre la OC/oferta aprobada y lo realmente
            recibido o ejecutado. Si hay modificación de contrato, deja
            evidencia del aviso inmediato a oficina.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='Tipo de novedad'
                value={changeType}
                onChange={(event) =>
                  setChangeType(
                    event.target.value as CalibrationServiceAdjustmentType
                  )
                }
              >
                {Object.entries(CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
            {isExtraItem ? (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label='Ítem cotizado relacionado'
                  value={serviceItemId}
                  onChange={(event) => setServiceItemId(event.target.value)}
                  helperText='Opcional, solo si el adicional se relaciona con un ítem ya cotizado.'
                >
                  <MenuItem value=''>Sin item relacionado</MenuItem>
                  {eligibleItems.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.itemName} · Cant. {item.quantity}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ pt: 1 }}
                >
                  Puedes seleccionar varios ítems del mismo tipo de novedad. El
                  sistema guardará una novedad por ítem para mantener
                  trazabilidad. Para cantidades mayores o menores, escribe la
                  cantidad real total de cada ítem, no solo la diferencia.
                </Typography>
              </Grid>
            )}

            <Grid item xs={12} md={isExtraItem ? 8 : 12}>
              <TextField
                fullWidth
                label='Nombre del ítem real'
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                disabled={!isExtraItem || Boolean(serviceItemId)}
                helperText={
                  isExtraItem
                    ? 'Usa este campo para el ítem nuevo no cotizado.'
                    : 'Para ítems cotizados, el nombre se toma automáticamente de cada selección.'
                }
              />
            </Grid>

            {isExtraItem ? (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Cotizado'
                    value={quotedQuantity}
                    onChange={(event) => setQuotedQuantity(event.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type='number'
                    label={actualQuantityLabel}
                    value={actualQuantity}
                    onChange={(event) => setActualQuantity(event.target.value)}
                    inputProps={{ min: 0 }}
                    helperText={actualQuantityHelperText}
                  />
                </Grid>
              </>
            ) : selectedItems.length ? (
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='Buscar ítems...'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(0)
                    }}
                    InputProps={{
                      startAdornment: (
                        <SearchOutlinedIcon
                          sx={{ mr: 1, color: 'text.secondary' }}
                        />
                      )
                    }}
                    sx={{ maxWidth: 360 }}
                  />
                  <TableContainer sx={{ maxHeight: 420 }}>
                    <Table size='small' stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding='checkbox' sx={{ width: 48 }} />
                          <TableCell sx={{ fontWeight: 600 }}>
                            Ítem
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }} width={120}>
                            Cotizado
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }} width={200}>
                            {actualQuantityLabel}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedItems.map((item) => (
                          <TableRow
                            key={item.serviceItemId}
                            hover
                            selected={item.selected}
                            sx={{
                              '&:hover .quantity-input': {
                                opacity: 1
                              }
                            }}
                          >
                            <TableCell padding='checkbox'>
                              <Checkbox
                                checked={item.selected}
                                onChange={handleToggleSelectedItem(
                                  item.serviceItemId
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant='body2'
                                sx={{
                                  fontWeight: item.selected ? 500 : 400,
                                  maxWidth: 280,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {item.itemName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' color='text.secondary'>
                                {item.quotedQuantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                className='quantity-input'
                                fullWidth
                                type='number'
                                size='small'
                                placeholder='Cantidad real'
                                value={item.actualQuantity}
                                onChange={handleSelectedItemActualQuantity(
                                  item.serviceItemId
                                )}
                                inputProps={{ min: 0 }}
                                disabled={!item.selected}
                                sx={{
                                  opacity: item.selected ? 1 : 0.5,
                                  transition: 'opacity 0.15s'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
                              <Typography variant='body2' color='text.secondary'>
                                {searchQuery.trim()
                                  ? 'Ningún ítem coincide con la búsqueda.'
                                  : 'No hay ítems completados disponibles.'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component='div'
                    count={filteredItems.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={ROWS_PER_PAGE}
                    rowsPerPageOptions={[ROWS_PER_PAGE]}
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}–${to} de ${count}`
                    }
                  />
                  {selectedBatchItems.length > 0 && (
                    <Typography variant='caption' color='primary' sx={{ pl: 0.5 }}>
                      {selectedBatchItems.length} ítem
                      {selectedBatchItems.length !== 1 ? 's' : ''} seleccionado
                      {selectedBatchItems.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Stack>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>
                  No hay ítems completados disponibles para relacionar con
                  una novedad.
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Descripción'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observación técnica'
                value={technicalNotes}
                onChange={(event) => setTechnicalNotes(event.target.value)}
                multiline
                minRows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requiresCommercialAdjustment}
                    onChange={(event) =>
                      setRequiresCommercialAdjustment(event.target.checked)
                    }
                  />
                }
                label='Esta novedad requiere ajuste comercial o valoración para facturar'
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={contractModificationRequired}
                    onChange={(event) =>
                      setContractModificationRequired(event.target.checked)
                    }
                  />
                }
                label='Modificación de contrato: Sí'
              />
            </Grid>
            {contractModificationRequired ? (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label='Aviso inmediato'
                    value={supportChannel}
                    onChange={(event) => setSupportChannel(event.target.value)}
                    helperText='Cumple el aviso por llamada, correo o WhatsApp.'
                  >
                    <MenuItem value='whatsapp'>WhatsApp</MenuItem>
                    <MenuItem value='call'>Llamada</MenuItem>
                    <MenuItem value='email'>Correo electrónico</MenuItem>
                    <MenuItem value='in_person'>Presencial</MenuItem>
                    <MenuItem value='other'>Otro</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label='Soporte / referencia del aviso'
                    value={supportReference}
                    onChange={(event) =>
                      setSupportReference(event.target.value)
                    }
                    helperText='Ej. número contactado, correo enviado o persona que atendió.'
                  />
                </Grid>
              </>
            ) : null}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || isLoading}
        >
          Guardar novedad
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentDialog
