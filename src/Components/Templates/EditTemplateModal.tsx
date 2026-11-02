import React from 'react'
import { TemplatesData, TemplateData } from './types'
import TemplateFormDialog from './TemplateFormDialog'

interface EditTemplateModalProps {
  open: boolean
  template: TemplatesData | null
  onClose: () => void
  onSubmit: (templateData: TemplateData) => Promise<boolean>
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  open,
  template,
  onClose,
  onSubmit
}) => (
  <TemplateFormDialog
    open={open}
    mode='edit'
    template={template}
    onClose={onClose}
    onSubmit={onSubmit}
  />
)

export default EditTemplateModal
