import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { ui } from './calibrationServicesListConstants'
import { CalibrationServicesColumn } from './calibrationServicesListTypes'
import CalibrationServiceListCard from './CalibrationServiceListCard'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'
import { CalibrationServicesListActions } from './useCalibrationServicesListActions'

interface CalibrationServicesGroupedListProps {
  groups: CalibrationServicesColumn[]
  permissions: CalibrationServicesListPermissions
  actions: CalibrationServicesListActions
  currentUserEmail?: string | null
}

/** Vista de lista: servicios agrupados por etapa en acordeones (cerrados colapsados). */
const CalibrationServicesGroupedList = ({
  groups,
  permissions,
  actions,
  currentUserEmail
}: CalibrationServicesGroupedListProps) => (
  <Stack spacing={1.5}>
    {groups.map((group) => {
      const isDefaultExpanded = group.key !== 'closed'
      return (
        <Accordion
          key={group.key}
          defaultExpanded={isDefaultExpanded}
          disableGutters
          elevation={0}
          sx={{
            border: `1px solid ${ui.border}`,
            borderRadius: '16px !important',
            '&::before': { display: 'none' },
            overflow: 'hidden'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreOutlinedIcon />}
            sx={{
              backgroundColor: '#f9fafb',
              borderBottom: `1px solid ${ui.border}`,
              minHeight: 48,
              '&.Mui-expanded': { minHeight: 48 },
              '& .MuiAccordionSummary-content': { my: 1 }
            }}
          >
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: group.accent, flexShrink: 0 }} />
              <Typography variant='subtitle1' fontWeight={700} sx={{ color: ui.text }}>
                {group.title}
              </Typography>
              <Chip
                size='small'
                label={group.services.length}
                sx={{ bgcolor: '#f3f4f6', color: '#374151', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <Stack spacing={2}>
              {group.services.map((service) => (
                <CalibrationServiceListCard
                  key={service.id}
                  service={service}
                  permissions={permissions}
                  actions={actions}
                  currentUserEmail={currentUserEmail}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )
    })}
  </Stack>
)

export default CalibrationServicesGroupedList
