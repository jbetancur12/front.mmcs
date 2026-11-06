import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { downloadPrivateFile } from '@utils/downloadBlob'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'
import { brand } from 'src/theme/designTokens'
import LibraryPagesViewer from './LibraryPagesViewer'
import { libraryFileUrl } from 'src/hooks/library/useLibraryDocuments'
import { userStore } from 'src/store/userStore'
import { notify } from 'src/utils/notify'
import { LibraryDocument } from './Library.types'

interface LibraryViewerDialogProps {
  document: LibraryDocument | null
  onClose: () => void
}

/**
 * Visor de un documento de la biblioteca. Muestra imágenes por página para que el
 * PDF no llegue al navegador; la descarga solo aparece con su permiso propio.
 */
const LibraryViewerDialog: React.FC<LibraryViewerDialogProps> = ({
  document,
  onClose
}) => {
  const $userStore = useStore(userStore)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const canDownload = hasPermission(
    $userStore.permissions,
    PERMISSIONS.LIBRARY_DOCUMENT_DOWNLOAD
  )

  const handleDownload = () => {
    if (!document) return
    downloadPrivateFile(
      libraryFileUrl(document.id),
      `${document.name} v${document.version}.pdf`,
      { download: true }
    ).catch(() => notify.error('No se pudo descargar el documento'))
  }

  return (
    <Dialog
      open={document !== null}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {document?.name}
        {document && ` · versión ${document.version}`}
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: fullScreen ? 'auto' : '75vh' }}>
        {document && (
          <LibraryPagesViewer key={document.id} document={document} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {canDownload && (
          <Button
            variant='contained'
            onClick={handleDownload}
            sx={{ bgcolor: brand.main, '&:hover': { bgcolor: brand.hover } }}
          >
            Descargar PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default LibraryViewerDialog
