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
  TextField,
  Typography
} from '@mui/material'
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

const CalibrationServiceAdjustmentDialog = ({
  open,
  service,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentDialogProps) => {
  const completedItems = useMemo(
    () =>
      (service.items || []).filter(
        (item) => item.otherFields?.operationalStatus === 'completed'
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
      completedItems.map((item) => ({
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
  }, [completedItems, open])

  useEffect(() => {
    const selectedItem = completedItems.find(
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
  }, [completedItems, serviceItemId, changeType])

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
                  {completedItems.map((item) => (
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
            ) : (
              <Grid item xs={12}>
                <Stack spacing={1.5}>
                  {selectedItems.length ? (
                    selectedItems.map((item) => (
                      <Grid
                        container
                        spacing={2}
                        alignItems='center'
                        key={item.serviceItemId}
                      >
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={item.selected}
                                onChange={handleToggleSelectedItem(
                                  item.serviceItemId
                                )}
                              />
                            }
                            label={`${item.itemName} · Cotizado: ${item.quotedQuantity}`}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant='body2' color='text.secondary'>
                            Cantidad cotizada: {item.quotedQuantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            type='number'
                            label={actualQuantityLabel}
                            value={item.actualQuantity}
                            onChange={handleSelectedItemActualQuantity(
                              item.serviceItemId
                            )}
                            inputProps={{ min: 0 }}
                            disabled={!item.selected}
                            helperText={
                              item.selected
                                ? `Se comparará contra ${item.quotedQuantity} cotizada(s).`
                                : 'Selecciona el ítem para registrar la novedad.'
                            }
                          />
                        </Grid>
                      </Grid>
                    ))
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      No hay ítems completados disponibles para relacionar con
                      una novedad.
                    </Typography>
                  )}
                </Stack>
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
