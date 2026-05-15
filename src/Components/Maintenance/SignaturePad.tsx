import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { BorderColor, Clear, UploadFile } from '@mui/icons-material'

interface SignaturePadProps {
  value?: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  height?: number
  label?: string
  helperText?: string
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  disabled = false,
  height = 180,
  label,
  helperText
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(Boolean(value))
  const [uploadError, setUploadError] = useState<string | null>(null)

  const strokeColor = useMemo(() => '#111827', [])

  const normalizeSignatureImage = React.useCallback(
    (source: HTMLCanvasElement | HTMLImageElement) => {
      const sourceWidth =
        source instanceof HTMLCanvasElement ? source.width : source.naturalWidth || source.width
      const sourceHeight =
        source instanceof HTMLCanvasElement ? source.height : source.naturalHeight || source.height

      if (!sourceWidth || !sourceHeight) {
        return null
      }

      const workCanvas = document.createElement('canvas')
      workCanvas.width = sourceWidth
      workCanvas.height = sourceHeight

      const workContext = workCanvas.getContext('2d', { willReadFrequently: true })
      if (!workContext) {
        return null
      }

      workContext.clearRect(0, 0, sourceWidth, sourceHeight)
      workContext.drawImage(source, 0, 0, sourceWidth, sourceHeight)

      const imageData = workContext.getImageData(0, 0, sourceWidth, sourceHeight)
      const pixels = imageData.data
      let minX = sourceWidth
      let minY = sourceHeight
      let maxX = -1
      let maxY = -1

      for (let y = 0; y < sourceHeight; y += 1) {
        for (let x = 0; x < sourceWidth; x += 1) {
          const index = (y * sourceWidth + x) * 4
          const red = pixels[index]
          const green = pixels[index + 1]
          const blue = pixels[index + 2]
          const alpha = pixels[index + 3]

          const isNearWhite = red > 245 && green > 245 && blue > 245
          if (alpha > 0 && isNearWhite) {
            pixels[index + 3] = 0
            continue
          }

          if (pixels[index + 3] > 0) {
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
          }
        }
      }

      workContext.putImageData(imageData, 0, 0)

      if (maxX < minX || maxY < minY) {
        return null
      }

      const padding = 8
      const cropX = Math.max(0, minX - padding)
      const cropY = Math.max(0, minY - padding)
      const cropWidth = Math.min(sourceWidth - cropX, maxX - minX + padding * 2 + 1)
      const cropHeight = Math.min(sourceHeight - cropY, maxY - minY + padding * 2 + 1)

      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = cropWidth
      outputCanvas.height = cropHeight

      const outputContext = outputCanvas.getContext('2d')
      if (!outputContext) {
        return null
      }

      outputContext.clearRect(0, 0, cropWidth, cropHeight)
      outputContext.drawImage(
        workCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      return outputCanvas.toDataURL('image/png')
    },
    []
  )

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const width = container.clientWidth || 400
    const normalizedValue = typeof value === 'string' && value.trim().length > 0 ? value : null
    const previousData = normalizedValue || (hasSignature ? canvas.toDataURL('image/png') : null)

    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const context = canvas.getContext('2d')
    if (!context) return

    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2
    context.strokeStyle = strokeColor
    context.clearRect(0, 0, width, height)

    if (previousData) {
      const image = new Image()
      image.onload = () => {
        context.drawImage(image, 0, 0, width, height)
      }
      image.src = previousData
    }
  }, [hasSignature, height, strokeColor, value])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    setHasSignature(Boolean(value))
    resizeCanvas()
  }, [resizeCanvas, value])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return

    const point = getPoint(event)
    const context = canvasRef.current?.getContext('2d')
    if (!point || !context) return

    context.beginPath()
    context.moveTo(point.x, point.y)
    setIsDrawing(true)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return

    const point = getPoint(event)
    const context = canvasRef.current?.getContext('2d')
    if (!point || !context) return

    context.lineTo(point.x, point.y)
    context.stroke()
  }

  const finishDrawing = async () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = normalizeSignatureImage(canvas) || canvas.toDataURL('image/png')
    setHasSignature(true)
    onChange(dataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    setHasSignature(false)
    setUploadError(null)
    onChange(null)
  }

  const handleUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('Solo se permiten imagenes PNG, JPG o WEBP.')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('La imagen de firma no puede superar 4 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const rawValue = typeof reader.result === 'string' ? reader.result : null
      if (!rawValue) {
        setUploadError('No se pudo procesar la imagen seleccionada.')
        return
      }

      const image = new Image()
      image.onload = () => {
        const nextValue = normalizeSignatureImage(image) || rawValue
        setUploadError(null)
        setHasSignature(Boolean(nextValue))
        onChange(nextValue)
      }
      image.onerror = () => {
        setUploadError('No se pudo procesar la imagen seleccionada.')
      }
      image.src = rawValue
    }
    reader.onerror = () => {
      setUploadError('No se pudo leer la imagen seleccionada.')
    }
    reader.readAsDataURL(file)
  }

  return (
    <Box>
      {label && (
        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Box
        ref={containerRef}
        sx={{
          border: '1px solid #d1d5db',
          borderRadius: 2,
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.88) 100%)',
          position: 'relative'
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={finishDrawing}
          onPointerLeave={finishDrawing}
          style={{
            display: 'block',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none'
          }}
        />
        {!hasSignature && (
          <Stack
            spacing={1}
            alignItems='center'
            justifyContent='center'
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              color: '#9ca3af'
            }}
          >
            <BorderColor fontSize='small' />
            <Typography variant='body2'>Firma aquí con mouse o touch</Typography>
          </Stack>
        )}
      </Box>
      {uploadError ? (
        <Alert severity='warning' sx={{ mt: 1.5 }}>
          {uploadError}
        </Alert>
      ) : null}
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        flexWrap='wrap'
        gap={1}
        sx={{ mt: 1 }}
      >
        <Typography variant='caption' color='text.secondary'>
          {helperText || 'La firma se guarda como imagen para el PDF.'}
        </Typography>
        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            color='inherit'
            startIcon={<UploadFile />}
            onClick={handleUploadClick}
            disabled={disabled}
          >
            Subir imagen
          </Button>
          <Button
            size='small'
            color='inherit'
            startIcon={<Clear />}
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
          >
            Limpiar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default SignaturePad
