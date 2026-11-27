import { Fragment } from 'react'
import {
  Alert,
  Box,
  Card,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import {
  FLOW_CERTIFICATE_LINKS,
  FLOW_DEADLINES,
  FLOW_PHASES,
  FLOW_ROLE_LABELS,
  FLOW_WORDS,
  FlowDecision,
  FlowNode,
  FlowRole,
  FlowStep
} from './calibrationFlowDiagramContent'
import { accent, brand, intent, neutral } from 'src/theme/designTokens'

const ROLE_COLORS: Record<FlowRole, string> = {
  commercial: intent.infoInk,
  coordination: brand.ink,
  metrologist: accent.ink,
  review: intent.warningInk,
  invoicing: intent.dangerInk,
  customer: intent.successInk,
  platform: neutral.textBody
}

const TONES = {
  ok: intent.successSoft,
  warn: intent.warningSoft,
  bad: intent.dangerSoft
} as const

const cardSx = {
  border: `1px solid ${neutral.border}`,
  borderRadius: '16px',
  p: { xs: 2, md: 3 }
} as const

const Badge = ({ text, size = 36 }: { text: string; size?: number }) => (
  <Box
    aria-hidden
    sx={{
      flexShrink: 0,
      width: size,
      height: size,
      borderRadius: '50%',
      bgcolor: brand.main,
      color: '#fff',
      fontWeight: 700,
      display: 'grid',
      placeItems: 'center'
    }}
  >
    {text}
  </Box>
)

const StepCard = ({ step }: { step: FlowStep }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1.5,
      p: 2,
      border: `1px solid ${neutral.border}`,
      borderLeft: `6px solid ${ROLE_COLORS[step.role]}`,
      borderRadius: '12px'
    }}
  >
    <Box
      aria-hidden
      sx={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: `2px solid ${ROLE_COLORS[step.role]}`,
        color: ROLE_COLORS[step.role],
        fontWeight: 700,
        display: 'grid',
        placeItems: 'center'
      }}
    >
      {step.number}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant='overline'
        sx={{
          color: ROLE_COLORS[step.role],
          fontWeight: 700,
          lineHeight: 1.4
        }}
      >
        {FLOW_ROLE_LABELS[step.role]}
      </Typography>
      <Typography fontWeight={700}>{step.title}</Typography>
      <Typography variant='body2'>{step.text}</Typography>
      {step.where && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
          <b>Dónde:</b> {step.where}
        </Typography>
      )}
      {step.automatic && (
        <Typography
          variant='body2'
          sx={{ mt: 0.75, pt: 0.75, borderTop: `1px dashed ${neutral.border}` }}
        >
          <b>La plataforma hace sola:</b> {step.automatic}
        </Typography>
      )}
      {step.state && (
        <Chip
          size='small'
          variant='outlined'
          label={`Queda: ${step.state}`}
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  </Box>
)

const DecisionCard = ({ decision }: { decision: FlowDecision }) => (
  <Box
    sx={{
      p: 1.5,
      border: `2px dashed ${neutral.borderStrong}`,
      borderRadius: '16px'
    }}
  >
    <Typography fontWeight={700} textAlign='center' sx={{ mb: 1 }}>
      {decision.question}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(auto-fit, minmax(180px, 1fr))'
        }
      }}
    >
      {decision.branches.map((branch) => (
        <Box
          key={branch.answer}
          sx={{ p: 1.5, borderRadius: 2, bgcolor: TONES[branch.tone] }}
        >
          <Typography variant='body2' fontWeight={700}>
            {branch.answer}
          </Typography>
          <Typography variant='body2'>{branch.result}</Typography>
        </Box>
      ))}
    </Box>
  </Box>
)

const Arrow = () => (
  <ArrowDownwardIcon
    aria-hidden
    fontSize='small'
    sx={{ alignSelf: 'center', color: neutral.textFaint }}
  />
)

const Flow = ({ nodes }: { nodes: FlowNode[] }) => (
  <Stack spacing={1}>
    {nodes.map((node, index) => (
      <Fragment key={index}>
        {index > 0 && <Arrow />}
        {node.kind === 'step' && <StepCard step={node} />}
        {node.kind === 'decision' && <DecisionCard decision={node} />}
        {node.kind === 'split' && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                lg: 'repeat(2, minmax(0, 1fr))'
              }
            }}
          >
            {node.columns.map((column) => (
              <Box
                key={column.title}
                sx={{
                  p: 1.5,
                  border: `1px solid ${neutral.border}`,
                  borderRadius: '16px'
                }}
              >
                <Typography fontWeight={700} textAlign='center' sx={{ mb: 1 }}>
                  {column.title}
                </Typography>
                <Flow nodes={column.steps} />
              </Box>
            ))}
          </Box>
        )}
      </Fragment>
    ))}
  </Stack>
)

