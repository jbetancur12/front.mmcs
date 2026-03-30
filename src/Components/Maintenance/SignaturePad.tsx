import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
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
    (dataUrl: string): Promise<string> =>
      new Promise((resolve) => {
        const image = new Image()
        image.onload = () => {
          const sourceCanvas = document.createElement('canvas')
          sourceCanvas.width = image.width
          sourceCanvas.height = image.height
          const sourceContext = sourceCanvas.getContext('2d')

          if (!sourceContext) {
            resolve(dataUrl)
            return
          }

          sourceContext.drawImage(image, 0, 0)
          const { data, width, height } = sourceContext.getImageData(0, 0, image.width, image.height)

          let minX = width
          let minY = height
          let maxX = -1
          let maxY = -1

          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              const index = (y * width + x) * 4
              const r = data[index]
              const g = data[index + 1]
              const b = data[index + 2]
              const a = data[index + 3]
              const isVisibleInk = a > 10 && !(r > 245 && g > 245 && b > 245)

              if (isVisibleInk) {
                minX = Math.min(minX, x)
                minY = Math.min(minY, y)
                maxX = Math.max(maxX, x)
                maxY = Math.max(maxY, y)
              }
            }
          }

          if (maxX < minX || maxY < minY) {
            resolve(dataUrl)
            return
          }

          const padding = 12
          const cropX = Math.max(0, minX - padding)
          const cropY = Math.max(0, minY - padding)
          const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2)
          const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2)

          const outputCanvas = document.createElement('canvas')
          outputCanvas.width = cropWidth
          outputCanvas.height = cropHeight
          const outputContext = outputCanvas.getContext('2d')

          if (!outputContext) {
            resolve(dataUrl)
            return
          }

          outputContext.fillStyle = '#ffffff'
          outputContext.fillRect(0, 0, cropWidth, cropHeight)
          outputContext.drawImage(
            sourceCanvas,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          )

          resolve(outputCanvas.toDataURL('image/png'))
        }

        image.onerror = () => resolve(dataUrl)
        image.src = dataUrl
      }),
    []
  )

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const width = container.clientWidth || 400
    const hasExternalValue = Boolean(value)
    const previousData = hasExternalValue
      ? value
      : hasSignature
        ? canvas.toDataURL('image/png')
        : null

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
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

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

    const dataUrl = canvas.toDataURL('image/png')
    const normalizedDataUrl = await normalizeSignatureImage(dataUrl)
    setHasSignature(true)
    onChange(normalizedDataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const container = containerRef.current

    setHasSignature(false)
    setUploadError(null)
    onChange(null)

    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const width = container.clientWidth || 400
    const context = canvas.getContext('2d')
    if (!context) return

    context.setTransform(1, 0, 0, 1, 0, 0)
    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2
    context.strokeStyle = strokeColor
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }

  const handleUploadClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Solo puedes subir imágenes para la firma.')
      return
    }

    const maxSizeInBytes = 4 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      setUploadError('La imagen de la firma no debe superar 4 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (!result) {
        setUploadError('No se pudo leer la imagen seleccionada.')
        return
      }

      const normalizedDataUrl = await normalizeSignatureImage(result)
      setUploadError(null)
      setHasSignature(true)
      onChange(normalizedDataUrl)
    }
    reader.onerror = () => {
      setUploadError('No se pudo cargar la imagen seleccionada.')
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
          backgroundColor: '#ffffff',
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
            <Typography variant='body2'>
              Firma aquí con mouse o touch
            </Typography>
          </Stack>
        )}
      </Box>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        flexWrap='wrap'
        gap={1}
        sx={{ mt: 1 }}
      >
        <Box>
          <Typography variant='caption' color={uploadError ? 'error.main' : 'text.secondary'}>
            {uploadError || helperText || 'La firma se guarda como imagen para el PDF.'}
          </Typography>
        </Box>
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
