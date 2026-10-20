import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { currencyFormatter } from './calibrationServiceWorkspaceConstants'
import { CalibrationServiceWorkspaceSummary } from './calibrationServiceWorkspaceSummary'

interface CalibrationServiceWorkspaceSummaryCardProps {
  summary: CalibrationServiceWorkspaceSummary
  goToSection: (index: number) => void
}

/** Resumen económico y lista de lo que falta para guardar o enviar. */
const CalibrationServiceWorkspaceSummaryCard = ({
  summary,
  goToSection
}: CalibrationServiceWorkspaceSummaryCardProps) => {
  const {
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    validItemsCount,
    pendingRequirements,
    pendingForDraft
  } = summary

  return (
    <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', bgcolor: '#fff', boxShadow: 'none', position: { lg: 'sticky' }, top: { lg: 24 } }}>
      <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
        <Box>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
          <ReceiptLongOutlinedIcon sx={{ color: '#00897B', fontSize: 22 }} />
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Resumen económico
          </Typography>
        </Stack>
        <Stack spacing={1.5}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>Subtotal</Typography>
            <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(subtotal)}</Typography>
          </Stack>
          <Stack direction='row' justifyContent='space-between'>
            <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>IVA</Typography>
            <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(taxTotal)}</Typography>
          </Stack>
          <Stack direction='row' justifyContent='space-between'>
            <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>Descuento</Typography>
            <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(discountTotal)}</Typography>
          </Stack>
          <Divider />
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' sx={{ color: '#111827', fontWeight: 700 }}>Total</Typography>
            <Typography variant='h6' fontWeight={800} sx={{ color: '#059669' }}>
              {currencyFormatter.format(grandTotal)}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Stack spacing={1}>
          <Typography variant='subtitle2' fontWeight={700} sx={{ color: '#111827' }}>
            {pendingRequirements.length ? `Faltan ${pendingRequirements.length} para enviar` : 'Todo listo para enviar'}
          </Typography>
          {pendingRequirements.length ? (
            <>
              {!pendingForDraft.length ? (
                <Typography variant='caption' color='text.secondary'>
                  Ya puedes guardar el borrador. Lo que falta solo se exige al enviar.
                </Typography>
              ) : null}
              <Stack spacing={0.25}>
                {pendingRequirements.map((requirement) => (
                  <Box
                    key={requirement.key}
                    component='button'
                    type='button'
                    onClick={() => goToSection(requirement.section)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                      py: 0.75,
                      px: 0.75,
                      border: 0,
                      bgcolor: 'transparent',
                      textAlign: 'left',
                      font: 'inherit',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#f3f4f6' },
                      '&:focus-visible': { outline: '2px solid #00BFA5' }
                    }}
                  >
                    <ErrorOutlineOutlinedIcon sx={{ fontSize: 18, color: requirement.forDraft ? '#d97706' : '#9ca3af' }} />
                    <Typography variant='body2' sx={{ color: '#374151', flex: 1 }}>
                      {requirement.label}
                    </Typography>
                    {!requirement.forDraft ? (
                      <Typography variant='caption' sx={{ color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        al enviar
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            </>
          ) : (
            <Stack direction='row' spacing={1} alignItems='flex-start'>
              <CheckCircleOutlineOutlinedIcon sx={{ color: '#00897B', fontSize: 20, mt: 0.1 }} />
              <Typography variant='body2' color='text.secondary'>
                Cliente, evidencia, ítems y condiciones están completos.
              </Typography>
            </Stack>
          )}
          <Typography variant='caption' color='text.secondary'>
            {validItemsCount} ítem{validItemsCount === 1 ? '' : 's'} en la cotización
          </Typography>
        </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceWorkspaceSummaryCard
