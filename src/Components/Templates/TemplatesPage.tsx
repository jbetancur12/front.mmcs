import { getApiErrorReason } from 'src/utils/apiError'
import SignalLoader from 'src/Components/Common/SignalLoader'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import CommonEmptyState from 'src/Components/Common/EmptyState'
import React, { useState } from 'react'
import { Alert, Button, Container, Grid } from '@mui/material'
import { Add as AddIcon, Description } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { notify } from 'src/utils/notify'
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate
} from '@hooks/templates/useTemplates'
import { TemplatesData, TemplateData } from './types'
import CreateTemplateModal from './CreateTemplateModal'
import DuplicateTemplateModal from './DuplicateTemplateModal'
import TemplatesTable from './TemplatesTable'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import { logger } from 'src/utils/logger'
import { brand } from 'src/theme/designTokens'

const TemplatesPage: React.FC = () => {
  const canManageTemplates = useCan(PERMISSIONS.CALIBRATION_TEMPLATE_MANAGE)

  const {
    data: templatesData,
    isFetching: loading,
    error: templatesError
  } = useTemplates<TemplatesData>()
  const templates = templatesData ?? []
  const createTemplateMutation = useCreateTemplate()
  const updateTemplateMutation = useUpdateTemplate()
  const deleteTemplateMutation = useDeleteTemplate()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [templateToDuplicate, setTemplateToDuplicate] =
    useState<TemplatesData | null>(null)
  const [templateToDelete, setTemplateToDelete] =
    useState<TemplatesData | null>(null)

  // Crear y duplicar usan el mismo endpoint; devuelven si salió bien para que
  // el diálogo se cierre solo con éxito y conserve lo escrito si falla.
  const saveNewTemplate = async (
    templateData: TemplateData,
    successMessage: string,
    failureMessage: string
  ): Promise<boolean> => {
    try {
      const response = await createTemplateMutation.mutateAsync(templateData)
      if (response.status >= 200 && response.status < 300) {
        notify.success(successMessage)
        return true
      }
      return false
    } catch (error: unknown) {
      logger.error('Error al guardar la plantilla:', error)
      const status = (error as { response?: { status?: number } }).response
        ?.status
      notify.error(
        getApiErrorReason(error) ||
          (status === 409
            ? 'Ya existe una plantilla con ese nombre'
            : failureMessage)
      )
      return false
    }
  }

  const handleCreateTemplate = (templateData: TemplateData) =>
    saveNewTemplate(
      templateData,
      'Plantilla creada',
      'No se pudo crear la plantilla. Intenta de nuevo.'
    )

  const handleDuplicateTemplate = async (templateData: TemplateData) => {
    const saved = await saveNewTemplate(
      templateData,
      'Plantilla duplicada',
      'No se pudo duplicar la plantilla. Intenta de nuevo.'
    )
    if (saved) setTemplateToDuplicate(null)
    return saved
  }

  const handleUpdateTemplate = async (
    id: number,
    templateData: TemplateData
  ) => {
    try {
      const response = await updateTemplateMutation.mutateAsync({
        id,
        payload: templateData
      })
      if (response.status === 200 || response.status === 201) {
        notify.success('Plantilla actualizada')
        return true
      }
      return false
    } catch (error: unknown) {
      logger.error('Error al actualizar la plantilla:', error)
      notify.error(
        getApiErrorReason(error) ||
          'No se pudo actualizar la plantilla. Intenta de nuevo.'
      )
      return false
    }
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return
    try {
      const response = await deleteTemplateMutation.mutateAsync(
        templateToDelete.id
      )
      if (response.status >= 200 && response.status < 300) {
        notify.success('Plantilla eliminada')
      }
    } catch (error: unknown) {
      logger.error('Error al eliminar la plantilla:', error)
      notify.error(
        getApiErrorReason(error) ||
          'No se pudo eliminar la plantilla. Intenta de nuevo.'
      )
    } finally {
      setTemplateToDelete(null)
    }
  }

  const handleDuplicateAction = (template: TemplatesData) => {
    setTemplateToDuplicate(template)
    setDuplicateModalOpen(true)
  }

  const createButton = canManageTemplates ? (
    <Button
      variant='contained'
      startIcon={<AddIcon />}
      onClick={() => setCreateModalOpen(true)}
      sx={{
        bgcolor: brand.main,
        whiteSpace: 'nowrap',
        '&:hover': { bgcolor: brand.hover }
      }}
    >
      Crear plantilla
    </Button>
  ) : undefined

  if (loading && templates.length === 0) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <SignalLoader message='Cargando plantillas...' />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Plantillas'
        subtitle='Plantillas que definen las celdas de lectura de los archivos Excel'
        icon={<Description />}
        actions={createButton}
      />

      {templatesError ? (
        <Alert severity='error' variant='outlined' sx={{ mb: 3 }}>
          No se pudieron cargar las plantillas. Recarga la página para
          intentarlo de nuevo.
        </Alert>
      ) : null}

      {templates.length === 0 && !templatesError ? (
        <CommonEmptyState
          icon={<Description />}
          title='Aún no hay plantillas'
          hint={
            canManageTemplates
              ? 'Crea la primera para indicar en qué celda del Excel está cada dato.'
              : 'Cuando se cree una, aparecerá aquí.'
          }
          action={createButton}
        />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <LmsStatCard
                label='Plantillas'
                value={templates.length}
                icon={<Description />}
                tone='teal'
              />
            </Grid>
          </Grid>

          <TemplatesTable
            templates={templates}
            loading={loading}
            onUpdate={handleUpdateTemplate}
            onDelete={(id) =>
              setTemplateToDelete(templates.find((t) => t.id === id) ?? null)
            }
            onDuplicate={handleDuplicateAction}
          />
        </>
      )}

      <CreateTemplateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      {templateToDuplicate && (
        <DuplicateTemplateModal
          open={duplicateModalOpen}
          template={templateToDuplicate}
          existingTemplates={templates}
          onClose={() => {
            setDuplicateModalOpen(false)
            setTemplateToDuplicate(null)
          }}
          onSubmit={handleDuplicateTemplate}
        />
      )}

      <ConfirmDialog
        open={Boolean(templateToDelete)}
        title='Eliminar plantilla'
        tone='danger'
        message={
          <>
            Vas a eliminar <strong>{templateToDelete?.name}</strong>. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteTemplateMutation.isLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setTemplateToDelete(null)}
      />
    </Container>
  )
}

export default TemplatesPage
