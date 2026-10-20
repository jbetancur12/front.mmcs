import { useStore } from '@nanostores/react'
import { Alert, Box, Button, CircularProgress, Container } from '@mui/material'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import { Toaster } from 'react-hot-toast'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { useCalibrationServices } from '../../hooks/useCalibrationServices'
import { userStore } from '../../store/userStore'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'
import CalibrationServiceSlaConfigDialog from './CalibrationServiceSlaConfigDialog'
import CalibrationServicesHeaderActions from './list/CalibrationServicesHeaderActions'
import CalibrationServicesSummary from './list/CalibrationServicesSummary'
import CalibrationServicesFiltersCard from './list/CalibrationServicesFiltersCard'
import CalibrationServicesGroupedList from './list/CalibrationServicesGroupedList'
import CalibrationServicesTable from './list/CalibrationServicesTable'
import CalibrationServicesKanban from './list/CalibrationServicesKanban'
import CalibrationServiceQuoteTermsTemplateDialog from './list/CalibrationServiceQuoteTermsTemplateDialog'
import useCalibrationServicesListPermissions from './list/useCalibrationServicesListPermissions'
import useCalibrationServicesListFilters from './list/useCalibrationServicesListFilters'
import useCalibrationServicesListActions from './list/useCalibrationServicesListActions'
import useCalibrationServicesListData from './list/useCalibrationServicesListData'

/** Bandeja de servicios de calibración: lista agrupada, tabla o kanban con filtros operativos. */
const CalibrationServicesPage = () => {
  const $userStore = useStore(userStore)
  const permissions = useCalibrationServicesListPermissions()
  const {
    canViewModule,
    canManageSequenceConfig,
    canManageSlaConfig,
    isAdmin,
    isTechnicalOnlyView,
    isAnalystOnlyView
  } = permissions
  const filters = useCalibrationServicesListFilters(isTechnicalOnlyView)
  const actions = useCalibrationServicesListActions({
    permissions,
    queryFilters: filters.queryFilters
  })
  const {
    sequenceConfig,
    slaConfig,
    upsertSequenceConfig,
    upsertSlaConfig,
    upsertQuoteTermsTemplate,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    isSlaConfigDialogOpen,
    setIsSlaConfigDialogOpen,
    templateDialogOpen,
    setTemplateDialogOpen,
    templateTerms,
    setTemplateTerm,
    handleSaveSequenceConfig,
    handleSaveSlaConfig,
    handleSaveTemplate,
    openServiceDetail
  } = actions

  const { data, isLoading, isError, error } = useCalibrationServices(filters.queryFilters)
  const {
    metrologistOptions,
    visibleServices,
    counts,
    kanbanServices,
    groupedListServices,
    currentUserHasAssignedLoad,
    myLoadCount
  } = useCalibrationServicesListData({
    services: data?.services ?? [],
    filters,
    isTechnicalOnlyView,
    userEmail: $userStore.email
  })

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='55vh'
      >
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar los servicios de calibración.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  if (!canViewModule) {
    return (
      <Box p={3}>
        <Alert severity='warning'>
          Tu rol actual no tiene acceso a esta bandeja.
        </Alert>
      </Box>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Toaster position='top-center' />

      <LmsPageHeader
        title='Servicios de calibración'
        subtitle={
          isTechnicalOnlyView
            ? 'Bandeja técnica para ODS, programación y seguimiento operativo del servicio.'
            : 'Bandeja operativa para cotización, respuesta del cliente, emisión de ODS y seguimiento base del servicio.'
        }
        icon={<ScienceOutlinedIcon />}
        actions={
          <CalibrationServicesHeaderActions permissions={permissions} actions={actions} />
        }
      />

      {canManageSequenceConfig && sequenceConfig ? (
        <Alert
          severity={sequenceConfig.initialized ? 'info' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          {sequenceConfig.initialized
            ? 'Puedes ajustar el metrólogo de laboratorio y los consecutivos desde la configuración.'
            : 'Antes de crear la primera oferta o emitir la primera ODS, define los consecutivos iniciales del módulo.'}
        </Alert>
      ) : null}

      <CalibrationServicesSummary
        counts={counts}
        visibleCount={visibleServices.length}
        totalItems={data?.totalItems ?? 0}
        isTechnicalOnlyView={isTechnicalOnlyView}
        clearFilters={filters.clearFilters}
        setStatusFilter={filters.setStatusFilter}
        setSlaFilter={filters.setSlaFilter}
        setAreFiltersOpen={filters.setAreFiltersOpen}
      />

      <CalibrationServicesFiltersCard
        filters={filters}
        isTechnicalOnlyView={isTechnicalOnlyView}
        isAnalystOnlyView={isAnalystOnlyView}
        visibleCount={visibleServices.length}
        myLoadCount={myLoadCount}
        currentUserHasAssignedLoad={currentUserHasAssignedLoad}
        metrologistOptions={metrologistOptions}
      />

      {visibleServices.length === 0 ? (
        <Alert severity='info'>
          No encontramos servicios con los filtros actuales.
        </Alert>
      ) : filters.viewMode === 'list' ? (
        <CalibrationServicesGroupedList
          groups={groupedListServices}
          permissions={permissions}
          actions={actions}
          currentUserEmail={$userStore.email}
        />
      ) : filters.viewMode === 'table' ? (
        <CalibrationServicesTable
          services={visibleServices}
          isTechnicalOnlyView={isTechnicalOnlyView}
          isAnalystOnlyView={isAnalystOnlyView}
          openServiceDetail={openServiceDetail}
        />
      ) : (
        <CalibrationServicesKanban
          columns={kanbanServices}
          isTechnicalOnlyView={isTechnicalOnlyView}
          openServiceDetail={openServiceDetail}
        />
      )}
      {canManageSequenceConfig ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={upsertSequenceConfig.isLoading}
          config={sequenceConfig}
          isAdmin={isAdmin}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
      {canManageSlaConfig ? (
        <CalibrationServiceSlaConfigDialog
          open={isSlaConfigDialogOpen}
          isLoading={upsertSlaConfig.isLoading}
          config={slaConfig}
          onClose={() => setIsSlaConfigDialogOpen(false)}
          onSubmit={handleSaveSlaConfig}
        />
      ) : null}

      <CalibrationServiceQuoteTermsTemplateDialog
        open={templateDialogOpen}
        terms={templateTerms}
        isSaving={upsertQuoteTermsTemplate.isLoading}
        onClose={() => setTemplateDialogOpen(false)}
        onChangeTerm={setTemplateTerm}
        onSave={handleSaveTemplate}
      />
    </Container>
  )
}

export default CalibrationServicesPage
