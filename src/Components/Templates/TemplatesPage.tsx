// Enhanced Templates Page - Main Container Component
import React, { useState, useEffect, useCallback } from 'react'
import { Typography, Box } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { bigToast } from '../ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
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
import { CreateButton, PageHeader, ContentContainer } from './styles'

const TemplatesPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { announce } = useAccessibility({ announceChanges: true })

  // State management
  const [templates, setTemplates] = useState<TemplatesData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<ErrorState | null>(null)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [templateToDuplicate, setTemplateToDuplicate] =
    useState<TemplatesData | null>(null)

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axiosPrivate.get('/templates')
      if (response.status === 200) {
        setTemplates(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      setError({
        type: 'network',
        message: 'Error al cargar las plantillas. Por favor, intenta de nuevo.',
        code: error.response?.status?.toString()
      })
    } finally {
      setLoading(false)
    }
  }, [axiosPrivate])

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Handle template creation
  const handleCreateTemplate = async (templateData: TemplateData) => {
    try {
      const response = await axiosPrivate.post('/templates', templateData)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla creada exitosamente!', 'success')
        await fetchTemplates() // Refresh the list
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
      const response = await axiosPrivate.post('/templates', templateData)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla duplicada exitosamente!', 'success')
        await fetchTemplates() // Refresh the list
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
      const response = await axiosPrivate.put(`/templates/${id}`, templateData)

      if (response.status === 200 || response.status === 201) {
        bigToast('Plantilla actualizada exitosamente!', 'success')
        await fetchTemplates() // Refresh the list
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
      const response = await axiosPrivate.delete(`/templates/${id}`)

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla eliminada exitosamente!', 'success')
        await fetchTemplates() // Refresh the list
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
      <ContentContainer>
        <LoadingState />
      </ContentContainer>
    )
  }

  // Render empty state
  if (!loading && templates.length === 0 && !error) {
    return (
      <ContentContainer>
        <PageHeader>
          <Box>
            <Typography variant='h4' component='h1' gutterBottom>
              Gestión de Plantillas
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Administra las plantillas para el procesamiento de datos Excel
            </Typography>
          </Box>
          <CreateButton
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Nueva Plantilla
          </CreateButton>
        </PageHeader>

        <EmptyState onCreateTemplate={() => setCreateModalOpen(true)} />

        <CreateTemplateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateTemplate}
        />
      </ContentContainer>
    )
  }

  return (
    <AnimationProvider>
      <ContentContainer>
        {/* Skip Links for Accessibility */}
        <SkipLinks />

        {/* Main Content */}
        <Box component='main' id='main-content'>
          <PageHeader>
            <AnimatedBox animation='slideDown' delay={100}>
              <Typography variant='h4' component='h1' gutterBottom>
                Gestión de Plantillas de Mapeo Excel
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Administra las plantillas que definen referencias de celdas para
                automatizar la lectura de archivos Excel ({templates.length}{' '}
                plantillas)
              </Typography>
            </AnimatedBox>
            <AnimatedBox animation='slideDown' delay={200}>
              <CreateButton
                id='create-template'
                startIcon={<AddIcon />}
                onClick={() => {
                  announce('Abriendo formulario para crear nueva plantilla')
                  setCreateModalOpen(true)
                }}
                aria-describedby='create-template-help'
              >
                Crear Nueva Plantilla
              </CreateButton>
            </AnimatedBox>
            <Typography
              id='create-template-help'
              variant='body2'
              sx={{
                position: 'absolute',
                left: '-10000px',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
              }}
            >
              Abre un formulario para crear una nueva plantilla de mapeo Excel
            </Typography>
          </PageHeader>

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
      </ContentContainer>
    </AnimationProvider>
  )
}

export default TemplatesPage
