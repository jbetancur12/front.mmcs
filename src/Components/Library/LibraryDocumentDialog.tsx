import React, { useEffect, useState } from 'react'
import { Alert, Box, TextField } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
import FileDropZone from 'src/Components/Common/FileDropZone'
import FormDateField from 'src/Components/Common/FormDateField'
import { LibraryDocument, LibraryDocumentForm } from './Library.types'

export type LibraryDialogMode = 'create' | 'version' | 'edit'

interface LibraryDocumentDialogProps {
  open: boolean
  mode: LibraryDialogMode
  /** Documento sobre el que se actúa (nueva versión o edición). */
  document?: LibraryDocument | null
  /** Nombre de la categoría, para el subtítulo al agregar. */
  categoryLabel: string
  loading: boolean
  onClose: () => void
  onSubmit: (form: LibraryDocumentForm) => void
}

const TITLES: Record<LibraryDialogMode, [string, string]> = {
  create: ['Agregar documento', 'Agregar'],
  version: ['Subir nueva versión', 'Subir versión'],
  edit: ['Editar documento', 'Guardar']
}

const today = () => new Date().toLocaleDateString('en-CA')

const emptyForm = (): LibraryDocumentForm => ({
  name: '',
  version: '',
  documentDate: today(),
  file: null
})

const LibraryDocumentDialog: React.FC<LibraryDocumentDialogProps> = ({
  open,
  mode,
  document,
  categoryLabel,
  loading,
  onClose,
  onSubmit
}) => {
  const [form, setForm] = useState<LibraryDocumentForm>(emptyForm)
  const [fileError, setFileError] = useState('')
  const [inputKey, setInputKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setFileError('')
    setInputKey((key) => key + 1)
    if (!document || mode === 'create') return setForm(emptyForm())
    setForm({
      name: document.name,
      // En una versión nueva la versión y la fecha son las del cambio, no las de la anterior.
      version: mode === 'edit' ? document.version : '',
      documentDate: mode === 'edit' ? document.documentDate : today(),
      file: null
    })
  }, [open, mode, document])

  const needsFile = mode !== 'edit'
  const valid =
    form.name.trim() !== '' &&
    form.version.trim() !== '' &&
    form.documentDate !== '' &&
    (!needsFile || form.file !== null)

  const [title, submitLabel] = TITLES[mode]
  const subtitle = mode === 'create' ? categoryLabel : document?.name

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      submitLabel={submitLabel}
      onSubmit={() => onSubmit(form)}
      loading={loading}
      submitDisabled={!valid}
      maxWidth='xs'
    >
      <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
        {mode === 'version' && (
          <Alert severity='info'>
            La versión actual ({document?.version}) quedará en el historial y
            esta pasará a ser la vigente.
          </Alert>
        )}
        <TextField
          label='Nombre del documento'
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          inputProps={{ maxLength: 200 }}
          required
          fullWidth
        />
        <TextField
          label='Versión'
          value={form.version}
          onChange={(event) =>
            setForm({ ...form, version: event.target.value })
          }
          inputProps={{ maxLength: 50 }}
          required
          fullWidth
        />
        <FormDateField
          label='Fecha del documento'
          name='documentDate'
          value={form.documentDate}
          onChange={(documentDate) => setForm({ ...form, documentDate })}
        />
        {needsFile && (
          <FileDropZone
            file={form.file}
            onFileSelected={(file) => {
              setFileError('')
              setForm({ ...form, file })
            }}
            onReject={setFileError}
            accept='application/pdf'
            acceptLabel='PDF'
            maxSizeMb={20}
            inputKey={inputKey}
            disabled={loading}
          />
        )}
        {fileError && <Alert severity='error'>{fileError}</Alert>}
      </Box>
    </FormDialog>
  )
}

export default LibraryDocumentDialog
