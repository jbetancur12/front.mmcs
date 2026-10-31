import React from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import {
  DescriptionOutlined,
  FileDownloadOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import { useLibraryHistory } from 'src/hooks/library/useLibraryDocuments'
import { downloadLibraryPdf, downloadLibrarySource } from './libraryDownloads'
import { formatLibraryDate } from './libraryFormat'
import { LibraryDocument } from './Library.types'

interface LibraryHistoryDialogProps {
  document: LibraryDocument | null
  onClose: () => void
  onView: (document: LibraryDocument) => void
  /** El usuario tiene el permiso de descargar los archivos originales. */
  canDownloadSource: boolean
}

/** Todas las versiones de un documento; la vigente va marcada. */
const LibraryHistoryDialog: React.FC<LibraryHistoryDialogProps> = ({
  document,
  onClose,
  onView,
  canDownloadSource
}) => {
  const { data: versions, isLoading } = useLibraryHistory(document?.id ?? null)

  return (
    <Dialog open={document !== null} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        Historial de versiones
        <Typography variant='body2' color='text.secondary'>
          {document?.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <SignalLoader message='Cargando versiones' />
        ) : (
          <Box sx={{ display: 'grid', gap: 1 }}>
            {(versions ?? []).map((version) => (
              <Box
                key={version.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px solid #e5e7eb',
                  borderRadius: 2
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography fontWeight={600}>
                    Versión {version.version}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatLibraryDate(version.documentDate)}
                    {version.uploader && ` · ${version.uploader.nombre}`}
                  </Typography>
                </Box>
                {version.isCurrent && (
                  <Chip
                    size='small'
                    variant='outlined'
                    color='success'
                    label='Vigente'
                  />
                )}
                <Tooltip title='Ver'>
                  <IconButton
                    aria-label={`Ver versión ${version.version}`}
                    sx={{ color: '#00695C' }}
                    onClick={() => onView(version)}
                  >
                    <VisibilityOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Descargar PDF'>
                  <IconButton
                    aria-label={`Descargar PDF de la versión ${version.version}`}
                    onClick={() => downloadLibraryPdf(version)}
                  >
                    <FileDownloadOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                {canDownloadSource && version.hasSource && (
                  <Tooltip title='Descargar archivo original'>
                    <IconButton
                      aria-label={`Descargar archivo original de la versión ${version.version}`}
                      sx={{ color: '#2563eb' }}
                      onClick={() => downloadLibrarySource(version)}
                    >
                      <DescriptionOutlined fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default LibraryHistoryDialog
