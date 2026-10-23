import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import { CalibrationService } from '../../../types/calibrationService'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import StatusPill from 'src/Components/Common/StatusPill'
import { currencyFormatter, ui } from './calibrationServicesListConstants'
import { CalibrationServicesColumn } from './calibrationServicesListTypes'
import { getItemsTotal } from './calibrationServicesListUtils'
import CalibrationServiceListCard from './CalibrationServiceListCard'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'
import { CalibrationServicesListActions } from './useCalibrationServicesListActions'

const GROUPED_STORAGE_KEY = 'calibrationServicesListGrouped'

const readGroupedPreference = () => {
  try {
    return localStorage.getItem(GROUPED_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

interface CalibrationServicesGroupedListProps {
  services: CalibrationService[]
  groups: CalibrationServicesColumn[]
  permissions: CalibrationServicesListPermissions
  actions: CalibrationServicesListActions
  currentUserEmail?: string | null
}

/** Vista de lista: servicios agrupados por etapa en acordeones (cerrados colapsados). */
const CalibrationServicesGroupedList = ({
  services,
  groups,
  permissions,
  actions,
  currentUserEmail
}: CalibrationServicesGroupedListProps) => {
  // Los totales en $ no se muestran a quienes solo ven la parte técnica
  const showTotals =
    !permissions.isTechnicalOnlyView && !permissions.isAnalystOnlyView
  const [isGrouped, setIsGrouped] = useState(readGroupedPreference)
  const handleGroupedChange = (checked: boolean) => {
    setIsGrouped(checked)
    try {
      localStorage.setItem(GROUPED_STORAGE_KEY, String(checked))
    } catch {
      // Sin almacenamiento la preferencia solo vale para esta visita
    }
  }
  // Sin agrupar: del más reciente al más antiguo, según la fecha de actualización
  const flatServices = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [services]
  )

  const groupingToggle = (
    <Stack direction='row' justifyContent='flex-end'>
      <FormControlLabel
        label={
          isGrouped
            ? 'Agrupado por etapa'
            : 'Sin agrupar · más recientes primero'
        }
        sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: '#374151', fontWeight: 600 } }}
        control={
          <Switch
            size='small'
            checked={isGrouped}
            onChange={(_event, checked) => handleGroupedChange(checked)}
            inputProps={{ 'aria-label': 'Agrupar servicios por etapa' }}
            sx={{
              '& .Mui-checked': { color: '#00BFA5' },
              '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00BFA5' }
            }}
          />
        }
      />
    </Stack>
  )

  if (!isGrouped) {
    return (
      <Stack spacing={1.5}>
        {groupingToggle}
        {flatServices.map((service) => (
          <CalibrationServiceListCard
            key={service.id}
            service={service}
            permissions={permissions}
            actions={actions}
            currentUserEmail={currentUserEmail}
          />
        ))}
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      {groupingToggle}
      {groups.map((group) => {
        const isDefaultExpanded = group.key !== 'closed'
        const redCount = group.services.filter(
          (service) => service.slaIndicator?.color === 'red'
        ).length
        const alertCount = group.services.filter((service) =>
          ['yellow', 'red'].includes(service.slaIndicator?.color ?? '')
        ).length
        const total = group.services.reduce(
          (sum, service) => sum + getItemsTotal(service),
          0
        )
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
              <Stack
                direction='row'
                spacing={1.5}
                alignItems='center'
                flexWrap='wrap'
                useFlexGap
                sx={{ width: '100%', pr: 1 }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: group.accent,
                    flexShrink: 0
                  }}
                />
                <Typography
                  variant='subtitle1'
                  fontWeight={700}
                  sx={{ color: ui.text }}
                >
                  {group.title}
                </Typography>
                <Chip
                  size='small'
                  label={group.services.length}
                  sx={{
                    bgcolor: '#f3f4f6',
                    color: '#374151',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums'
                  }}
                />
                {alertCount > 0 ? (
                  <StatusPill
                    size='small'
                    tone={redCount > 0 ? 'error' : 'warning'}
                    label={`${alertCount} en riesgo`}
                  />
                ) : null}
                {showTotals && total > 0 ? (
                  <Typography
                    variant='body2'
                    sx={{
                      ml: 'auto !important',
                      color: '#00695C',
                      fontWeight: 700
                    }}
                  >
                    {currencyFormatter.format(total)}
                  </Typography>
                ) : null}
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
}

export default CalibrationServicesGroupedList
