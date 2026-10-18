import React from 'react'
import {
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Paper,
  Typography
} from '@mui/material'
import {
  ExpandMore,
  ExpandLess,
  SettingsInputAntenna,
  CheckCircleOutline,
  ArrowForward,
  InfoOutlined
} from '@mui/icons-material'
import CodeSnippet from 'src/Components/Common/CodeSnippet'

type GuideVariant = 'conditions' | 'patterns'

interface LaboratoryMqttGuideProps {
  variant: GuideVariant
}

const guideContent = {
  conditions: {
    title: 'Guía de envío MQTT para condiciones',
    topic: 'laboratory/conditions',
    description:
      'Cómo conectar los sensores de condiciones ambientales generales del laboratorio.',
    payload: 'SensorID/Temperatura/Humedad',
    examples: ['LAB-01/23.56/67.3', 'AMBIENTE-CENTRAL/24.10/58.4'],
    rules: [
      'El mensaje tiene exactamente 3 partes separadas por /.',
      'El SensorID no puede ir vacío.',
      'Temperatura y humedad deben ser numéricas.',
      'Solo se procesa dentro del horario habilitado por el sistema.'
    ],
    notes: [
      'La pantalla usa el nombre del sensor para mostrar y actualizar su tarjeta.',
      'Si el nombre cambia en el dispositivo, también debe cambiar en el sistema.'
    ],
    steps: [
      'Crea en esta pantalla el sensor con un nombre único, por ejemplo LAB-01.',
      'Configura el dispositivo para que envíe ese mismo nombre como primera parte del mensaje.',
      'Haz que el sensor publique en el topic laboratory/conditions.',
      'Envía el mensaje con el orden Nombre/Temperatura/Humedad.'
    ],
    relationExample: {
      createdName: 'LAB-01',
      expectedPayload: 'LAB-01/23.5/67.2'
    },
    warning:
      'La pantalla y el sensor se relacionan por el nombre exacto, no por el ID interno de la base de datos.'
  },
  patterns: {
    title: 'Guía de envío MQTT para patrones',
    topic: 'laboratory/patterns',
    description:
      'Cómo conectar los sensores de los patrones y las cámaras de calibración.',
    payload: 'SensorIdentifier/Temperatura[/Humedad]',
    examples: ['MMCS-66-1/29.8/61.4', 'MMCS-115-1/23.9', 'MMCS-115-2/23.9/NA'],
    rules: [
      'El mensaje tiene 2 o 3 partes separadas por /.',
      'El SensorIdentifier no puede ir vacío.',
      'La temperatura debe ser numérica.',
      'La humedad es opcional: se omite o se envía como NA.'
    ],
    notes: [
      'El SensorIdentifier debe coincidir exactamente con el nombre del sensor creado en esta pantalla.',
      'Si el nombre no coincide, el mensaje llega al broker pero no se asocia al patrón correcto.'
    ],
    steps: [
      'Crea el sensor dentro del patrón con el nombre que usará el dispositivo, por ejemplo MMCS-66-1.',
      'Configura el sensor físico para que envíe ese nombre como primer valor del mensaje.',
      'Haz que el sensor publique en el topic laboratory/patterns.',
      'Envía el mensaje como Nombre/Temperatura o Nombre/Temperatura/Humedad.'
    ],
    relationExample: {
      createdName: 'MMCS-66-1',
      expectedPayload: 'MMCS-66-1/29.8/61.4'
    },
    warning:
      'La pantalla y el sensor se relacionan por el nombre exacto del sensor creado aquí.'
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

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
    {children}
  </Typography>
)

const LaboratoryMqttGuide: React.FC<LaboratoryMqttGuideProps> = ({
  variant
}) => {
  const content = guideContent[variant]
  const [isOpen, setIsOpen] = React.useState(false)
  const panelId = `mqtt-guide-${variant}`

  return (
    <Paper
      variant='outlined'
      sx={{ borderRadius: '12px', borderColor: '#e5e7eb', overflow: 'hidden' }}
    >
      {/* Toda la cabecera abre y cierra la guía */}
      <ButtonBase
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 2,
          textAlign: 'left',
          '&:hover': { bgcolor: '#fafafa' },
          '&.Mui-focusVisible': { outline: '3px solid #00897B', outlineOffset: -3 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#E0F7F4',
              color: '#00897B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <SettingsInputAntenna />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='subtitle1' fontWeight={700}>
              {content.title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {content.description}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#4b5563', flexShrink: 0 }}>
          <Typography
            variant='body2'
            fontWeight={600}
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {isOpen ? 'Ocultar guía' : 'Ver guía'}
          </Typography>
          {isOpen ? <ExpandLess /> : <ExpandMore />}
        </Box>
      </ButtonBase>

      <Collapse in={isOpen} id={panelId} unmountOnExit>
        <Box sx={{ p: { xs: 2, md: 3 }, borderTop: '1px solid #e5e7eb' }}>
          {/* De dónde sale el nombre: lo que se crea en pantalla es lo que envía el dispositivo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              p: 2,
              mb: 3,
              borderRadius: '10px',
              bgcolor: '#F4FCFA',
              border: '1px solid #b2ebe2'
            }}
          >
            <Typography variant='body2'>Si creas el sensor</Typography>
            <CodeSnippet
              value={content.relationExample.createdName}
              label='nombre del sensor'
              size='small'
            />
            <ArrowForward sx={{ color: '#00897B', fontSize: 20 }} aria-label='entonces' />
            <Typography variant='body2'>el dispositivo envía</Typography>
            <CodeSnippet
              value={content.relationExample.expectedPayload}
              label='mensaje de ejemplo'
              size='small'
            />
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SubTitle>Para conectar un sensor</SubTitle>
              <Box component='ol' sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {content.steps.map((step, index) => (
                  <Box
                    component='li'
                    key={step}
                    sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: '#00BFA5',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.125
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant='body2'>{step}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.75 }}>
                  Publica en el topic
                </Typography>
                <CodeSnippet value={content.topic} label='topic' />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <SubTitle>Formato del mensaje</SubTitle>
              <CodeSnippet value={content.payload} label='formato' />

              <Typography variant='body2' color='text.secondary' sx={{ mt: 2, mb: 0.75 }}>
                Ejemplos válidos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {content.examples.map((example) => (
                  <CodeSnippet
                    key={example}
                    value={example}
                    label='ejemplo'
                    size='small'
                  />
                ))}
              </Box>

              <Box component='ul' sx={{ listStyle: 'none', p: 0, mt: 2, mb: 0 }}>
                {content.rules.map((rule) => (
                  <Box
                    component='li'
                    key={rule}
                    sx={{ display: 'flex', gap: 1, mb: 0.75 }}
                  >
                    <CheckCircleOutline
                      aria-hidden
                      sx={{ fontSize: 18, color: '#00897B', mt: 0.25 }}
                    />
                    <Typography variant='body2'>{rule}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Lo que más falla en campo: el nombre no coincide */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mt: 3,
              p: 2,
              borderRadius: '10px',
              bgcolor: '#fffbeb',
              border: '1px solid #fde68a'
            }}
          >
            <InfoOutlined aria-hidden sx={{ color: '#b45309', mt: 0.25 }} />
            <Box>
              <Typography variant='body2' fontWeight={700} sx={{ color: '#92400e' }}>
                {content.warning}
              </Typography>
              {content.notes.map((note) => (
                <Typography key={note} variant='body2' sx={{ color: '#92400e', mt: 0.5 }}>
                  {note}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default LaboratoryMqttGuide
