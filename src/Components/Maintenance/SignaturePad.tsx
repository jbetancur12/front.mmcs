import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { BorderColor, Clear } from '@mui/icons-material'

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
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(Boolean(value))

  const strokeColor = useMemo(() => '#111827', [])

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ratio = window.devicePixelRatio || 1
    const width = container.clientWidth || 400
    const previousData = hasSignature ? canvas.toDataURL('image/png') : value

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

  const finishDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    setHasSignature(true)
    onChange(dataUrl)
  }

  const clearSignature = () => {
    setHasSignature(false)
    onChange(null)
    resizeCanvas()
  }

  return (
    <Box>
      {label && (
        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
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
        sx={{ mt: 1 }}
      >
        <Typography variant='caption' color='text.secondary'>
          {helperText || 'La firma se guarda como imagen para el PDF.'}
        </Typography>
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
    </Box>
  )
}

export default SignaturePad
