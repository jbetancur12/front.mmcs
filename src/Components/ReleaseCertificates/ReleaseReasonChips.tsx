import React from 'react'
import { Box, Chip, Typography } from '@mui/material'
import { ReleaseCertificateDetail } from './ReleaseCertificates.types'

export type ReleaseReasonMode = 'adjustments' | 'discard' | 'reopen' | 'revert'

interface ReasonOption {
  code: string
  label: string
  /** Frase que se agrega al texto; puede traer datos del certificado. */
  text: (certificate: ReleaseCertificateDetail) => string
}

const value = (text: string | null | undefined) => text?.trim() || 'sin dato'

const REASONS: Record<string, ReasonOption> = {
  cliente_no_cuadra: {
    code: 'cliente_no_cuadra',
    label: 'Cliente no cuadra',
    text: (c) =>
      `El cliente del PDF («${value(c.customerName)}») no cuadra con ${
        c.service
          ? `el servicio ${c.service.serviceCode}`
          : 'el cliente de la plataforma'
      }.`
  },
  servicio_equivocado: {
    code: 'servicio_equivocado',
    label: 'Servicio equivocado',
    text: (c) =>
      c.service
        ? `No corresponde al servicio ${c.service.serviceCode}: cárgalo en el servicio correcto.`
        : 'Falta ligarlo a su servicio: cárgalo en el servicio correcto.'
  },
  instrumento: {
    code: 'instrumento',
    label: 'Instrumento',
    text: (c) => `Revisa el instrumento («${value(c.instrument)}»).`
  },
  magnitud: {
    code: 'magnitud',
    label: 'Magnitud',
    text: (c) => `Revisa la magnitud («${value(c.magnitude)}»).`
  },
  fabricante_modelo: {
    code: 'fabricante_modelo',
    label: 'Fabricante o modelo',
    text: (c) =>
      `Revisa fabricante y modelo («${value(c.manufacturer)}» / «${value(c.model)}»).`
  },
  serie: {
    code: 'serie',
    label: 'Serie',
    text: (c) => `Revisa la serie («${value(c.serie)}»).`
  },
  activo_fijo: {
    code: 'activo_fijo',
    label: 'Activo fijo',
    text: (c) => `Revisa el activo fijo («${value(c.activoFijo)}»).`
  },
  ubicacion: {
    code: 'ubicacion',
    label: 'Ubicación',
    text: (c) => `Revisa la ubicación («${value(c.location)}»).`
  },
  fecha: {
    code: 'fecha',
    label: 'Fechas',
    text: () => 'Revisa las fechas de calibración y de emisión.'
  },
  firma: {
    code: 'firma',
    label: 'Falta firma o sello',
    text: () => 'Falta la firma o el sello en el certificado.'
  },
  pdf_ilegible: {
    code: 'pdf_ilegible',
    label: 'PDF ilegible',
    text: () => 'El PDF no se lee bien: carga una copia nítida.'
  },
  duplicado: {
    code: 'duplicado',
    label: 'Duplicado',
    text: () => 'Ya está cargado: es un duplicado.'
  },
  cargado_por_error: {
    code: 'cargado_por_error',
    label: 'Cargado por error',
    text: () => 'Se cargó por error.'
  },
  otro: {
    code: 'otro',
    label: 'Otro',
    text: () => ''
  }
}

const BY_MODE: Record<ReleaseReasonMode, string[]> = {
  adjustments: [
    'cliente_no_cuadra',
    'servicio_equivocado',
    'instrumento',
    'magnitud',
    'fabricante_modelo',
    'serie',
    'activo_fijo',
    'ubicacion',
    'fecha',
    'firma',
    'pdf_ilegible',
    'otro'
  ],
  discard: [
    'duplicado',
    'cargado_por_error',
    'servicio_equivocado',
    'pdf_ilegible',
    'otro'
  ],
  reopen: [
    'cliente_no_cuadra',
    'instrumento',
    'serie',
    'fabricante_modelo',
    'fecha',
    'firma',
    'otro'
  ],
  revert: [
    'cliente_no_cuadra',
    'instrumento',
    'serie',
    'fabricante_modelo',
    'fecha',
    'otro'
  ]
}

interface ReleaseReasonChipsProps {
  mode: ReleaseReasonMode
  certificate: ReleaseCertificateDetail
  reasons: string[]
  onReasons: (reasons: string[]) => void
  observation: string
  onObservation: (text: string) => void
}

/**
 * Motivos rápidos: cada uno agrega una frase ya redactada (editable) al texto y queda como etiqueta del registro.
 * Se puede combinar varios y escribir encima; «Otro» deja el texto libre.
 */
const ReleaseReasonChips: React.FC<ReleaseReasonChipsProps> = ({
  mode,
  certificate,
  reasons,
  onReasons,
  observation,
  onObservation
}) => {
  const toggle = (option: ReasonOption) => {
    const selected = reasons.includes(option.code)
    const sentence = option.text(certificate)
    onReasons(
      selected
        ? reasons.filter((code) => code !== option.code)
        : [...reasons, option.code]
    )
    if (!sentence) return
    if (selected) {
      onObservation(
        observation
          .replace(sentence, '')
          .replace(/\n{2,}/g, '\n')
          .trim()
      )
    } else if (!observation.includes(sentence)) {
      onObservation(
        observation.trim() ? `${observation.trim()}\n${sentence}` : sentence
      )
    }
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant='caption' color='text.secondary'>
        Motivos rápidos (elige uno o varios, o escribe el tuyo)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
        {BY_MODE[mode].map((code) => {
          const option = REASONS[code]
          const selected = reasons.includes(code)
          return (
            <Chip
              key={code}
              size='small'
              label={option.label}
              clickable
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => toggle(option)}
              sx={
                selected
                  ? { bgcolor: '#00897B', '&:hover': { bgcolor: '#00695C' } }
                  : undefined
              }
            />
          )
        })}
      </Box>
    </Box>
  )
}

export default ReleaseReasonChips
