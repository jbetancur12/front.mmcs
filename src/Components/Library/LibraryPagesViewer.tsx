import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'
import {
  AddRounded,
  ErrorOutlineRounded,
  RemoveRounded
} from '@mui/icons-material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import EmptyState from 'src/Components/Common/EmptyState'
import useAxiosPrivate from '@utils/use-axios-private'
import { notify } from 'src/utils/notify'
import {
  LibraryDocument,
  LibraryPreview
} from './Library.types'

const POLL_MS = 2000
const MAX_POLLS = 30
const ZOOM_STEP = 0.25
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

interface PageImageProps {
  documentId: number
  page: number
  total: number
  token: string | null
  zoom: number
}

/**
 * Una página del documento. Se descarga como imagen (nunca como PDF) y solo
 * cuando está cerca del área visible, para no pedir 200 páginas de golpe.
 */
const PageImage: React.FC<PageImageProps> = ({
  documentId,
  page,
  total,
  token,
  zoom
}) => {
  const axiosPrivate = useAxiosPrivate()
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(page <= 2)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (visible || !boxRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px' }
    )
    observer.observe(boxRef.current)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    let active = true
    let objectUrl: string | null = null

    axiosPrivate
      .get(`/library/documents/${documentId}/pages/${page}`, {
        params: token ? { t: token } : undefined,
        responseType: 'blob'
      })
      .then((response) => {
        if (!active) return
        objectUrl = window.URL.createObjectURL(
          new Blob([response.data], { type: 'image/webp' })
        )
        setUrl(objectUrl)
      })
      .catch(() => {
        if (active) notify.error(`No se pudo cargar la página ${page}`)
      })

    return () => {
      active = false
      if (objectUrl) window.URL.revokeObjectURL(objectUrl)
    }
  }, [axiosPrivate, documentId, page, token, visible])

  return (
    <Box
      ref={boxRef}
      sx={{ width: `${zoom * 100}%`, mx: 'auto', flexShrink: 0 }}
    >
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          minHeight: visible ? 240 : 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {url ? (
          <Box
            component='img'
            src={url}
            alt={`Página ${page} de ${total}`}
            draggable={false}
            sx={{
              display: 'block',
              width: '100%',
              height: 'auto',
              userSelect: 'none',
              WebkitUserDrag: 'none'
            }}
          />
        ) : (
          <SignalLoader message={`Página ${page}`} size='small' />
        )}
      </Box>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', textAlign: 'center', mt: 0.5, mb: 2 }}
      >
        Página {page} de {total}
      </Typography>
    </Box>
  )
}

interface LibraryPagesViewerProps {
  document: LibraryDocument
}

/**
 * Visor de solo lectura de la biblioteca: pide la vista por páginas y dibuja
 * imágenes WebP. El PDF no llega al navegador; la descarga es otro permiso.
 */
const LibraryPagesViewer: React.FC<LibraryPagesViewerProps> = ({
  document
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [preview, setPreview] = useState<LibraryPreview | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let active = true
    let timer: number | undefined
    let polls = 0

    setPreview(null)
    setError(false)

    const load = async (retry: boolean) => {
      try {
        const response = await axiosPrivate.get<LibraryPreview>(
          `/library/documents/${document.id}/pages`,
          { params: retry ? { retry: 'true' } : undefined }
        )
        if (!active) return
        setPreview(response.data)
        const waiting =
          response.data.status === 'pending' ||
          response.data.status === 'processing'
        if (!waiting) return
        polls += 1
        if (polls < MAX_POLLS) {
          timer = window.setTimeout(() => load(false), POLL_MS)
        } else {
          setError(true)
        }
      } catch {
        if (active) setError(true)
      }
    }

    load(attempt > 0)
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [axiosPrivate, document.id, attempt])

  if (error || preview?.status === 'failed') {
    return (
      <EmptyState
        icon={<ErrorOutlineRounded />}
        title='No se pudo preparar la vista del documento'
        hint='El PDF puede estar dañado o usar un formato no soportado. Inténtalo de nuevo o descarga el PDF si tienes permiso.'
        action={
          <Button
            variant='outlined'
            onClick={() => setAttempt((value) => value + 1)}
          >
            Reintentar
          </Button>
        }
      />
    )
  }

  if (!preview || preview.status !== 'ready' || !preview.pageCount) {
    return <SignalLoader message='Preparando la vista del documento' size='large' />
  }

  return (
    <Box
      role='document'
      aria-label={`${document.name}, versión ${document.version}`}
      onContextMenu={(event) => event.preventDefault()}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        '@media print': { display: 'none' }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}
      >
        <Typography variant='caption' color='text.secondary' sx={{ flexGrow: 1 }}>
          {preview.pageCount}{' '}
          {preview.pageCount === 1 ? 'página' : 'páginas'} · solo lectura
        </Typography>
        <Tooltip title='Alejar'>
          <span>
            <IconButton
              size='small'
              aria-label='Alejar'
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            >
              <RemoveRounded fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant='caption' sx={{ minWidth: 40, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <Tooltip title='Acercar'>
          <span>
            <IconButton
              size='small'
              aria-label='Acercar'
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            >
              <AddRounded fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'grey.100',
          px: 1,
          py: 1,
          userSelect: 'none'
        }}
      >
        {Array.from({ length: preview.pageCount }, (_, index) => (
          <PageImage
            key={index + 1}
            documentId={document.id}
            page={index + 1}
            total={preview.pageCount ?? 0}
            token={preview.token}
            zoom={zoom}
          />
        ))}
      </Box>
    </Box>
  )
}

export default LibraryPagesViewer
