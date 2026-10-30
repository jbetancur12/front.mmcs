import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import useAxiosPrivate from '@utils/use-axios-private'
import { downloadPrivateFile } from '@utils/downloadBlob'
import { libraryFileUrl } from 'src/hooks/library/useLibraryDocuments'
import { notify } from 'src/utils/notify'
import { LibraryDocument } from './Library.types'

interface LibraryPdfDialogProps {
  document: LibraryDocument | null
  onClose: () => void
}

/** Visor del PDF de un documento de la biblioteca, con descarga. */
const LibraryPdfDialog: React.FC<LibraryPdfDialogProps> = ({
  document,
  onClose
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!document) return
    let url: string | null = null
    let cancelled = false
    setObjectUrl(null)
    axiosPrivate
      .get(libraryFileUrl(document.id), { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return
        url = window.URL.createObjectURL(
          new Blob([response.data], { type: 'application/pdf' })
        )
        setObjectUrl(url)
      })
      .catch(() => {
        if (cancelled) return
        notify.error('No se pudo abrir el documento')
        onClose()
      })
    return () => {
      cancelled = true
      if (url) window.URL.revokeObjectURL(url)
    }
    // El visor se recarga solo cuando cambia el documento abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id])

  const handleDownload = () => {
    if (!document) return
    downloadPrivateFile(
      libraryFileUrl(document.id),
      `${document.name} v${document.version}.pdf`,
      { download: true }
    ).catch(() => notify.error('No se pudo descargar el documento'))
  }

  return (
    <Dialog open={document !== null} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>
        {document?.name}
        {document && ` · versión ${document.version}`}
      </DialogTitle>
      <DialogContent sx={{ height: '75vh', p: 0 }}>
        {objectUrl ? (
          <Box
            component='iframe'
            src={objectUrl}
            title={document?.name}
            sx={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <SignalLoader message='Abriendo documento' />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant='contained'
          onClick={handleDownload}
          sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
        >
          Descargar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LibraryPdfDialog
