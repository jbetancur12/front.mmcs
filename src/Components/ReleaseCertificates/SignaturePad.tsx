import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { neutral, intent } from 'src/theme/designTokens'

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  /** PNG con fondo transparente, recortado al trazo; null si no hay nada dibujado. */
  toBlob: () => Promise<Blob | null>
}

interface SignaturePadProps {
  onChange?: (hasStroke: boolean) => void
}

const HEIGHT = 160
const LINE_WIDTH = 2.4
const INK = intent.infoInk
const CROP_MARGIN = 6

/**
 * Recuadro para dibujar la firma con mouse, lápiz o dedo. Usa eventos de puntero (sirve igual en celular) y evita
 * que la página se desplace mientras se dibuja.
 */
const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const strokes = useRef(0)
    const [empty, setEmpty] = useState(true)

    const context = () => canvasRef.current?.getContext('2d') ?? null

    // El lienzo tiene la resolución real de su caja (nítido en pantallas densas) y se ajusta si cambia el ancho.
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const fit = () => {
        const ratio = window.devicePixelRatio || 1
        const width = canvas.clientWidth
        if (width === 0) return
        const saved = canvas.toDataURL()
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(HEIGHT * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(ratio, ratio)
        ctx.lineWidth = LINE_WIDTH
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = INK
        if (strokes.current > 0) {
          const image = new Image()
          image.onload = () => ctx.drawImage(image, 0, 0, width, HEIGHT)
          image.src = saved
        }
      }
      fit()
      const observer = new ResizeObserver(fit)
      observer.observe(canvas)
      return () => observer.disconnect()
    }, [])

    const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const ctx = context()
      if (!ctx) return
      event.currentTarget.setPointerCapture(event.pointerId)
      drawing.current = true
      const { x, y } = point(event)
      ctx.beginPath()
      ctx.moveTo(x, y)
      // Un toque sin movimiento deja un punto
      ctx.lineTo(x + 0.01, y + 0.01)
      ctx.stroke()
      strokes.current += 1
      if (empty) {
        setEmpty(false)
        onChange?.(true)
      }
    }

    const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return
      const ctx = context()
      if (!ctx) return
      const { x, y } = point(event)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const end = () => {
      drawing.current = false
    }

    const clear = () => {
      const canvas = canvasRef.current
      const ctx = context()
      if (!canvas || !ctx) return
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
      strokes.current = 0
      setEmpty(true)
      onChange?.(false)
    }

    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => strokes.current === 0,
      toBlob: () =>
        new Promise<Blob | null>((resolve) => {
          const canvas = canvasRef.current
          const ctx = context()
          if (!canvas || !ctx || strokes.current === 0) return resolve(null)
          const { width, height } = canvas
          const pixels = ctx.getImageData(0, 0, width, height).data
          let minX = width
          let minY = height
          let maxX = 0
          let maxY = 0
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              if (pixels[(y * width + x) * 4 + 3] > 0) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
              }
            }
          }
          if (maxX < minX) return resolve(null)
          const margin = CROP_MARGIN * (window.devicePixelRatio || 1)
          const sx = Math.max(0, minX - margin)
          const sy = Math.max(0, minY - margin)
          const sw = Math.min(width - sx, maxX - minX + margin * 2)
          const sh = Math.min(height - sy, maxY - minY + margin * 2)
          const out = document.createElement('canvas')
          out.width = sw
          out.height = sh
          out.getContext('2d')?.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
          out.toBlob((blob) => resolve(blob), 'image/png')
        })
    }))

    return (
      <Box>
        <Box
          sx={{
            border: `1px solid ${neutral.borderStrong}`,
            borderRadius: 2,
            bgcolor: neutral.surface,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label='Recuadro para dibujar tu firma'
            role='img'
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            style={{
              width: '100%',
              height: HEIGHT,
              display: 'block',
              touchAction: 'none',
              cursor: 'crosshair'
            }}
          />
          {empty && (
            <Typography
              variant='body2'
              color='text.disabled'
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              Dibuja tu firma aquí
            </Typography>
          )}
          <Box
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 36,
              borderBottom: `1px dashed ${neutral.borderStrong}`,
              pointerEvents: 'none'
            }}
          />
        </Box>
      </Box>
    )
  }
)
SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
