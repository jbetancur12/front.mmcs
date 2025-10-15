// Template Actions Component with Enhanced Button Styling and Accessibility
import React from 'react'
import { Tooltip } from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon
} from '@mui/icons-material'
import { TemplatesData } from './types'
import { useAccessibility } from './hooks/useAccessibility'
import {
  ActionButtonsContainer,
  EditButton,
  DeleteButton,
  DuplicateButton
} from './styles'

interface TemplateActionsProps {
  template: TemplatesData
  onEdit: (template: TemplatesData) => void
  onDelete: (id: number) => void
  onDuplicate: (template: TemplatesData) => void
}

const TemplateActions: React.FC<TemplateActionsProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const { announce } = useAccessibility()

  const handleEdit = () => {
    announce(`Editando plantilla: ${template.name}`)
    onEdit(template)
  }

  const handleDelete = () => {
    announce(`Eliminando plantilla: ${template.name}`)
    onDelete(template.id)
  }

  const handleDuplicate = () => {
    announce(`Duplicando plantilla: ${template.name}`)
    onDuplicate(template)
  }

  return (
    <ActionButtonsContainer
      role='group'
      aria-label={`Acciones para plantilla ${template.name}`}
    >
      <Tooltip title='Duplicar plantilla' arrow>
        <DuplicateButton
          onClick={handleDuplicate}
          size='small'
          aria-label={`Duplicar plantilla ${template.name}`}
        >
          <DuplicateIcon fontSize='small' />
        </DuplicateButton>
      </Tooltip>

      <Tooltip title='Editar plantilla' arrow>
        <EditButton
          onClick={handleEdit}
          size='small'
          aria-label={`Editar plantilla ${template.name}`}
        >
          <EditIcon fontSize='small' />
        </EditButton>
      </Tooltip>

      <Tooltip title='Eliminar plantilla' arrow>
        <DeleteButton
          onClick={handleDelete}
          size='small'
          aria-label={`Eliminar plantilla ${template.name}`}
        >
          <DeleteIcon fontSize='small' />
        </DeleteButton>
      </Tooltip>
    </ActionButtonsContainer>
  )
}

export default TemplateActions
