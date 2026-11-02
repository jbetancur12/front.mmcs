import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Step,
  StepButton,
  StepContent,
  Stepper,
  Typography
} from '@mui/material'
import { OpenInNewRounded } from '@mui/icons-material'
import { DriveGuideStep } from './driveGuideSteps'

interface GuideStepperProps {
  steps: DriveGuideStep[]
  /** Cambia cuando la lista de pasos es otra (por ejemplo, otro camino): vuelve al primer paso. */
  resetKey?: string
}

/**
 * Pasos de una guía, uno abierto a la vez: qué hacer, un aviso si hace falta y «Debes ver» al final.
 * Lo usan las guías de ayuda del módulo (conectar el Drive y uso diario).
 */
const GuideStepper: React.FC<GuideStepperProps> = ({ steps, resetKey }) => {
  const [active, setActive] = useState(0)
  const last = steps.length - 1

  useEffect(() => {
    setActive(0)
  }, [resetKey])

  return (
    <Stepper nonLinear activeStep={active} orientation='vertical'>
      {steps.map((step, index) => (
        <Step key={step.id} completed={index < active}>
          <StepButton onClick={() => setActive(index)}>
            <Typography fontWeight={600}>{step.title}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {step.where}
            </Typography>
          </StepButton>
          <StepContent>
            <Box component='ol' sx={{ pl: 2.5, my: 1 }}>
              {step.actions.map((action) => (
                <li key={action}>
                  <Typography variant='body2' sx={{ mb: 0.75 }}>
                    {action}
                  </Typography>
                </li>
              ))}
            </Box>
            {step.link && (
              <Button
                size='small'
                variant='outlined'
                component='a'
                href={step.link.url}
                target='_blank'
                rel='noopener noreferrer'
                endIcon={<OpenInNewRounded fontSize='small' />}
                sx={{ mb: 1.5 }}
              >
                {step.link.label}
              </Button>
            )}
            {step.warning && (
              <Alert severity='warning' sx={{ mb: 1.5 }}>
                {step.warning}
              </Alert>
            )}
            {step.image && (
              <Box
                component='img'
                src={step.image.src}
                alt={step.image.alt}
                sx={{
                  maxWidth: '100%',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  mb: 1.5
                }}
              />
            )}
            <Alert severity='success' variant='outlined' sx={{ mb: 1.5 }}>
              <strong>Debes ver:</strong> {step.expect}
            </Alert>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size='small'
                disabled={index === 0}
                onClick={() => setActive(index - 1)}
              >
                Anterior
              </Button>
              {index < last && (
                <Button
                  size='small'
                  variant='contained'
                  onClick={() => setActive(index + 1)}
                  sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
                >
                  Ya lo hice, siguiente
                </Button>
              )}
            </Box>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  )
}

export default GuideStepper
