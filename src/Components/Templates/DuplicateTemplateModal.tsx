import React from 'react'
import { TemplateData, TemplatesData } from './types'
import TemplateFormDialog from './TemplateFormDialog'

interface DuplicateTemplateModalProps {
  open: boolean
  template: TemplatesData
  onClose: () => void
  onSubmit: (
    templateData: TemplateData
  ) => Promise<boolean | void> | boolean | void
  existingTemplates?: TemplatesData[]
}

const DuplicateTemplateModal: React.FC<DuplicateTemplateModalProps> = ({
  open,
  template,
  onClose,
  onSubmit,
  existingTemplates
}) => (
  <TemplateFormDialog
    open={open}
    mode='duplicate'
    template={template}
    existingTemplates={existingTemplates}
    onClose={onClose}
    onSubmit={onSubmit}
  />
)

export default DuplicateTemplateModal
