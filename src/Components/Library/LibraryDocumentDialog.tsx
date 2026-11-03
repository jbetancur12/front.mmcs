import React, { useEffect, useState } from 'react'
import { Alert, Box, TextField } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
import FileDropZone from 'src/Components/Common/FileDropZone'
import FormDateField from 'src/Components/Common/FormDateField'
import {
  LIBRARY_SOURCE_ACCEPT,
  LibraryDocument,
  LibraryDocumentForm
} from './Library.types'

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
  file: null,
  source: null
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
      file: null,
      source: null
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
      maxWidth='sm'
    >
      <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
        {mode === 'version' && (
          <Alert severity='info'>
            La versión actual ({document?.version}) quedará en el historial y
            esta pasará a ser la vigente. Si necesitas partir del archivo
            original, descárgalo desde el listado, modifícalo y adjunta aquí el
            PDF nuevo y, si quieres, el original actualizado.
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
        {mode === 'edit' && (
          <Alert severity='warning'>
            Si subiste el archivo equivocado, elige aquí el correcto. Reemplaza
            el de esta versión (no crea una versión nueva) y queda registrado
            quién lo cambió y cuándo en el historial. Para un cambio real del
            documento, usa «Subir nueva versión».
          </Alert>
        )}
        <FileDropZone
          file={form.file}
          onFileSelected={(file) => {
            setFileError('')
            setForm({ ...form, file })
          }}
          onReject={setFileError}
          accept='application/pdf'
          acceptLabel='PDF'
          title={
            mode === 'edit'
              ? `Reemplazar el PDF (opcional): ${document?.fileName ?? ''}`
              : undefined
          }
          maxSizeMb={20}
          inputKey={inputKey}
          disabled={loading}
        />
        <FileDropZone
          file={form.source}
          onFileSelected={(source) => {
            setFileError('')
            setForm({ ...form, source })
          }}
          onReject={setFileError}
          accept={LIBRARY_SOURCE_ACCEPT}
          acceptLabel='Word o Excel'
          title={
            mode === 'edit'
              ? 'Reemplazar el archivo original (opcional)'
              : 'Arrastra el archivo original (opcional) o haz clic para elegirlo'
          }
          hint='Word o Excel (.docx, .doc, .xlsx, .xls) · máximo 20 MB'
          maxSizeMb={20}
          inputKey={inputKey}
          disabled={loading}
        />
        {mode === 'edit' && (form.file || form.source) && (
          <Alert severity='info'>
            Al guardar, el archivo actual se conserva en el rastro y este pasa a
            ser el de la versión {form.version || document?.version}.
          </Alert>
        )}
        {fileError && <Alert severity='error'>{fileError}</Alert>}
      </Box>
    </FormDialog>
  )
}

export default LibraryDocumentDialog