const SimpleTable = ({
  headers,
  rows
}: {
  headers: string[]
  rows: string[][]
}) => (
  <Box sx={{ overflowX: 'auto' }}>
    <Table size='small'>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableCell key={header} sx={{ fontWeight: 700 }}>
              {header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell, index) => (
              <TableCell key={index}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
)

/** Diagrama de flujo del módulo en lenguaje sencillo, de la cotización al cierre, con Certificados a liberar. */
const CalibrationFlowDiagram = () => (
  <Stack spacing={3} sx={{ maxWidth: 960, mx: 'auto' }}>
    <Box
      component='nav'
      aria-label='Etapas del diagrama'
      sx={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(6, minmax(0, 1fr))'
        }
      }}
    >
      {FLOW_PHASES.map((phase) => (
        <Box
          key={phase.id}
          component='a'
          href={`#${phase.id}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 0.5,
            p: 1,
            color: 'text.primary',
            textDecoration: 'none',
            border: `1px solid ${neutral.border}`,
            borderRadius: '12px',
            '&:hover': { borderColor: brand.main, bgcolor: brand.soft }
          }}
        >
          <Badge text={phase.letter} size={28} />
          <Typography variant='body2' fontWeight={700}>
            {phase.short}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {phase.summary}
          </Typography>
        </Box>
      ))}
    </Box>

    <Card elevation={0} sx={cardSx}>
      <Typography variant='h6' fontWeight={700} sx={{ mb: 1 }}>
        Palabras que conviene conocer
      </Typography>
      {FLOW_WORDS.map(([word, meaning]) => (
        <Typography key={word} variant='body2' sx={{ mb: 0.5 }}>
          <b>{word}:</b> {meaning}
        </Typography>
      ))}
      <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
        Cada cuadro numerado es una acción y su color dice quién la hace. Los
        cuadros punteados son preguntas: según la respuesta se sigue un camino.
        Quién puede hacer cada paso depende de los permisos de su rol.
      </Typography>
      <Stack direction='row' flexWrap='wrap' useFlexGap spacing={2} mt={1}>
        {(Object.keys(FLOW_ROLE_LABELS) as FlowRole[]).map((role) => (
          <Stack key={role} direction='row' spacing={0.75} alignItems='center'>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '3px',
                bgcolor: ROLE_COLORS[role]
              }}
            />
            <Typography variant='caption'>{FLOW_ROLE_LABELS[role]}</Typography>
          </Stack>
        ))}
      </Stack>
    </Card>

    {FLOW_PHASES.map((phase) => (
      <Box
        key={phase.id}
        id={phase.id}
        component='section'
        sx={{ scrollMarginTop: 80 }}
      >
        <Stack direction='row' spacing={1.5} alignItems='center' mb={1.5}>
          <Badge text={phase.letter} />
          <Box>
            <Typography variant='h6' fontWeight={700}>
              {phase.title}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {phase.intro}
            </Typography>
          </Box>
        </Stack>
        <Flow nodes={phase.nodes} />
        {phase.note && (
          <Alert severity='warning' sx={{ mt: 1.5, borderRadius: 2 }}>
            {phase.note}
          </Alert>
        )}
      </Box>
    ))}

    <Card elevation={0} sx={cardSx}>
      <Typography variant='h6' fontWeight={700}>
        Cómo se conectan los certificados con la orden
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        Un certificado pertenece a una orden y a una visita, y para cobrarlo
        también se puede asignar a un corte. Al liberarlo queda en el equipo del
        cliente.
      </Typography>
      <SimpleTable
        headers={[
          'Cuando en los certificados pasa esto…',
          '…en la orden cambia esto'
        ]}
        rows={FLOW_CERTIFICATE_LINKS}
      />
      <Alert severity='warning' sx={{ mt: 1.5, borderRadius: 2 }}>
        Liberar un certificado y marcarlo como enviado en el corte son dos pasos
        distintos. Liberar no factura ni cierra nada por sí solo. Un certificado
        cargado sin orden no cuenta para ninguna visita ni corte.
      </Alert>
    </Card>

    <Card elevation={0} sx={cardSx}>
      <Typography variant='h6' fontWeight={700}>
        Plazos y alertas
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        Días hábiles. Son los valores iniciales: se pueden cambiar en la
        configuración de tiempos o en cada orden.
      </Typography>
      <SimpleTable
        headers={[
          'Qué hay que hacer',
          'Desde cuándo cuenta',
          'Tiempo',
          'Quién'
        ]}
        rows={FLOW_DEADLINES}
      />
    </Card>
  </Stack>
)

export default CalibrationFlowDiagram
