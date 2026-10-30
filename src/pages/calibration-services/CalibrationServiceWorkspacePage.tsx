import SignalLoader from 'src/Components/Common/SignalLoader'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import { useNavigate } from 'react-router-dom'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import CalibrationServiceItemsEditor from './CalibrationServiceItemsEditor'
import CatalogProductPickerDialog from './CatalogProductPickerDialog'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'
import CalibrationServiceCustomerDialog from './CalibrationServiceCustomerDialog'
import {
  CATALOG_PRICE_SOURCE_OPTIONS,
  sectionCardSx,
  SUGGESTED_CATALOG_PRICE_SOURCE,
  tealOutlineSx
} from './workspace/calibrationServiceWorkspaceConstants'
import { WORKSPACE_SECTIONS } from './workspace/calibrationServiceWorkspaceSections'
import { getWorkspaceSummary } from './workspace/calibrationServiceWorkspaceSummary'
import CalibrationServiceWorkspaceSectionTabs from './workspace/CalibrationServiceWorkspaceSectionTabs'
import CalibrationServiceWorkspaceCustomerSection from './workspace/CalibrationServiceWorkspaceCustomerSection'
import CalibrationServiceWorkspaceContactSection from './workspace/CalibrationServiceWorkspaceContactSection'
import CalibrationServiceWorkspaceTermsSection from './workspace/CalibrationServiceWorkspaceTermsSection'
import CalibrationServiceWorkspaceCommercialSection from './workspace/CalibrationServiceWorkspaceCommercialSection'
import CalibrationServiceWorkspaceSummaryCard from './workspace/CalibrationServiceWorkspaceSummaryCard'
import CalibrationServiceWorkspaceActionBar from './workspace/CalibrationServiceWorkspaceActionBar'
import useCalibrationServiceWorkspaceData from './workspace/useCalibrationServiceWorkspaceData'
import useCalibrationServiceWorkspaceForm from './workspace/useCalibrationServiceWorkspaceForm'
import useCalibrationServiceWorkspaceNavigation from './workspace/useCalibrationServiceWorkspaceNavigation'
import useCalibrationServiceWorkspaceActions from './workspace/useCalibrationServiceWorkspaceActions'
import useCalibrationServiceWorkspaceCustomerActions from './workspace/useCalibrationServiceWorkspaceCustomerActions'
import useWorkspaceActionBarBox from './workspace/useWorkspaceActionBarBox'

