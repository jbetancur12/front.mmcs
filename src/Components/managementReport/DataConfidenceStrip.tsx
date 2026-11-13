import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { VerifiedOutlined } from '@mui/icons-material'
import { brand, intent, neutral } from 'src/theme/designTokens'
import type {
  ManagementReportConfidenceItem,
  ManagementReportDataConfidence
} from 'src/types/managementReport'

const ChipList = ({
  items,
  color
}: {
  items: ManagementReportConfidenceItem[]
  color: string
}) => (
  <Stack direction='row' flexWrap='wrap' useFlexGap spacing={0.75}>
    {items.map((item) => (
      <Tooltip key={`${item.code}-${item.label}`} title={item.reason} arrow>
        <Chip
          size='small'
          variant='outlined'
          label={item.label}
          sx={{ borderColor: color, color: neutral.textBody }}
        />
      </Tooltip>
    ))}
  </Stack>
)

/** Franja corta bajo la portada: qué cifras son firmes y cuáles dependen del registro. */
const DataConfidenceStrip = ({
  confidence
}: {
  confidence: ManagementReportDataConfidence
}) => {
  const { firm, dependsOnRecord } = confidence
  if (!firm.length && !dependsOnRecord.length) return null
  // Una frase por motivo distinto (varios indicadores comparten el mismo)
  const reasons = [
    ...new Set(
      dependsOnRecord.filter((item) => item.code).map((item) => item.reason)
    )
  ]
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: `1px solid ${neutral.border}`,
        borderRadius: 3
      }}
    >
      <Stack direction='row' spacing={1} alignItems='center' mb={1}>
        <VerifiedOutlined sx={{ color: brand.ink }} />
        <Typography variant='h6'>Confianza de los datos</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {firm.length > 0 && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
              Cifras firmes
            </Typography>
            <ChipList items={firm} color={intent.success} />
          </Box>
        )}
        {dependsOnRecord.length > 0 && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
              Dependen del registro
            </Typography>
            <ChipList items={dependsOnRecord} color={neutral.borderStrong} />
          </Box>
        )}
      </Stack>
      {reasons.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          {reasons.map((reason) => (
            <Typography
              key={reason}
              variant='body2'
              color='text.secondary'
              sx={{ display: 'block' }}
            >
              {reason}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  )
}

export default DataConfidenceStrip
