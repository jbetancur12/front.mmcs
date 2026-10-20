// Enhanced Templates Page - Main Container Component
import React, { useState } from 'react'
import { Button, Container, Grid, Typography, Box } from '@mui/material'
import { Add as AddIcon, Description } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { bigToast } from '../ExcelManipulation/Utils'
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate
} from '@hooks/templates/useTemplates'
import { TemplatesData, TemplateData, ErrorState } from './types'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import CreateTemplateModal from './CreateTemplateModal'
import DuplicateTemplateModal from './DuplicateTemplateModal'
import TemplatesTable from './TemplatesTable'
import SkipLinks from './SkipLinks'
import { AnimationProvider } from './AnimationProvider'
import { AnimatedBox } from './AnimatedComponents'
import { useAccessibility } from './hooks/useAccessibility'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

const TemplatesPage: React.FC = () => {
  const canManageTemplates = useCan(PERMISSIONS.CALIBRATION_TEMPLATE_MANAGE)
  const { announce } = useAccessibility({ announceChanges: true })

  // State management
  const {
    data: templatesData,
    isFetching: loading,
    error: templatesError
  } = useTemplates<TemplatesData>()
  const templates = templatesData ?? []
  const error: ErrorState | null = templatesError
    ? {
        type: 'network',
        message: 'Error al cargar las plantillas. Por favor, intenta de nuevo.',
        code: (
          templatesError as { response?: { status?: number } }
        ).response?.status?.toString()
      }
    : null
  const createTemplateMutation = useCreateTemplate()
  const updateTemplateMutation = useUpdateTemplate()
  const deleteTemplateMutation = useDeleteTemplate()

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [templateToDuplicate, setTemplateToDuplicate] =
    useState<TemplatesData | null>(null)

  // Handle template creation
  const handleCreateTemplate = async (templateData: TemplateData) => {
    try {
      const response = await createTemplateMutation.mutateAsync(templateData)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla creada exitosamente!', 'success')
        setCreateModalOpen(false)
      }
    } catch (error: any) {
      console.error('Error creating template:', error)

      if (error.response?.status === 409) {
        bigToast(
          error.response.data.message ||
            'Ya existe una plantilla con ese nombre',
          'error'
        )
      } else {
        bigToast(
          error.response?.data?.error ||
            'Error al crear la plantilla. Por favor, intenta de nuevo.',
          'error'
        )
      }
    }
  }

  // Handle template duplication
  const handleDuplicateTemplate = async (templateData: TemplateData) => {
    try {
      const response = await createTemplateMutation.mutateAsync(templateData)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla duplicada exitosamente!', 'success')
        setDuplicateModalOpen(false)
        setTemplateToDuplicate(null)
      }
    } catch (error: any) {
      console.error('Error duplicating template:', error)

      if (error.response?.status === 409) {
        bigToast(
          error.response.data.message ||
            'Ya existe una plantilla con ese nombre',
          'error'
        )
      } else {
        bigToast(
          error.response?.data?.error ||
            'Error al duplicar la plantilla. Por favor, intenta de nuevo.',
          'error'
        )
      }
    }
  }

  // Handle template update
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
        bigToast('Plantilla actualizada exitosamente!', 'success')
        return true
      }
      return false
    } catch (error: any) {
      console.error('Error updating template:', error)
      bigToast(
        error.response?.data?.error ||
          'Error al actualizar la plantilla. Por favor, intenta de nuevo.',
        'error'
      )
      return false
    }
  }

  // Handle template deletion
  const handleDeleteTemplate = async (id: number) => {
    const shouldDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.'
    )

    if (!shouldDelete) return

    try {
      const response = await deleteTemplateMutation.mutateAsync(id)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla eliminada exitosamente!', 'success')
      }
    } catch (error: any) {
      console.error('Error deleting template:', error)
      bigToast(
        error.response?.data?.error ||
          'Error al eliminar la plantilla. Por favor, intenta de nuevo.',
        'error'
      )
    }
  }

  // Handle duplicate action
  const handleDuplicateAction = (template: TemplatesData) => {
    setTemplateToDuplicate(template)
    setDuplicateModalOpen(true)
  }

  // Render loading state
  if (loading && templates.length === 0) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <LoadingState />
      </Container>
    )
  }

  // Render empty state
  if (!loading && templates.length === 0 && !error) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <LmsPageHeader
          title='Plantillas'
          subtitle='Plantillas que definen las celdas de lectura de los archivos Excel'
          icon={<Description />}
          actions={
            canManageTemplates && (
            <Button variant='contained' startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
              Crear plantilla
            </Button>
          )
          }
        />

        {canManageTemplates ? (
          <EmptyState onCreateTemplate={() => setCreateModalOpen(true)} />
        ) : (
          <Typography color='text.secondary'>
            No hay plantillas para mostrar.
          </Typography>
        )}

        <CreateTemplateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateTemplate}
        />
      </Container>
    )
  }

  return (
    <AnimationProvider>
      <Container maxWidth='xl' sx={{ py: 3 }}>
        {/* Skip Links for Accessibility */}
        <SkipLinks />

        {/* Main Content */}
        <Box component='main' id='main-content'>
          <LmsPageHeader
            title='Plantillas'
            subtitle='Plantillas que definen las celdas de lectura de los archivos Excel'
            icon={<Description />}
            actions={
              canManageTemplates && (
                <Button
                  id='create-template'
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => {
                    announce('Abriendo formulario para crear nueva plantilla')
                    setCreateModalOpen(true)
                  }}
                  aria-describedby='create-template-help'
                  sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
                >
                  Crear plantilla
                </Button>
              )
            }
          />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <LmsStatCard label='Plantillas' value={templates.length} icon={<Description />} tone='teal' />
            </Grid>
          </Grid>

          <Typography
            id='create-template-help'
            variant='body2'
            sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
          >
            Abre un formulario para crear una nueva plantilla de mapeo Excel
          </Typography>

          <AnimatedBox animation='fadeIn' delay={300}>
            <TemplatesTable
              templates={templates}
              loading={loading}
              onUpdate={handleUpdateTemplate}
              onDelete={handleDeleteTemplate}
              onDuplicate={handleDuplicateAction}
            />
          </AnimatedBox>

          {/* Create Template Modal */}
          <CreateTemplateModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateTemplate}
          />

          {/* Duplicate Template Modal */}
          {templateToDuplicate && (
            <DuplicateTemplateModal
              open={duplicateModalOpen}
              template={templateToDuplicate}
              onClose={() => {
                setDuplicateModalOpen(false)
                setTemplateToDuplicate(null)
              }}
              onSubmit={handleDuplicateTemplate}
            />
          )}
        </Box>
      </Container>
    </AnimationProvider>
  )
}

export default TemplatesPage
