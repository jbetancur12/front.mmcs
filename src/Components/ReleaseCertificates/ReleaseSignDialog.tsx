import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Slider,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  ChevronLeftRounded,
  ChevronRightRounded,
  DeleteOutline
} from '@mui/icons-material'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  releaseFileUrl,
  useSignAutoPreview,
  useSignatories,
  useSignPreview,
  useSignPlan,
  useSignReleaseCertificates
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import AutoSignPanel from './AutoSignPanel'
import ReleaseSignatoriesDialog from './ReleaseSignatoriesDialog'
import SignatoryImage, { SealImage } from './SignatoryImage'
import { ReleasePlacement, ReleaseSignatory } from './ReleaseCertificates.types'
import { brand, neutral, withAlpha } from 'src/theme/designTokens'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

/** Ancho al que se muestra la página; la posición se guarda como fracción, así que no depende de este valor. */
const VIEW_WIDTH = 540
const MIN_WIDTH = 0.05
const MAX_WIDTH = 0.5

type Placed = ReleasePlacement & { key: string }

let keyCounter = 0
const nextKey = () => `p${(keyCounter += 1)}`

interface ReleaseSignDialogProps {
  open: boolean
  /** Certificados a firmar. La posición se confirma sobre el primero y se aplica a todos. */
  ids: number[]
  onClose: () => void
  onDone?: () => void
  /** Reduce el lote a un grupo de la misma categoría (cuando se mezclaron plantillas). */
  onNarrow?: (ids: number[]) => void
}

/**
 * Firmar: se ve la página del PDF y se arrastran sobre ella las firmas del registro y el sello. La posición se propone por
 * el nombre impreso en el PDF o por la última que se usó para esa categoría de equipo; nada se estampa sin confirmarlo.
 */
