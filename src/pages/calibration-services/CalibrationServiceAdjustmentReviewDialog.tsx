import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CalibrationServiceAdjustment,
  CalibrationServiceAdjustmentStatus
} from '../../types/calibrationService'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'

type TechnicalDecision = 'approved' | 'rejected'
type ReviewStage = 'technical' | 'commercial'

interface CalibrationServiceAdjustmentReviewDialogProps {
  open: boolean
  adjustments: CalibrationServiceAdjustment[]
  reviewStage: ReviewStage
  isLoading?: boolean
  onClose: () => void
  onSubmit: (
    adjustmentId: number,
    values: {
      reviewStage: ReviewStage
      decision?: Extract<
        CalibrationServiceAdjustmentStatus,
        'approved' | 'rejected'
      >
      technicalDecision?: TechnicalDecision
      technicalReviewNotes?: string | null
      technicalReviewerRole?: string | null
      technicalSignatureData?: string | null
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
    }
  ) => Promise<void>
}

// ─── Common fields (set once per session, shared across all items) ───

const CalibrationServiceAdjustmentReviewDialog = ({
  open,
  adjustments,
  reviewStage,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentReviewDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const adjustment = adjustments[currentIndex] || null
  const totalItems = adjustments.length
  const isLastItem = currentIndex >= totalItems - 1
  const isTechnicalReview = reviewStage === 'technical'

  // ── Common fields (persist across items) ──
  const [commonContractModification, setCommonContractModification] = useState(true)
  const [commonSupportChannel, setCommonSupportChannel] = useState('whatsapp')
  const [commonSupportReference, setCommonSupportReference] = useState('')
  const [commonTechnicalReviewerRole, setCommonTechnicalReviewerRole] = useState(
    'Director técnico / Coordinador / Calidad'
  )
  const [commonTechnicalSignatureData, setCommonTechnicalSignatureData] = useState<
    string | null
  >(null)

  // ── Per-item fields (reset on navigation) ──
  const [decision, setDecision] =
    useState<
      Extract<CalibrationServiceAdjustmentStatus, 'approved' | 'rejected'>
    >('approved')
  const [technicalDecision, setTechnicalDecision] =
    useState<TechnicalDecision>('approved')
  const [technicalReviewNotes, setTechnicalReviewNotes] = useState('')
  const [commercialNotes, setCommercialNotes] = useState('')
  const [pricingNotes, setPricingNotes] = useState('')
  const [approvedUnitPrice, setApprovedUnitPrice] = useState('')
  const [approvedTaxRate, setApprovedTaxRate] = useState('')
  const [useQuotedPrice, setUseQuotedPrice] = useState(false)
  const [customerApprovalRequired, setCustomerApprovalRequired] = useState(false)

  // Reset per-item fields on navigation
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
    setCustomerApprovalRequired(
      adjustment.otherFields &&
        typeof adjustment.otherFields.customerApprovalRequired === 'boolean'
        ? adjustment.otherFields.customerApprovalRequired
        : Boolean(adjustment.requiresCommercialAdjustment)
    )
  }, [open, adjustment])

  // Update common fields from first adjustment's existing data (only on dialog open)
  useEffect(() => {
    if (!open || !adjustments.length) {
      return
    }

    const first = adjustments[0]
    setCommonContractModification(
      first.otherFields &&
        typeof first.otherFields.contractModificationRequired === 'boolean'
        ? first.otherFields.contractModificationRequired
        : true
    )
    setCommonSupportChannel(
      first.otherFields &&
        typeof first.otherFields.supportChannel === 'string'
        ? first.otherFields.supportChannel
        : 'whatsapp'
    )
    setCommonSupportReference(
      first.otherFields &&
        typeof first.otherFields.supportReference === 'string'
        ? first.otherFields.supportReference
        : ''
    )
    if (isTechnicalReview) {
      setCommonTechnicalReviewerRole(
        first.otherFields &&
          typeof first.otherFields.technicalReviewerRole === 'string'
          ? first.otherFields.technicalReviewerRole
          : 'Director técnico / Coordinador / Calidad'
      )
      setCommonTechnicalSignatureData(
        first.otherFields &&
          typeof first.otherFields.technicalSignatureData === 'string'
          ? first.otherFields.technicalSignatureData
          : null
      )
    }
    // Only run on dialog open (not on every index change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const needsPricing = Boolean(adjustment?.requiresCommercialAdjustment)
  const isQuantityMore = adjustment?.changeType === 'quantity_more'
  const isQuantityLess = adjustment?.changeType === 'quantity_less'
  const isNotReceived = adjustment?.changeType === 'not_received'
  const isCreditType = isQuantityLess || isNotReceived
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
    isCreditType ? -approvedSubtotal : approvedSubtotal
  const signedTaxTotal =
    isCreditType ? -approvedTaxTotal : approvedTaxTotal
  const signedTotal =
    isCreditType ? -approvedTotal : approvedTotal
  const canSubmit =
    (!commonContractModification || Boolean(commonSupportChannel)) &&
    (isTechnicalReview ||
      adjustment?.otherFields?.technicalDecision === 'approved')

  const handleSave = async (closeAfter: boolean) => {
    if (!canSubmit || !adjustment) {
      return
    }

    setIsSaving(true)
    try {
      const autoApplyDiscount = isCreditType

      if (isTechnicalReview) {
        await onSubmit(adjustment.id, {
          reviewStage,
          technicalDecision,
          technicalReviewNotes: technicalReviewNotes.trim() || null,
          technicalReviewerRole: commonTechnicalReviewerRole.trim() || null,
          technicalSignatureData: commonTechnicalSignatureData,
          contractModificationRequired: commonContractModification,
          supportChannel: commonContractModification ? commonSupportChannel : null,
          supportReference: commonSupportReference.trim() || null,
          supportNotifiedAt: new Date().toISOString()
        })
      } else {
        await onSubmit(adjustment.id, {
          reviewStage,
          decision,
          contractModificationRequired: commonContractModification,
          supportChannel: commonContractModification ? commonSupportChannel : null,
          supportReference: commonSupportReference.trim() || null,
          supportNotifiedAt: new Date().toISOString(),
          commercialNotes: commercialNotes.trim() || null,
          pricingNotes: pricingNotes.trim() || null,
          approvedUnitPrice: approvedUnitPrice ? Number(approvedUnitPrice) : 0,
          approvedTaxRate: approvedTaxRate ? Number(approvedTaxRate) : null,
          approvedTaxTotal: approvedUnitPrice ? signedTaxTotal : 0,
          approvedSubtotal: approvedUnitPrice ? signedSubtotal : 0,
          approvedTotal: approvedUnitPrice ? signedTotal : 0,
          useQuotedPrice,
          applyDiscount: autoApplyDiscount,
          customerApprovalRequired
        })
      }

      if (closeAfter || isLastItem) {
        setCurrentIndex(0)
        onClose()
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setCurrentIndex(0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <span>
            {isTechnicalReview
              ? 'Revisión técnica de novedades'
              : 'Revisión comercial de novedades'}
          </span>
          {totalItems > 1 ? (
            <Typography variant='body2' color='text.secondary'>
              Novedad {currentIndex + 1} de {totalItems}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          {/* ── Common section: filled once per session ── */}
          <Stack
            spacing={2}
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant='subtitle2' fontWeight={800}>
              Datos comunes de la revisión
              <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                (se aplican a todas las novedades)
              </Typography>
            </Typography>

            {isTechnicalReview ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Rol que revisa'
                    value={commonTechnicalReviewerRole}
                    onChange={(event) =>
                      setCommonTechnicalReviewerRole(event.target.value)
                    }
                    helperText='Ej. Director técnico, Coordinador, Calidad o Laboratorio.'
                  />
                </Grid>
                <Grid item xs={12}>
                  <Accordion
                    variant='outlined'
                    slotProps={{ transition: { unmountOnExit: true } }}
                    sx={{
                      '&:before': { display: 'none' },
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant='body2' fontWeight={600}>
                        Firma del revisor técnico
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <SignaturePad
                        value={commonTechnicalSignatureData}
                        onChange={setCommonTechnicalSignatureData}
                        height={160}
                        helperText='La firma se guarda y aparece en el PDF anexo de la novedad.'
                      />
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Aprobada técnicamente por{' '}
                {String(
                  adjustment?.otherFields?.technicalReviewedByName ||
                    adjustment?.otherFields?.technicalReviewerRole ||
                    'director técnico / coordinador'
                )}
                .
              </Typography>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={commonContractModification}
                  onChange={(event) =>
                    setCommonContractModification(event.target.checked)
                  }
                />
              }
              label='Modificación de contrato: Sí'
            />
            {commonContractModification ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label='Aviso inmediato'
                    value={commonSupportChannel}
                    onChange={(event) => setCommonSupportChannel(event.target.value)}
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
                    value={commonSupportReference}
                    onChange={(event) =>
                      setCommonSupportReference(event.target.value)
                    }
                    helperText='Ej. contacto, correo, hora o resumen del acuerdo propuesto.'
                  />
                </Grid>
              </Grid>
            ) : null}
          </Stack>

          {/* ── Per-item section: changes on each navigation ── */}
          <Stack
            spacing={2}
            sx={{
              p: 2,
              bgcolor: 'info.soft',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'info.light'
            }}
          >
            <Typography variant='subtitle2' fontWeight={800}>
              Novedad actual
            </Typography>
            <Stack
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                p: 1.5,
                border: '1px solid',
                borderColor: 'secondary.light'
              }}
              spacing={1}
            >
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                <Typography variant='body1' fontWeight={700} color='primary.main'>
                  {adjustment?.itemName || 'Sin ítem'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  · {({
                      quantity_less: 'Cant. menor',
                      quantity_more: 'Cant. mayor',
                      extra_item: 'Item adicional',
                      not_received: 'No recibido',
                      scope_change: 'Cambio alcance'
                    }[adjustment?.changeType || ''] || adjustment?.changeType || '')}
                </Typography>
              </Stack>
              <Stack direction='row' spacing={2} flexWrap='wrap'>
                <Typography variant='caption' color='text.secondary'>
                  Cotizado: <strong>{adjustment?.quotedQuantity ?? '—'}</strong>
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Real: <strong>{adjustment?.actualQuantity ?? '—'}</strong>
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Diferencia:{' '}
                  <Typography
                    component='span'
                    variant='caption'
                    fontWeight={700}
                    color={(adjustment?.differenceQuantity || 0) > 0 ? 'warning.main' : 'text.primary'}
                  >
                    {adjustment?.differenceQuantity != null
                      ? `${adjustment.differenceQuantity > 0 ? '+' : ''}${adjustment.differenceQuantity}`
                      : '—'}
                  </Typography>
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {adjustment?.description ? `· ${adjustment.description}` : ''}
                </Typography>
              </Stack>
            </Stack>

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
                  <Grid item xs={12} md={6} />
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
                        helperText={
                          isCreditType
                            ? 'Valor negativo por menor cantidad (crédito)'
                            : 'Se calcula automáticamente'
                        }
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
                          isCreditType
                            ? 'Valor negativo: se descuenta automáticamente por ser menor cantidad'
                            : 'Se calcula automáticamente'
                        }
                      />
                    </Grid>
                  </Grid>
                ) : null}
              </>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack
          direction='row'
          spacing={1}
          sx={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Button onClick={handleClose} disabled={isSaving || isLoading}>
            Cancelar
          </Button>
          <Stack direction='row' spacing={1}>
            {totalItems > 1 ? (
              <Button
                variant='outlined'
                onClick={() => void handleSave(true)}
                disabled={!canSubmit || isSaving || isLoading}
              >
                Guardar y cerrar
              </Button>
            ) : null}
            <Button
              variant='contained'
              onClick={() => void handleSave(false)}
              disabled={!canSubmit || isSaving || isLoading}
            >
              {isLastItem || totalItems <= 1
                ? 'Guardar decisión'
                : 'Guardar y siguiente'}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentReviewDialog
