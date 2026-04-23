import { useEffect, useMemo, useState } from 'react'
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
import {
  CalibrationServiceAdjustment,
  CalibrationServiceAdjustmentStatus
} from '../../types/calibrationService'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'

type TechnicalDecision = 'approved' | 'rejected'
type ReviewStage = 'technical' | 'commercial'

interface CalibrationServiceAdjustmentReviewDialogProps {
  open: boolean
  adjustment: CalibrationServiceAdjustment | null
  reviewStage: ReviewStage
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    reviewStage: ReviewStage
    decision?: Extract<
      CalibrationServiceAdjustmentStatus,
      'approved' | 'rejected'
    >
    technicalDecision?: TechnicalDecision
    technicalReviewNotes?: string | null
    technicalReviewerRole?: string | null
    contractModificationRequired?: boolean
    supportChannel?: string | null
    supportReference?: string | null
    supportNotifiedAt?: string
    commercialNotes?: string | null
    pricingNotes?: string | null
    approvedUnitPrice?: number | null
    approvedTaxRate?: number | null
    approvedTaxTotal?: number | null
    approvedSubtotal?: number | null
    approvedTotal?: number | null
    useQuotedPrice?: boolean
    applyDiscount?: boolean
    customerApprovalRequired?: boolean
  }) => void | Promise<void>
}

