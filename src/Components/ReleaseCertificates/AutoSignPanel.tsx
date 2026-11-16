import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material'
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberRounded
} from '@mui/icons-material'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  ReleaseAutoPreviewItem,
  releaseFileUrl
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { ReleasePlacement } from './ReleaseCertificates.types'
import { brand, intent, neutral, withAlpha } from 'src/theme/designTokens'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const THUMB_WIDTH = 190
/** Alto/ancho aproximados para dibujar el recuadro de la firma y del sello en la miniatura. */
const SIGNATURE_ASPECT = 0.4
const SEAL_ASPECT = 125 / 241

interface PlacementThumbProps {
  certificateId: number
  placements: ReleasePlacement[]
}

/** Miniatura de la página con las firmas y el sello donde quedarían. Se dibuja cuando entra en pantalla. */
const PlacementThumb: React.FC<PlacementThumbProps> = ({
  certificateId,
  placements
}) => {
  const axiosPrivate = useAxiosPrivate()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [height, setHeight] = useState(THUMB_WIDTH * 1.3)
  const [failed, setFailed] = useState(false)
  const pageNumber =
    placements[0]?.page === -1 ? undefined : placements[0]?.page

  useEffect(() => {
    const element = wrapperRef.current
    if (!element || visible) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true)
      },
      { rootMargin: '200px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return undefined
    let cancelled = false
    let loaded: pdfjs.PDFDocumentProxy | null = null
    let task: pdfjs.RenderTask | null = null
    void (async () => {
      const response = await axiosPrivate.get(releaseFileUrl(certificateId), {
        responseType: 'arraybuffer'
      })
      loaded = await pdfjs.getDocument({
        data: new Uint8Array(response.data)
      }).promise
      if (cancelled) return
      const page = await loaded.getPage(pageNumber ?? loaded.numPages)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const scale = THUMB_WIDTH / base.width
      const ratio = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: scale * ratio })
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      setHeight(base.height * scale)
      task = page.render({ canvasContext: context, viewport })
      await task.promise
    })().catch((error: unknown) => {
      if (
        cancelled ||
        (error as { name?: string })?.name === 'RenderingCancelledException'
      )
        return
      setFailed(true)
    })
    return () => {
      cancelled = true
      task?.cancel()
      if (loaded) void loaded.destroy()
    }
  }, [visible, certificateId, pageNumber, axiosPrivate])

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: 'relative',
        width: THUMB_WIDTH,
        height,
        border: `1px solid ${neutral.border}`,
        bgcolor: neutral.surface,
        flexShrink: 0
      }}
    >
      {failed ? (
        <Typography variant='caption' color='text.secondary' sx={{ p: 1 }}>
          No se pudo mostrar la miniatura.
        </Typography>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: THUMB_WIDTH, height, display: 'block' }}
        />
      )}
      {placements.map((placement, index) => (
        <Box
          key={`${placement.type}-${index}`}
          sx={{
            position: 'absolute',
            left: `${placement.x * 100}%`,
            top: `${placement.y * 100}%`,
            width: `${placement.w * 100}%`,
            height: `${
              placement.w *
              (placement.type === 'seal' ? SEAL_ASPECT : SIGNATURE_ASPECT) *
              (THUMB_WIDTH / height) *
              100
            }%`,
            border: `1.5px solid ${brand.main}`,
            bgcolor: withAlpha(brand.main, 0.18),
            pointerEvents: 'none'
          }}
        />
      ))}
    </Box>
  )
}

interface AutoSignPanelProps {
  items: ReleaseAutoPreviewItem[]
  loading: boolean
  allowNameMismatch: boolean
  onAllowNameMismatch: (value: boolean) => void
  onManual: () => void
  onNarrow?: (ids: number[]) => void
}

