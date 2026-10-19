import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
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
            border: `1px solid ${alpha(group.accent, 0.16)}`,
            borderRadius: '16px !important',
            '&::before': { display: 'none' },
            overflow: 'hidden'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreOutlinedIcon />}
            sx={{
              background: `linear-gradient(90deg, ${alpha(group.accent, 0.06)} 0%, transparent 100%)`,
              borderBottom: `1px solid ${alpha(group.accent, 0.1)}`,
              minHeight: 48,
              '&.Mui-expanded': { minHeight: 48 },
              '& .MuiAccordionSummary-content': { my: 1 }
            }}
          >
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Box sx={{ width: 4, height: 24, borderRadius: 2, backgroundColor: group.accent }} />
              <Typography variant='subtitle1' fontWeight={800} sx={{ color: ui.text }}>
                {group.title}
              </Typography>
              <Chip
                size='small'
                label={group.services.length}
                sx={{ bgcolor: alpha(group.accent, 0.12), color: group.accent, fontWeight: 800 }}
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