const ReleaseSignDialog: React.FC<ReleaseSignDialogProps> = ({
  open,
  ids,
  onClose,
  onDone,
  onNarrow
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const axiosPrivate = useAxiosPrivate()
  const firstId = open ? ids[0] ?? null : null
  const sign = useSignReleaseCertificates()
  // Varios certificados: si las firmas del registro tienen puesto, cada PDF se ubica solo por puesto (automático);
  // si no, o si la analista lo pide, la posición se coloca a mano en el primero y se ubica en los demás por el texto impreso.
  const multi = open && ids.length > 1
  const { data: registry } = useSignatories(open)
  const hasPosts = (registry ?? []).some((s) => (s.slots ?? []).length > 0)
  const [manual, setManual] = useState(false)
  useEffect(() => {
    if (!open) setManual(false)
  }, [open])
  // Con puestos asignados, la firma es automática también para un solo certificado.
  const autoMode = open && hasPosts && !manual
  const [allowNameMismatch, setAllowNameMismatch] = useState(false)
  useEffect(() => {
    setAllowNameMismatch(false)
  }, [open, ids])
  const autoPreview = useSignAutoPreview(
    autoMode ? ids : null,
    allowNameMismatch
  )
  const autoItems = autoPreview.data ?? []
  // En automático no hace falta ver ni preparar el primer PDF.
  const viewId = autoMode ? null : firstId
  const { data: plan, isLoading, error } = useSignPlan(viewId)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  // Al soltar un arrastre el navegador manda un clic a la página: se ignora para no perder la selección.
  const justDragged = useRef(false)
  const dragRef = useRef<{ key: string; dx: number; dy: number } | null>(null)
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [stageHeight, setStageHeight] = useState(VIEW_WIDTH * 1.4)
  const [placements, setPlacements] = useState<Placed[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)
  // Dónde quedaría la firma en cada certificado del lote (con una pequeña espera mientras la analista mueve las firmas).
  const placementsForApi = useMemo(
    () => placements.map(({ key: _key, ...rest }) => rest),
    [placements]
  )
  const [settled, setSettled] = useState(placementsForApi)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(placementsForApi), 500)
    return () => window.clearTimeout(timer)
  }, [placementsForApi])
  const preview = useSignPreview(
    multi && !autoMode ? ids : null,
    settled,
    firstId
  )
  const previewItems = preview.data ?? []
  const unresolved = previewItems.filter((item) => !item.ok)
  const batchReady = autoMode
    ? !autoPreview.isFetching && autoItems.some((item) => item.ok)
    : !multi ||
      (settled === placementsForApi &&
        !preview.isFetching &&
        previewItems.some((item) => item.ok))
  const [loadProblem, setLoadProblem] = useState<string | null>(null)
  const [registryOpen, setRegistryOpen] = useState(false)
  const [seenPlan, setSeenPlan] = useState<number | null>(null)

  // El plan trae lo propuesto: se copia una vez por certificado abierto.
  useEffect(() => {
    if (!plan || seenPlan === plan.certificateId) return
    setSeenPlan(plan.certificateId)
    const pages = plan.pages.length
    setPlacements(
      plan.placements.map((placement) => ({
        ...placement,
        page:
          placement.page === -1
            ? pages
            : Math.min(Math.max(placement.page, 1), pages),
        key: nextKey()
      }))
    )
    setRemember(plan.source !== 'layout')
    setPageNo(1)
    setSelected(null)
  }, [plan, seenPlan])

  useEffect(() => {
    if (!open) {
      setSeenPlan(null)
      setPlacements([])
      setDoc(null)
      setLoadProblem(null)
    }
  }, [open])

  // PDF del primer certificado
  useEffect(() => {
    if (viewId === null) return
    let cancelled = false
    let loaded: pdfjs.PDFDocumentProxy | null = null
    setDoc(null)
    setLoadProblem(null)
    axiosPrivate
      .get(releaseFileUrl(viewId), { responseType: 'arraybuffer' })
      .then(
        (response) =>
          pdfjs.getDocument({ data: new Uint8Array(response.data) }).promise
      )
      .then((pdf) => {
        if (cancelled) {
          void pdf.destroy()
          return
        }
        loaded = pdf
        setDoc(pdf)
      })
      .catch(() => {
        if (!cancelled) setLoadProblem('No se pudo mostrar el PDF.')
      })
    return () => {
      cancelled = true
      if (loaded) void loaded.destroy()
    }
  }, [viewId, axiosPrivate])

  // Página actual en el recuadro
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    // La tarea de dibujo en curso: se cancela antes de empezar otra, porque dos dibujos a la vez sobre el mismo lienzo
    // lo dejan volteado y cortado.
    let task: pdfjs.RenderTask | null = null
    void (async () => {
      const page = await doc.getPage(pageNo)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const scale = VIEW_WIDTH / base.width
      const ratio = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: scale * ratio })
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      setStageHeight(base.height * scale)
      task = page.render({ canvasContext: context, viewport })
      await task.promise
      // Un dibujo que termina bien borra el aviso de uno anterior que falló.
      if (!cancelled) setLoadProblem(null)
    })().catch((error: unknown) => {
      // Cancelar el dibujo anterior lanza este error a propósito: no es un fallo.
      if (
        cancelled ||
        (error as { name?: string })?.name === 'RenderingCancelledException'
      )
        return
      setLoadProblem('No se pudo mostrar la página.')
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
    // El recuadro solo existe cuando ya llegó el plan: se vuelve a dibujar en ese momento.
  }, [doc, pageNo, plan?.certificateId])

  const pageCount = doc?.numPages ?? plan?.pages.length ?? 1
  const signatories = useMemo(() => plan?.signatories ?? [], [plan])
  const byId = useMemo(
    () => new Map(signatories.map((s) => [s.id, s])),
    [signatories]
  )

  const addPlacement = (
    type: 'signature' | 'seal',
    signatory?: ReleaseSignatory
  ) => {
    const key = nextKey()
    setPlacements((current) => [
      ...current,
      {
        key,
        type,
        signatoryId: signatory?.id,
        page: pageNo,
        x: type === 'seal' ? 0.62 : 0.4,
        y: type === 'seal' ? 0.86 : 0.78,
        w: type === 'seal' ? 0.24 : 0.2
      }
    ])
    setSelected(key)
  }

  const update = (key: string, changes: Partial<Placed>) =>
    setPlacements((current) =>
      current.map((p) => (p.key === key ? { ...p, ...changes } : p))
    )

  // El arrastre escucha en la ventana mientras dura: sigue al puntero aunque salga del recuadro y no depende de la captura
  // de puntero (que falla con punteros que no están activos).
  const startDrag = (event: React.PointerEvent, placement: Placed) => {
    const stage = stageRef.current
    if (!stage) return
    event.preventDefault()
    const rect = stage.getBoundingClientRect()
    const drag = {
      key: placement.key,
      dx: (event.clientX - rect.left) / rect.width - placement.x,
      dy: (event.clientY - rect.top) / rect.height - placement.y
    }
    dragRef.current = drag
    setSelected(placement.key)

    const move = (moveEvent: PointerEvent) => {
      const box = stageRef.current?.getBoundingClientRect()
      if (!box || dragRef.current?.key !== drag.key) return
      const x = (moveEvent.clientX - box.left) / box.width - drag.dx
      const y = (moveEvent.clientY - box.top) / box.height - drag.dy
      setPlacements((current) =>
        current.map((p) =>
          p.key === drag.key
            ? {
                ...p,
                x: Math.min(Math.max(x, 0), 0.98),
                y: Math.min(Math.max(y, 0), 0.98)
              }
            : p
        )
      )
    }
    const end = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  // Estirar desde la esquina: el ancho sigue al puntero y el alto se mantiene proporcional.
  const startResize = (event: React.PointerEvent, placement: Placed) => {
    const stage = stageRef.current
    if (!stage) return
    event.preventDefault()
    event.stopPropagation()
    setSelected(placement.key)
    const move = (moveEvent: PointerEvent) => {
      const box = stageRef.current?.getBoundingClientRect()
      if (!box) return
      const width = (moveEvent.clientX - box.left) / box.width - placement.x
      setPlacements((current) =>
        current.map((p) =>
          p.key === placement.key
            ? { ...p, w: Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH) }
            : p
        )
      )
    }
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const submit = () => {
    sign.mutate(
      autoMode
        ? { ids, auto: true, allowNameMismatch }
        : {
            ids,
            remember,
            referenceId: firstId ?? undefined,
            placements: placements.map(({ key: _key, ...rest }) => rest)
          },
      {
        onSuccess: (results) => {
          const failed = results.filter((result) => !result.ok)
          if (failed.length === 0) {
            notify.success(
              results.length === 1
                ? 'Certificado firmado'
                : `${results.length} certificados firmados`
            )
            onDone?.()
            onClose()
          } else {
            notify.warning(
              `${results.length - failed.length} firmados, ${failed.length} no se pudieron firmar`,
              failed[0].error
            )
            if (failed.length < results.length) onDone?.()
          }
        },
        onError: (error) =>
          notify.error(
            'No se pudo firmar',
            getApiErrorReason(error) ?? undefined
          )
      }
    )
  }

  const current = placements.find((p) => p.key === selected) ?? null
  const hasSeal = placements.some((p) => p.type === 'seal')

  return (
    <Dialog
      open={open}
      onClose={sign.isLoading ? undefined : onClose}
      fullWidth
      maxWidth='lg'
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {ids.length === 1
          ? `Firmar ${plan?.documentNumber ?? 'certificado'}`
          : `Firmar ${ids.length} certificados`}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {Boolean(error) && (
          <Alert severity='error'>
            {getApiErrorReason(error) ?? 'No se pudo preparar la firma.'}
          </Alert>
        )}
        {autoMode && (
          <AutoSignPanel
            items={autoItems}
            loading={autoPreview.isFetching}
            allowNameMismatch={allowNameMismatch}
            onAllowNameMismatch={setAllowNameMismatch}
            onManual={() => setManual(true)}
            onNarrow={onNarrow}
          />
        )}
        {plan && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {ids.length > 1 && (
                <Alert severity='info' sx={{ mb: 1.5 }}>
                  Estás viendo el primero. Cada firma se ubica en los demás por
                  el texto impreso, como «Aprobado por» o «Verificado por», no
                  por su posición en la página: así sirve aunque la plantilla
                  tenga otra escala o márgenes. Solo se firman los que tienen el
                  mismo bloque de firmas.
                  <Box component='ul' sx={{ m: 0, mt: 0.5, pl: 2 }}>
                    {previewItems.map((item) => (
                      <li key={item.id}>
                        <Typography
                          variant='caption'
                          sx={{ color: item.ok ? undefined : 'error.main' }}
                        >
                          {item.documentNumber ?? `#${item.id}`}:{' '}
                          {item.ok
                            ? item.mode === 'referencia'
                              ? 'el que ves'
                              : `ubicada por «${[...new Set((item.anchors ?? []).filter(Boolean))].join('», «')}»`
                            : item.error}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                  {unresolved.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        variant='caption'
                        color='error'
                        display='block'
                      >
                        {unresolved.length === 1
                          ? 'Ese certificado no se firmará en este lote.'
                          : `Esos ${unresolved.length} certificados no se firmarán en este lote.`}
                      </Typography>
                      {previewItems.some((item) => item.ok) && (
                        <Button
                          size='small'
                          variant='outlined'
                          sx={{ mt: 0.5 }}
                          onClick={() =>
                            onNarrow?.(
                              previewItems
                                .filter((item) => item.ok)
                                .map((item) => item.id)
                            )
                          }
                        >
                          Firmar solo los compatibles (
                          {previewItems.filter((item) => item.ok).length})
                        </Button>
                      )}
                    </Box>
                  )}
                </Alert>
              )}
              {plan.source === 'layout' && (
                <Alert severity='success' sx={{ mb: 1.5 }}>
                  Posición recordada de «{plan.category.label}». Revísala antes
                  de firmar.
                </Alert>
              )}
              {plan.source === 'names' && (
                <Alert severity='info' sx={{ mb: 1.5 }}>
                  Propuse la posición por el nombre impreso en el PDF. Ajusta lo
                  que haga falta.
                </Alert>
              )}
              {plan.source === 'none' && (
                <Alert severity='warning' sx={{ mb: 1.5 }}>
                  No encontré dónde van. Agrega las firmas y arrástralas a su
                  lugar.
                </Alert>
              )}
              {loadProblem && (
                <Alert severity='error' sx={{ mb: 1.5 }}>
                  {loadProblem}
                </Alert>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1
                }}
              >
                <IconButton
                  size='small'
                  aria-label='Página anterior'
                  disabled={pageNo <= 1}
                  onClick={() => setPageNo((n) => n - 1)}
                >
                  <ChevronLeftRounded />
                </IconButton>
                <Typography variant='body2'>
                  Página {pageNo} de {pageCount}
                </Typography>
                <IconButton
                  size='small'
                  aria-label='Página siguiente'
                  disabled={pageNo >= pageCount}
                  onClick={() => setPageNo((n) => n + 1)}
                >
                  <ChevronRightRounded />
                </IconButton>
              </Box>
              <Box sx={{ overflow: 'auto', textAlign: 'center' }}>
                <Box
                  ref={stageRef}
                  onClick={(event) => {
                    if (justDragged.current) return
                    if (
                      event.target === event.currentTarget ||
                      event.target === canvasRef.current
                    )
                      setSelected(null)
                  }}
                  sx={{
                    position: 'relative',
                    width: VIEW_WIDTH,
                    maxWidth: '100%',
                    height: stageHeight,
                    mx: 'auto',
                    bgcolor: neutral.surface,
                    boxShadow: `0 0 0 1px ${neutral.borderStrong}`,
                    touchAction: 'none'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                  {placements
                    .filter((p) => p.page === pageNo)
                    .map((p) => (
                      <Box
                        key={p.key}
                        onPointerDown={(event) => startDrag(event, p)}
                        onClick={(event) => event.stopPropagation()}
                        sx={{
                          position: 'absolute',
                          left: `${p.x * 100}%`,
                          top: `${p.y * 100}%`,
                          width: `${p.w * 100}%`,
                          cursor: 'grab',
                          touchAction: 'none',
                          outline:
                            p.key === selected
                              ? `2px solid ${brand.main}`
                              : `1px dashed ${withAlpha(brand.ink, 0.7)}`,
                          bgcolor: withAlpha(brand.soft, 0.25)
                        }}
                      >
                        {p.key === selected && (
                          <Box
                            role='slider'
                            aria-label='Cambiar tamaño'
                            onPointerDown={(event) => startResize(event, p)}
                            sx={{
                              position: 'absolute',
                              right: -10,
                              bottom: -10,
                              width: 20,
                              height: 20,
                              borderRadius: '3px',
                              bgcolor: brand.main,
                              border: `2px solid ${neutral.surface}`,
                              cursor: 'nwse-resize',
                              touchAction: 'none',
                              zIndex: 2
                            }}
                          />
                        )}
                        {p.type === 'signature' && p.signatoryId ? (
                          <SignatoryImage
                            id={p.signatoryId}
                            alt={byId.get(p.signatoryId)?.name ?? 'Firma'}
                            sx={{ width: '100%', display: 'block' }}
                            draggable={false}
                          />
                        ) : (
                          <SealImage sx={{ width: '100%', display: 'block' }} />
                        )}
                      </Box>
                    ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
                Agregar al documento
              </Typography>
              {signatories.length === 0 && (
                <Alert severity='warning' sx={{ mb: 1 }}>
                  Aún no hay firmas en el registro.
                </Alert>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {signatories.map((signatory) => (
                  <Button
                    key={signatory.id}
                    variant='outlined'
                    onClick={() => addPlacement('signature', signatory)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      textAlign: 'left',
                      gap: 1
                    }}
                  >
                    <SignatoryImage
                      id={signatory.id}
                      alt=''
                      sx={{ height: 24, maxWidth: 60, objectFit: 'contain' }}
                    />
                    <Box>
                      <Typography variant='body2' fontWeight={600}>
                        {signatory.name}
                      </Typography>
                      {signatory.role && (
                        <Typography variant='caption' color='text.secondary'>
                          {signatory.role}
                        </Typography>
                      )}
                    </Box>
                  </Button>
                ))}
                <Button
                  variant='outlined'
                  onClick={() => addPlacement('seal')}
                  disabled={hasSeal}
                  sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  Sello «Firmado digitalmente»
                </Button>
                <Button
                  size='small'
                  onClick={() => setRegistryOpen(true)}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  Administrar firmas
                </Button>
              </Box>

              <Typography
                variant='subtitle2'
                fontWeight={700}
                sx={{ mt: 2, mb: 0.5 }}
              >
                En el documento
              </Typography>
              {placements.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                  Nada todavía.
                </Typography>
              )}
              {placements.map((p) => (
                <Box
                  key={p.key}
                  onClick={() => {
                    setSelected(p.key)
                    setPageNo(p.page)
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    py: 0.25,
                    px: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: p.key === selected ? brand.softer : undefined
                  }}
                >
                  <Typography variant='body2' sx={{ flex: 1, minWidth: 0 }}>
                    {p.type === 'seal'
                      ? 'Sello'
                      : byId.get(p.signatoryId ?? 0)?.name ?? 'Firma'}{' '}
                    · pág. {p.page}
                  </Typography>
                  <IconButton
                    size='small'
                    aria-label='Quitar'
                    onClick={(event) => {
                      event.stopPropagation()
                      setPlacements((all) => all.filter((x) => x.key !== p.key))
                    }}
                  >
                    <DeleteOutline fontSize='small' />
                  </IconButton>
                </Box>
              ))}
              {current && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Tamaño
                  </Typography>
                  <Slider
                    size='small'
                    min={MIN_WIDTH}
                    max={MAX_WIDTH}
                    step={0.01}
                    value={current.w}
                    onChange={(_event, value) =>
                      update(current.key, { w: value as number })
                    }
                    sx={{ color: brand.main }}
                  />
                </Box>
              )}

              <FormControlLabel
                sx={{ mt: 1.5, alignItems: 'flex-start' }}
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    sx={{
                      color: brand.hover,
                      '&.Mui-checked': { color: brand.hover }
                    }}
                  />
                }
                label={
                  <Typography variant='body2'>
                    Recordar esta posición para «{plan.category.label}»
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sign.isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          disabled={
            autoMode
              ? sign.isLoading || !batchReady
              : placements.length === 0 ||
                sign.isLoading ||
                !plan ||
                !batchReady
          }
          onClick={submit}
          sx={{ bgcolor: brand.main, '&:hover': { bgcolor: brand.hover } }}
        >
          {ids.length > 1 ? `Firmar ${ids.length} certificados` : 'Firmar'}
        </Button>
      </DialogActions>
      <ReleaseSignatoriesDialog
        open={registryOpen}
        onClose={() => setRegistryOpen(false)}
      />
    </Dialog>
  )
}

export default ReleaseSignDialog
