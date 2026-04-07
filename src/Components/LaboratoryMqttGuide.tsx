import React from 'react'
import {
  Alert,
  Box,
  Chip,
  Collapse,
  Divider,
  Paper,
  IconButton,
  Typography
} from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'

type GuideVariant = 'conditions' | 'patterns'

interface LaboratoryMqttGuideProps {
  variant: GuideVariant
}

const guideContent = {
  conditions: {
    title: 'Guia de envio MQTT para Condiciones',
    topic: 'laboratory/conditions',
    description:
      'Usa esta configuracion para sensores de condiciones ambientales generales del laboratorio.',
    payload: 'SensorID/Temperatura/Humedad',
    examples: ['LAB-01/23.56/67.3', 'AMBIENTE-CENTRAL/24.10/58.4'],
    rules: [
      'El mensaje debe tener exactamente 3 partes separadas por /.',
      'El SensorID no puede ir vacio.',
      'Temperatura y humedad deben ser numericas.',
      'Este flujo se procesa solo dentro del horario habilitado por backend.'
    ],
    notes: [
      'El frontend usa el nombre del sensor o dispositivo para mostrar y actualizar la tarjeta.',
      'Si el nombre cambia en el dispositivo, debe coincidir tambien en el sistema.'
    ],
    steps: [
      'Crea en esta pantalla el sensor con un nombre unico, por ejemplo LAB-01.',
      'Configura el dispositivo fisico para que envie exactamente ese mismo nombre como primera parte del mensaje.',
      'Haz que el sensor publique en el topic laboratory/conditions.',
      'Envia el payload con este orden: Nombre/Temperatura/Humedad.'
    ],
    relationExample: {
      createdName: 'LAB-01',
      expectedPayload: 'LAB-01/23.5/67.2'
    },
    warning:
      'La relacion entre la pantalla y el sensor se hace por nombre exacto. No se usa el ID interno de la base de datos.'
  },
  patterns: {
    title: 'Guia de envio MQTT para Patrones',
    topic: 'laboratory/patterns',
    description:
      'Usa esta configuracion para sensores asociados a patrones y camaras de calibracion.',
    payload: 'SensorIdentifier/Temperatura[/Humedad]',
    examples: ['MMCS-66-1/29.8/61.4', 'MMCS-115-1/23.9', 'MMCS-115-2/23.9/NA'],
    rules: [
      'El mensaje puede tener 2 o 3 partes separadas por /.',
      'El SensorIdentifier no puede ir vacio.',
      'La temperatura debe ser numerica.',
      'La humedad es opcional y puede omitirse o enviarse como NA.'
    ],
    notes: [
      'El SensorIdentifier debe coincidir exactamente con el nombre del sensor creado en esta pantalla.',
      'Si el nombre no coincide, el mensaje puede llegar al broker pero no se asociara al patron correcto.'
    ],
    steps: [
      'Crea el sensor dentro del patron con el nombre que usara el dispositivo, por ejemplo MMCS-66-1.',
      'Configura el sensor fisico para que envie exactamente MMCS-66-1 como primer valor del mensaje.',
      'Haz que el sensor publique en el topic laboratory/patterns.',
      'Envia el payload como Nombre/Temperatura o Nombre/Temperatura/Humedad.'
    ],
    relationExample: {
      createdName: 'MMCS-66-1',
      expectedPayload: 'MMCS-66-1/29.8/61.4'
    },
    warning:
      'La relacion entre esta pantalla y el sensor se hace por el nombre exacto del sensor creado aqui.'
  }
} satisfies Record<
  GuideVariant,
  {
    title: string
    topic: string
    description: string
    payload: string
    examples: string[]
    rules: string[]
    notes: string[]
    steps: string[]
    relationExample: {
      createdName: string
      expectedPayload: string
    }
    warning: string
  }
>

const LaboratoryMqttGuide: React.FC<LaboratoryMqttGuideProps> = ({
  variant
}) => {
  const content = guideContent[variant]
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        background:
          'linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,1) 100%)'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip label='Guia de integracion' color='primary' size='small' />
          <Chip label={content.topic} variant='outlined' size='small' />
        </Box>

        <IconButton
          onClick={() => setIsOpen((prev) => !prev)}
          size='small'
          aria-label={isOpen ? 'Ocultar ayuda' : 'Mostrar ayuda'}
        >
          {isOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Typography variant='h6' fontWeight={700} gutterBottom>
        {content.title}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        {content.description}
      </Typography>

      <Collapse in={isOpen}>
        <Alert severity='info' sx={{ mb: 2 }}>
          Formato esperado del payload: <strong>{content.payload}</strong>
        </Alert>

        <Alert severity='warning' sx={{ mb: 2 }}>
          {content.warning}
        </Alert>

      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
        1. Relacion entre la app y el sensor
      </Typography>
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: '12px',
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: 'rgba(15, 23, 42, 0.02)'
          }}
        >
        <Typography variant='body2' sx={{ mb: 0.75 }}>
          Si en la app creas el sensor con nombre{' '}
          <strong>{content.relationExample.createdName}</strong>
        </Typography>
          <Typography variant='body2'>
            entonces el dispositivo debe enviar:{' '}
            <strong>{content.relationExample.expectedPayload}</strong>
          </Typography>
        </Box>

      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
        2. Configurar el dispositivo
      </Typography>
        <Box component='ul' sx={{ pl: 2.5, mb: 2, mt: 0 }}>
          {content.steps.map((step) => (
            <Typography
              key={step}
              component='li'
              variant='body2'
              sx={{ mb: 0.75 }}
            >
              {step}
            </Typography>
          ))}
        </Box>

      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
        3. Ejemplos de mensaje valido
      </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {content.examples.map((example) => (
            <Chip key={example} label={example} variant='outlined' />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
          4. Reglas del formato
        </Typography>
        <Box component='ul' sx={{ pl: 2.5, m: 0 }}>
          {content.rules.map((rule) => (
            <Typography
              key={rule}
              component='li'
              variant='body2'
              sx={{ mb: 0.75 }}
            >
              {rule}
            </Typography>
          ))}
        </Box>

        <Typography variant='subtitle2' fontWeight={700} sx={{ mt: 2, mb: 1 }}>
          5. Recomendaciones finales
        </Typography>
        <Box component='ul' sx={{ pl: 2.5, m: 0 }}>
          {content.notes.map((note) => (
            <Typography
              key={note}
              component='li'
              variant='body2'
              sx={{ mb: 0.75 }}
            >
              {note}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default LaboratoryMqttGuide