/** Firma automática por puesto: vista previa por certificado, con miniatura y lo que no se pudo ubicar. */
const AutoSignPanel: React.FC<AutoSignPanelProps> = ({
  items,
  loading,
  allowNameMismatch,
  onAllowNameMismatch,
  onManual,
  onNarrow
}) => {
  const failed = items.filter((item) => !item.ok)
  const ready = items.filter((item) => item.ok)
  const nameIssues = failed.filter((item) => item.code === 'NOMBRE')

  return (
    <Box>
      <Alert severity='info' sx={{ mb: 2 }}>
        La firma se ubica sola en cada certificado, por el puesto de cada
        persona («Aprobado por», «Verificado por»): queda sobre el nombre
        impreso y el sello bajo «Sello y revisado». Revisa las miniaturas y
        confirma; no tienes que colocar nada a mano.
        <Box sx={{ mt: 0.5 }}>
          <Button size='small' onClick={onManual}>
            Colocar las firmas a mano
          </Button>
        </Box>
      </Alert>
      {nameIssues.length > 0 && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {nameIssues.length === 1
            ? 'Un certificado imprime un nombre distinto al de la persona asignada al puesto.'
            : `${nameIssues.length} certificados imprimen un nombre distinto al de la persona asignada al puesto.`}{' '}
          Si el cambio de persona es correcto, puedes firmarlos igual.
          <FormControlLabel
            sx={{ display: 'block' }}
            control={
              <Checkbox
                checked={allowNameMismatch}
                onChange={(event) => onAllowNameMismatch(event.target.checked)}
              />
            }
            label='Firmar igual aunque el nombre impreso sea otro'
          />
        </Alert>
      )}
      {loading && items.length === 0 && (
        <Typography variant='body2' color='text.secondary'>
          Ubicando las firmas en cada certificado…
        </Typography>
      )}
      <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {items.map((item) => (
          <Box
            component='li'
            key={item.id}
            sx={{
              display: 'flex',
              gap: 1.5,
              py: 1,
              borderBottom: `1px solid ${neutral.border}`,
              alignItems: 'flex-start'
            }}
          >
            {item.ok && item.placements ? (
              <PlacementThumb
                certificateId={item.id}
                placements={item.placements}
              />
            ) : (
              <Box
                sx={{
                  width: THUMB_WIDTH,
                  minHeight: 80,
                  border: `1px dashed ${intent.dangerSoft}`,
                  bgcolor: intent.dangerSoft,
                  flexShrink: 0
                }}
              />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.ok ? (
                  <CheckCircleOutline
                    fontSize='small'
                    sx={{ color: intent.successInk }}
                  />
                ) : item.code === 'NOMBRE' ? (
                  <WarningAmberRounded
                    fontSize='small'
                    sx={{ color: intent.warningInk }}
                  />
                ) : (
                  <ErrorOutline
                    fontSize='small'
                    sx={{ color: intent.dangerInk }}
                  />
                )}
                <Typography variant='body2' fontWeight={600}>
                  {item.documentNumber ?? `#${item.id}`}
                </Typography>
              </Box>
              {item.ok ? (
                <Typography variant='caption' color='text.secondary'>
                  {
                    (item.placements ?? []).filter(
                      (p) => p.type === 'signature'
                    ).length
                  }{' '}
                  firma(s) y sello
                  {item.printedNames?.length
                    ? ` · nombres impresos: ${item.printedNames.join(', ')}`
                    : ''}
                </Typography>
              ) : (
                <Typography
                  variant='caption'
                  sx={{
                    color:
                      item.code === 'NOMBRE'
                        ? intent.warningInk
                        : intent.dangerInk
                  }}
                >
                  {item.error}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
      {failed.length > 0 && ready.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant='caption' color='error' display='block'>
            {failed.length === 1
              ? 'Ese certificado no se firmará en este lote.'
              : `Esos ${failed.length} certificados no se firmarán en este lote.`}
          </Typography>
          <Button
            size='small'
            variant='outlined'
            sx={{ mt: 0.5 }}
            onClick={() => onNarrow?.(ready.map((item) => item.id))}
          >
            Firmar solo los que se pudieron ubicar ({ready.length})
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default AutoSignPanel
