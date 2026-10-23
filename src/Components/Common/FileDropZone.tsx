import React, { useRef, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'

interface FileDropZoneProps {
  file: File | null
  onFileSelected: (file: File) => void
  /** Se llama con el motivo cuando el archivo no es del tipo o tamaño permitido. */
  onReject?: (message: string) => void
  /**
   * Tipos permitidos, como el atributo `accept` del input: MIME o extensiones
   * separados por coma (`application/pdf`, `.pdf,.png`). Vacío acepta cualquiera.
   */
  accept?: string
  /** Nombre del formato para los mensajes: "PDF". */
  acceptLabel?: string
  /** Cambia la frase principal cuando no hay archivo. */
  title?: string
  /** Cambia la línea de formatos y peso. */
  hint?: string
  maxSizeMb?: number
  /** Cambia con cada formulario nuevo para vaciar el input del navegador. */
  inputKey?: string | number
  disabled?: boolean
}

const isAccepted = (candidate: File, accept: string) => {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true
  const name = candidate.name.toLowerCase()
  return rules.some((rule) =>
    rule.startsWith('.')
      ? name.endsWith(rule)
      : rule.endsWith('/*')
        ? candidate.type.startsWith(rule.slice(0, -1))
        : candidate.type === rule
  )
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Zona para arrastrar o elegir un archivo dentro de un `FormDialog`.
 * Borde punteado gris que se vuelve turquesa al arrastrar; ya con archivo,
 * muestra su nombre y tamaño con la opción de cambiarlo. Se maneja con
 * teclado (Enter o espacio).
 */
const FileDropZone: React.FC<FileDropZoneProps> = ({
  file,
  onFileSelected,
  onReject,
  accept = 'application/pdf',
  acceptLabel = 'PDF',
  title,
  hint,
  maxSizeMb = 10,
  inputKey,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const process = (candidate: File | undefined) => {
    if (!candidate) return
    if (!isAccepted(candidate, accept)) {
      onReject?.(`Solo se permiten archivos ${acceptLabel}.`)
      return
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      onReject?.(`El archivo no puede pesar más de ${maxSizeMb} MB.`)
      return
    }
    onFileSelected(candidate)
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <Box
      role='button'
      tabIndex={disabled ? -1 : 0}
      aria-label={
        file
          ? `Archivo ${file.name}. Cambiar archivo`
          : `Elegir archivo ${acceptLabel}`
      }
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragOver(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDragOver(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragOver(false)
        if (!disabled) process(event.dataTransfer.files[0])
      }}
      sx={{
        border: '1.5px dashed',
        borderColor: isDragOver ? '#00BFA5' : '#d1d5db',
        bgcolor: isDragOver ? '#E0F7F4' : '#f9fafb',
        borderRadius: '12px',
        px: 2,
        py: file ? 2 : 3,
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color .15s, background-color .15s',
        '&:hover': disabled
          ? undefined
          : { borderColor: '#00897B', bgcolor: '#E0F7F4' },
        '&:focus-visible': { outline: '2px solid #00BFA5', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
      }}
    >
      <input
        key={inputKey}
        ref={inputRef}
        type='file'
        accept={accept || undefined}
        hidden
        onChange={(event) => {
          process(event.target.files?.[0])
          // Permite volver a elegir el mismo archivo
          event.target.value = ''
        }}
      />
      {file ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <InsertDriveFileOutlinedIcon sx={{ color: '#00695C' }} />
          <Box sx={{ minWidth: 0, textAlign: 'left' }}>
            <Typography
              variant='body2'
              fontWeight={600}
              noWrap
              sx={{ color: '#111827', maxWidth: 360 }}
            >
              {file.name}
            </Typography>
            <Typography variant='caption' sx={{ color: '#6b7280' }}>
              {formatSize(file.size)}
            </Typography>
          </Box>
          <Button
            size='small'
            component='span'
            sx={{ textTransform: 'none', fontWeight: 600, color: '#00695C' }}
          >
            Cambiar
          </Button>
        </Box>
      ) : (
        <>
          <CloudUploadOutlinedIcon
            sx={{ fontSize: 36, color: isDragOver ? '#00BFA5' : '#6b7280' }}
          />
          <Typography
            variant='body2'
            fontWeight={600}
            sx={{ color: '#111827', mt: 0.5 }}
          >
            {isDragOver
              ? 'Suelta el archivo aquí'
              : title ??
                `Arrastra el ${acceptLabel} aquí o haz clic para elegirlo`}
          </Typography>
          <Typography variant='caption' sx={{ color: '#6b7280' }}>
            {hint ?? `Solo ${acceptLabel} · máximo ${maxSizeMb} MB`}
          </Typography>
        </>
      )}
    </Box>
  )
}

export default FileDropZone