/** Formulario por pasos para crear o editar la cotización base de un servicio de calibración. */
const CalibrationServiceWorkspacePage = () => {
  const navigate = useNavigate()
  const data = useCalibrationServiceWorkspaceData()
  const {
    serviceId,
    isEditing,
    canResetSequence,
    canAccessWorkspace,
    sequenceConfig,
    service,
    customerOptions,
    hasCustomersError,
    productOptions,
    catalogErrors,
    requestEvidenceDocuments,
    hasCustomerChangeRequest,
    latestChangeRequest,
    canEdit,
    isPageLoading
  } = data
  const form = useCalibrationServiceWorkspaceForm(data)
  const {
    formState,
    requestEvidenceFile,
    selectedCustomer,
    setItemField,
    setItemOtherField,
    handleAddItemsFromCatalog,
    handleRemoveItem,
    handleSelectProduct,
    handleSelectCatalogPrice
  } = form
  const navigation = useCalibrationServiceWorkspaceNavigation()
  const { activeSection, goToSection } = navigation
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false)
  const summary = getWorkspaceSummary({
    formState,
    hasRequestEvidence: Boolean(requestEvidenceFile || requestEvidenceDocuments.length)
  })
  const {
    upsertSequenceConfig,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    validationErrorItemIds,
    isBusy,
    handleSave,
    handleSaveSequenceConfig
  } = useCalibrationServiceWorkspaceActions({ data, form, summary, navigation })
  const {
    customerDialogMode,
    setCustomerDialogMode,
    isSubmitting: isSubmittingCustomer,
    handleCustomerDialogSubmit
  } = useCalibrationServiceWorkspaceCustomerActions(form)
  const { containerRef, actionBarBox } = useWorkspaceActionBarBox(isPageLoading, canAccessWorkspace)

  const handleAddItem = () => {
    setCatalogPickerOpen(true)
  }

  if (isPageLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='55vh'>
        <SignalLoader />
      </Box>
    )
  }

  if (!canAccessWorkspace) {
    return (
      <Box p={3}>
        <Alert severity='warning'>
          Tu rol actual puede consultar servicios, pero no crear ni editar esta
          etapa del flujo.
        </Alert>
      </Box>
    )
  }

  return (
    <Container ref={containerRef} maxWidth='xl' sx={{ py: 3 }}>

      <LmsPageHeader
        icon={<RequestQuoteOutlinedIcon />}
        title={isEditing ? `Editar ${service?.quoteCode || service?.serviceCode || 'servicio'}` : 'Nuevo servicio de calibración'}
        subtitle='Cotización base con cliente, sede, condiciones comerciales, ítems y evidencia de solicitud.'
        actions={
          <>
            {service ? (
              <>
                <Chip color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]} label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]} sx={{ fontWeight: 700 }} />
                <Chip variant='outlined' color={CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]} label={CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]} sx={{ fontWeight: 700 }} />
              </>
            ) : null}
            {sequenceConfig?.initialized ? (
              <Button variant='outlined' onClick={() => setIsSequenceDialogOpen(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Consecutivos y metrólogo
              </Button>
            ) : null}
            <Button
              variant='outlined'
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() =>
                navigate(isEditing && serviceId ? `/calibration-services/${serviceId}` : '/calibration-services')
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Volver
            </Button>
          </>
        }
      />

      {!canEdit ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Este servicio ya no puede editarse desde el formulario base porque supero la etapa comercial inicial.
        </Alert>
      ) : null}

      {canEdit && hasCustomerChangeRequest ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          El cliente pidió modificar esta cotización.
          {typeof latestChangeRequest?.changeRequestReason === 'string'
            ? ` Motivo: ${latestChangeRequest.changeRequestReason}`
            : ''}
        </Alert>
      ) : null}

      {canAccessWorkspace && sequenceConfig && !sequenceConfig.initialized ? (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          Antes de guardar la primera cotización, define los consecutivos iniciales de oferta y ODS.
        </Alert>
      ) : null}

      {catalogErrors.length ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {catalogErrors.join(' ')}
        </Alert>
      ) : null}

      <CalibrationServiceWorkspaceSectionTabs
        activeSection={activeSection}
        goToSection={goToSection}
        pendingBySection={summary.pendingBySection}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <div style={{ display: activeSection !== 0 ? 'none' : undefined }}>
            <CalibrationServiceWorkspaceCustomerSection
              form={form}
              canEdit={canEdit}
              isBusy={isBusy}
              customerOptions={customerOptions}
              hasCustomersError={hasCustomersError}
              requestEvidenceDocuments={requestEvidenceDocuments}
              setCustomerDialogMode={setCustomerDialogMode}
            />
          </div>

          <div style={{ display: activeSection !== 1 ? 'none' : undefined }}>
            <CalibrationServiceWorkspaceContactSection form={form} canEdit={canEdit} isBusy={isBusy} />
          </div>


          <div style={{ display: activeSection !== 2 ? 'none' : undefined }}>
            <CalibrationServiceWorkspaceTermsSection form={form} canEdit={canEdit} isBusy={isBusy} />
          </div>

          <div style={{ display: activeSection !== 3 ? 'none' : undefined }}>
          <Card elevation={0} sx={sectionCardSx}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, pBottom: { xs: 2, md: 3 } }}>
              <CalibrationServiceItemsEditor
                items={formState.items}
                products={productOptions}
                catalogPriceSourceOptions={CATALOG_PRICE_SOURCE_OPTIONS}
                suggestedCatalogPriceSource={SUGGESTED_CATALOG_PRICE_SOURCE}
                canEdit={canEdit}
                isBusy={isBusy}
                validationErrorItemIds={validationErrorItemIds}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onSelectProduct={handleSelectProduct}
                onSelectCatalogPrice={handleSelectCatalogPrice}
                onChangeItemField={setItemField}
                onChangeItemOtherField={setItemOtherField}
              />
            </CardContent>
          </Card>
          </div>

          <div style={{ display: activeSection !== 4 ? 'none' : undefined }}>
            <CalibrationServiceWorkspaceCommercialSection form={form} canEdit={canEdit} isBusy={isBusy} />
          </div>

          <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => goToSection(activeSection - 1)}
              disabled={activeSection === 0}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#4b5563' }}
            >
              Anterior
            </Button>
            {activeSection < WORKSPACE_SECTIONS.length - 1 ? (
              <Button
                variant='outlined'
                endIcon={<ArrowForwardOutlinedIcon />}
                onClick={() => goToSection(activeSection + 1)}
                sx={tealOutlineSx}
              >
                Siguiente: {WORKSPACE_SECTIONS[activeSection + 1].label}
              </Button>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Último paso: revisa el resumen y guarda o envía la cotización.
              </Typography>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <CalibrationServiceWorkspaceSummaryCard summary={summary} goToSection={goToSection} />
        </Grid>
      </Grid>

      {/* Acciones siempre visibles: estado de lo que falta y guardar / enviar */}
      <CalibrationServiceWorkspaceActionBar
        summary={summary}
        actionBarBox={actionBarBox}
        isSaveDisabled={!canEdit || isBusy || !sequenceConfig?.initialized}
        goToSection={goToSection}
        handleSave={handleSave}
      />
      <CatalogProductPickerDialog
        open={catalogPickerOpen}
        products={productOptions}
        onClose={() => setCatalogPickerOpen(false)}
        onAddItems={handleAddItemsFromCatalog}
      />
      {canAccessWorkspace ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={upsertSequenceConfig.isLoading}
          config={sequenceConfig}
          canResetSequence={canResetSequence}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
      <CalibrationServiceCustomerDialog
        open={Boolean(customerDialogMode)}
        mode={customerDialogMode || 'customer'}
        customer={selectedCustomer}
        isSubmitting={isSubmittingCustomer}
        onClose={() => setCustomerDialogMode(null)}
        onSubmit={handleCustomerDialogSubmit}
      />
    </Container>
  )
}

export default CalibrationServiceWorkspacePage
