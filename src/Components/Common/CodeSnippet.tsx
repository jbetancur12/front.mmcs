import React, { useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import { brand, neutral } from 'src/theme/designTokens'

interface CodeSnippetProps {
  /** Texto exacto que se muestra y se copia. */
  value: string
  /** Nombre de lo que se copia, para el lector de pantalla: "topic", "mensaje". */
  label?: string
  size?: 'small' | 'medium'
}

/**
 * Valor técnico que el usuario copia y pega en otro sistema
 * (un topic, un mensaje de ejemplo). Texto monoespaciado con botón de copiar.
 */
const CodeSnippet: React.FC<CodeSnippetProps> = ({
  value,
  label = 'texto',
  size = 'medium'
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano
    }
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        maxWidth: '100%',
        pl: 1.5,
        pr: 0.5,
        py: size === 'small' ? 0 : 0.25,
        borderRadius: '8px',
        bgcolor: neutral.surfaceHead,
        border: `1px solid ${neutral.border}`
      }}
    >
      <Box
        component='code'
        sx={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: size === 'small' ? '0.8125rem' : '0.875rem',
          color: neutral.text,
          overflowWrap: 'anywhere'
        }}
      >
        {value}
      </Box>
      <Tooltip title={copied ? 'Copiado' : `Copiar ${label}`}>
        <IconButton
          size='small'
          onClick={handleCopy}
          aria-label={`Copiar ${label}`}
          sx={{ color: copied ? brand.hover : neutral.textMuted }}
        >
          {copied ? (
            <CheckIcon sx={{ fontSize: 16 }} />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>
      <Box
        component='span'
        role='status'
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)'
        }}
      >
        {copied ? 'Copiado' : ''}
      </Box>
    </Box>
  )
}

export default CodeSnippet