const CalibrationServiceAdjustmentReviewDialog = ({
  open,
  adjustment,
  reviewStage,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentReviewDialogProps) => {
  const [decision, setDecision] =
    useState<
      Extract<CalibrationServiceAdjustmentStatus, 'approved' | 'rejected'>
    >('approved')
  const [commercialNotes, setCommercialNotes] = useState('')
  const [pricingNotes, setPricingNotes] = useState('')
  const [approvedUnitPrice, setApprovedUnitPrice] = useState('')
  const [approvedTaxRate, setApprovedTaxRate] = useState('')
  const [useQuotedPrice, setUseQuotedPrice] = useState(false)
  const [applyDiscount, setApplyDiscount] = useState(true)
  const [customerApprovalRequired, setCustomerApprovalRequired] =
    useState(false)
  const [technicalDecision, setTechnicalDecision] =
    useState<TechnicalDecision>('approved')
  const [technicalReviewNotes, setTechnicalReviewNotes] = useState('')
  const [technicalReviewerRole, setTechnicalReviewerRole] = useState(
    'Director técnico / Coordinador / Calidad'
  )
  const [contractModificationRequired, setContractModificationRequired] =
    useState(true)
  const [supportChannel, setSupportChannel] = useState('whatsapp')
  const [supportReference, setSupportReference] = useState('')

  useEffect(() => {
    if (!open || !adjustment) {
      return
    }

    const nextTechnicalDecision =
      adjustment.otherFields &&
      adjustment.otherFields.technicalDecision === 'rejected'
        ? 'rejected'
        : 'approved'

    setDecision('approved')
    setTechnicalDecision(nextTechnicalDecision)
    setTechnicalReviewNotes(
      adjustment.otherFields &&
        typeof adjustment.otherFields.technicalReviewNotes === 'string'
        ? adjustment.otherFields.technicalReviewNotes
        : ''
    )
    setTechnicalReviewerRole(
      adjustment.otherFields &&
        typeof adjustment.otherFields.technicalReviewerRole === 'string'
        ? adjustment.otherFields.technicalReviewerRole
        : 'Director técnico / Coordinador / Calidad'
    )
    setContractModificationRequired(
      adjustment.otherFields &&
        typeof adjustment.otherFields.contractModificationRequired === 'boolean'
        ? adjustment.otherFields.contractModificationRequired
        : true
    )
    setSupportChannel(
      adjustment.otherFields &&
        typeof adjustment.otherFields.supportChannel === 'string'
        ? adjustment.otherFields.supportChannel
        : 'whatsapp'
    )
    setSupportReference(
      adjustment.otherFields &&
        typeof adjustment.otherFields.supportReference === 'string'
        ? adjustment.otherFields.supportReference
        : ''
    )
    setCommercialNotes(adjustment.commercialNotes || '')
    setPricingNotes(adjustment.pricingNotes || '')
    setApprovedUnitPrice(
      adjustment.approvedUnitPrice !== null &&
        adjustment.approvedUnitPrice !== undefined
        ? String(adjustment.approvedUnitPrice)
        : ''
    )
    setApprovedTaxRate(
      adjustment.approvedTaxRate !== null &&
        adjustment.approvedTaxRate !== undefined
        ? String(adjustment.approvedTaxRate)
        : adjustment.otherFields &&
            typeof adjustment.otherFields.approvedTaxRate === 'number'
          ? String(adjustment.otherFields.approvedTaxRate)
          : adjustment.otherFields &&
              typeof adjustment.otherFields.approvedTaxRate === 'string'
            ? adjustment.otherFields.approvedTaxRate
            : ''
    )
    setUseQuotedPrice(
      adjustment.otherFields &&
        typeof adjustment.otherFields.useQuotedPrice === 'boolean'
        ? adjustment.otherFields.useQuotedPrice
        : (adjustment.changeType === 'quantity_more' ||
            adjustment.changeType === 'quantity_less') &&
            Boolean(
              adjustment.serviceItem?.unitPrice !== null &&
                adjustment.serviceItem?.unitPrice !== undefined
            )
    )
    setApplyDiscount(
      adjustment.otherFields &&
        typeof adjustment.otherFields.applyDiscount === 'boolean'
        ? adjustment.otherFields.applyDiscount
        : adjustment.changeType === 'quantity_less'
    )
    setCustomerApprovalRequired(
      adjustment.otherFields &&
        typeof adjustment.otherFields.customerApprovalRequired === 'boolean'
        ? adjustment.otherFields.customerApprovalRequired
        : Boolean(adjustment.requiresCommercialAdjustment)
    )
  }, [open, adjustment])

  const needsPricing = Boolean(adjustment?.requiresCommercialAdjustment)
  const isQuantityMore = adjustment?.changeType === 'quantity_more'
  const isQuantityLess = adjustment?.changeType === 'quantity_less'
  const hasQuotedItemPrice =
    adjustment?.serviceItem?.unitPrice !== null &&
    adjustment?.serviceItem?.unitPrice !== undefined
  const pricedQuantity = useMemo(() => {
    if (!adjustment) {
      return 0
    }

    if (adjustment.changeType === 'extra_item') {
      return adjustment.actualQuantity || 0
    }

    return Math.abs(adjustment.differenceQuantity || 0)
  }, [adjustment])

  useEffect(() => {
    if (!adjustment || !useQuotedPrice) {
      return
    }

    const quotedUnitPrice =
      adjustment.serviceItem?.unitPrice !== null &&
      adjustment.serviceItem?.unitPrice !== undefined
        ? String(adjustment.serviceItem.unitPrice)
        : ''
    const quotedTaxRate =
      adjustment.serviceItem?.taxRate !== null &&
      adjustment.serviceItem?.taxRate !== undefined
        ? String(adjustment.serviceItem.taxRate)
        : ''

    setApprovedUnitPrice(quotedUnitPrice)
    setApprovedTaxRate(quotedTaxRate)
  }, [adjustment, useQuotedPrice])

  const approvedUnitPriceNumber = approvedUnitPrice
    ? Number(approvedUnitPrice)
    : 0
  const approvedTaxRateNumber = approvedTaxRate ? Number(approvedTaxRate) : 0
  const approvedSubtotal = pricedQuantity * approvedUnitPriceNumber
  const approvedTaxTotal = approvedSubtotal * (approvedTaxRateNumber / 100)
  const approvedTotal = approvedSubtotal + approvedTaxTotal
  const signedSubtotal =
    isQuantityLess && applyDiscount ? -approvedSubtotal : approvedSubtotal
  const signedTaxTotal =
    isQuantityLess && applyDiscount ? -approvedTaxTotal : approvedTaxTotal
  const signedTotal =
    isQuantityLess && applyDiscount ? -approvedTotal : approvedTotal
  const isTechnicalReview = reviewStage === 'technical'
  const canSubmit =
    (!contractModificationRequired || Boolean(supportChannel)) &&
    (isTechnicalReview ||
      adjustment?.otherFields?.technicalDecision === 'approved')

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    if (isTechnicalReview) {
      await onSubmit({
        reviewStage,
        technicalDecision,
        technicalReviewNotes: technicalReviewNotes.trim() || null,
        technicalReviewerRole: technicalReviewerRole.trim() || null,
        contractModificationRequired,
        supportChannel: contractModificationRequired ? supportChannel : null,
        supportReference: supportReference.trim() || null,
        supportNotifiedAt: new Date().toISOString()
      })
      return
    }

    await onSubmit({
      reviewStage,
      decision,
      contractModificationRequired,
      supportChannel: contractModificationRequired ? supportChannel : null,
      supportReference: supportReference.trim() || null,
      supportNotifiedAt: new Date().toISOString(),
      commercialNotes: commercialNotes.trim() || null,
      pricingNotes: pricingNotes.trim() || null,
      approvedUnitPrice:
        approvedUnitPrice && (!isQuantityLess || applyDiscount)
          ? Number(approvedUnitPrice)
          : 0,
      approvedTaxRate: approvedTaxRate ? Number(approvedTaxRate) : null,
      approvedTaxTotal:
        approvedUnitPrice && (!isQuantityLess || applyDiscount)
          ? signedTaxTotal
          : 0,
      approvedSubtotal:
        approvedUnitPrice && (!isQuantityLess || applyDiscount)
          ? signedSubtotal
          : 0,
      approvedTotal:
        approvedUnitPrice && (!isQuantityLess || applyDiscount)
          ? signedTotal
          : 0,
      useQuotedPrice,
      applyDiscount,
      customerApprovalRequired
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        {isTechnicalReview
          ? 'Revisión técnica de novedad'
          : 'Revisión comercial de novedad'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {adjustment?.itemName || 'Sin ítem'} ·{' '}
            {adjustment?.description || ''}
          </Typography>
          {isTechnicalReview ? (
            <Stack spacing={2}>
              <Typography variant='subtitle2' fontWeight={800}>
                Revisión técnica / calidad / laboratorio
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label='Decisión técnica'
                    value={technicalDecision}
                    onChange={(event) => {
                      const nextDecision = event.target
                        .value as TechnicalDecision
                      setTechnicalDecision(nextDecision)
                      if (nextDecision === 'rejected') {
                        setDecision('rejected')
                      }
                    }}
                    helperText='Confirma si el cambio puede ejecutarse con capacidad y alcance técnico.'
                  >
                    <MenuItem value='approved'>Se puede ejecutar</MenuItem>
                    <MenuItem value='rejected'>No se puede ejecutar</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Rol que revisa'
                    value={technicalReviewerRole}
                    onChange={(event) =>
                      setTechnicalReviewerRole(event.target.value)
                    }
                    helperText='Ej. Director técnico, Coordinador, Calidad o Laboratorio.'
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Observación técnica'
                    value={technicalReviewNotes}
                    onChange={(event) =>
                      setTechnicalReviewNotes(event.target.value)
                    }
                    multiline
                    minRows={2}
                  />
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Typography variant='subtitle2' fontWeight={800}>
                Revisión técnica
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Aprobada técnicamente por{' '}
                {String(
                  adjustment?.otherFields?.technicalReviewedByName ||
                    adjustment?.otherFields?.technicalReviewerRole ||
                    'director técnico / coordinador'
                )}
                .
              </Typography>
            </Stack>
          )}
          <Stack spacing={2}>
            <Typography variant='subtitle2' fontWeight={800}>
              Modificación contractual y soporte inmediato
            </Typography>
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
            {contractModificationRequired ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label='Aviso inmediato'
                    value={supportChannel}
                    onChange={(event) => setSupportChannel(event.target.value)}
                    helperText='Llamada, correo o WhatsApp de soporte a oficina.'
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
                    label='Soporte / referencia'
                    value={supportReference}
                    onChange={(event) =>
                      setSupportReference(event.target.value)
                    }
                    helperText='Ej. contacto, correo, hora o resumen del acuerdo propuesto.'
                  />
                </Grid>
              </Grid>
            ) : null}
          </Stack>
          {!isTechnicalReview ? (
            <>
              <Typography variant='subtitle2' fontWeight={800}>
                Revisión comercial
              </Typography>
              <TextField
                select
                fullWidth
                label='Decisión comercial'
                value={decision}
                onChange={(event) =>
                  setDecision(
                    event.target.value as Extract<
                      CalibrationServiceAdjustmentStatus,
                      'approved' | 'rejected'
                    >
                  )
                }
              >
                <MenuItem value='approved'>Aprobar novedad</MenuItem>
                <MenuItem value='rejected'>Rechazar novedad</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label='Observación comercial'
                value={commercialNotes}
                onChange={(event) => setCommercialNotes(event.target.value)}
                multiline
                minRows={2}
              />
              {decision === 'approved' && needsPricing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Notas de valoración'
                      value={pricingNotes}
                      onChange={(event) => setPricingNotes(event.target.value)}
                      multiline
                      minRows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={customerApprovalRequired}
                          onChange={(event) =>
                            setCustomerApprovalRequired(event.target.checked)
                          }
                        />
                      }
                      label='Esta novedad requiere validación del cliente/calidad antes de aplicarse'
                    />
                  </Grid>
                  {hasQuotedItemPrice && (isQuantityMore || isQuantityLess) ? (
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={useQuotedPrice}
                            onChange={(event) =>
                              setUseQuotedPrice(event.target.checked)
                            }
                          />
                        }
                        label={
                          isQuantityLess
                            ? 'Usar el mismo precio cotizado del ítem original como base del descuento'
                            : 'Usar el mismo precio cotizado del ítem original'
                        }
                      />
                    </Grid>
                  ) : null}
                  {isQuantityLess ? (
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={applyDiscount}
                            onChange={(event) =>
                              setApplyDiscount(event.target.checked)
                            }
                          />
                        }
                        label='Descontar del valor original por la menor cantidad recibida o ejecutada'
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Precio unitario'
                      value={approvedUnitPrice}
                      onChange={(event) =>
                        setApprovedUnitPrice(event.target.value)
                      }
                      InputProps={{
                        inputComponent: NumericFormatCustom as never
                      }}
                      helperText={
                        useQuotedPrice
                          ? `Cantidad a reconocer: ${pricedQuantity}. Desmarca la opción anterior si quieres cambiar el precio.`
                          : `Cantidad a reconocer: ${pricedQuantity}`
                      }
                      disabled={useQuotedPrice}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type='number'
                      label='IVA %'
                      value={approvedTaxRate}
                      onChange={(event) =>
                        setApprovedTaxRate(event.target.value)
                      }
                      inputProps={{ min: 0 }}
                      helperText='Opcional'
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Subtotal'
                      value={approvedUnitPrice ? signedSubtotal : ''}
                      InputProps={{
                        inputComponent: NumericFormatCustom as never,
                        readOnly: true
                      }}
                      helperText='Se calcula automáticamente'
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Valor IVA'
                      value={approvedUnitPrice ? signedTaxTotal : ''}
                      InputProps={{
                        inputComponent: NumericFormatCustom as never,
                        readOnly: true
                      }}
                      helperText='Se calcula automáticamente'
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Total aprobado'
                      value={approvedUnitPrice ? signedTotal : ''}
                      InputProps={{
                        inputComponent: NumericFormatCustom as never,
                        readOnly: true
                      }}
                      helperText={
                        isQuantityLess && !applyDiscount
                          ? 'No se aplicará descuento económico'
                          : 'Se calcula automáticamente'
                      }
                    />
                  </Grid>
                </Grid>
              ) : null}
            </>
          ) : null}
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
          Guardar decisión
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentReviewDialog
