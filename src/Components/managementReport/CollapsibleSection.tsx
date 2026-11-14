import { useState, type ReactNode } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography
} from '@mui/material'
import { ExpandMoreOutlined } from '@mui/icons-material'
import { brand, neutral } from 'src/theme/designTokens'

const STORAGE_KEY = 'managementReport.openSections'

const readOpen = (): Record<string, boolean> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeOpen = (id: string, open: boolean) => {
  try {
    const next = { ...readOpen(), [id]: open }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Sin almacenamiento: la sección funciona igual, solo no se recuerda
  }
}

interface CollapsibleSectionProps {
  /** Identificador estable para recordar si quedó abierta. */
  id: string
  title: string
  /** Resumen de una línea que se ve con la sección cerrada. */
  summary?: string
  icon?: ReactNode
  children: ReactNode
}

/** Sección plegable, cerrada por defecto, que recuerda lo que el usuario abrió. */
const CollapsibleSection = ({
  id,
  title,
  summary,
  icon,
  children
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState<boolean>(() => readOpen()[id] === true)

  return (
    <Accordion
      elevation={0}
      expanded={open}
      onChange={(_event, next) => {
        setOpen(next)
        writeOpen(id, next)
      }}
      disableGutters
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        mb: 2,
        border: `1px solid ${neutral.border}`,
        borderRadius: 3,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreOutlined />}
        aria-controls={`${id}-content`}
        id={`${id}-header`}
      >
        <Stack direction='row' spacing={1.5} alignItems='center'>
          {icon && <Box sx={{ color: brand.ink, display: 'flex' }}>{icon}</Box>}
          <Box>
            <Typography variant='h6' sx={{ color: brand.ink }}>
              {title}
            </Typography>
            {summary && (
              <Typography variant='body2' color='text.secondary'>
                {summary}
              </Typography>
            )}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}

export default CollapsibleSection
