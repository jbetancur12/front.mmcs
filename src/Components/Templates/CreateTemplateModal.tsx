import React from 'react'
import { TemplateData } from './types'
import TemplateFormDialog from './TemplateFormDialog'

interface CreateTemplateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    templateData: TemplateData
  ) => Promise<boolean | void> | boolean | void
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  open,
  onClose,
  onSubmit
}) => (
  <TemplateFormDialog
    open={open}
    mode='create'
    onClose={onClose}
    onSubmit={onSubmit}
  />
)

export default CreateTemplateModal
