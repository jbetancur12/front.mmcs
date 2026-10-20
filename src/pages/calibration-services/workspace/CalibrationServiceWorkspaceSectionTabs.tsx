import { Chip, Paper, Stack, Tab, Tabs } from '@mui/material'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import { TRACKED_SECTIONS, WORKSPACE_SECTIONS } from './calibrationServiceWorkspaceSections'

interface CalibrationServiceWorkspaceSectionTabsProps {
  activeSection: number
  goToSection: (index: number) => void
  pendingBySection: number[]
}

/** Navegación por pasos con el número de pendientes de cada uno. */
const CalibrationServiceWorkspaceSectionTabs = ({
  activeSection,
  goToSection,
  pendingBySection
}: CalibrationServiceWorkspaceSectionTabsProps) => (
  <Paper
    elevation={0}
    sx={{
      mb: 3,
      borderRadius: '14px',
      border: '1px solid rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}
  >
    <Tabs
      value={activeSection}
      onChange={(_, v) => goToSection(v)}
      variant='scrollable'
      scrollButtons={false}
      sx={{
        minHeight: 48,
        px: 1.5,
        '& .MuiTab-root': {
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          px: 2,
          gap: 1,
          color: 'text.secondary',
          '&.Mui-selected': { color: '#00897B' }
        },
        '& .MuiTabs-indicator': {
          backgroundColor: '#00BFA5',
          height: 3,
          borderRadius: '3px 3px 0 0'
        }
      }}
    >
      {WORKSPACE_SECTIONS.map((section, index) => (
        <Tab
          key={section.key}
          icon={section.icon}
          iconPosition='start'
          label={
            <Stack direction='row' alignItems='center' spacing={1}>
              <span>{section.label}</span>
              {pendingBySection[index] > 0 ? (
                <Chip
                  size='small'
                  color='warning'
                  variant='outlined'
                  label={pendingBySection[index]}
                  aria-label={`${pendingBySection[index]} pendientes`}
                  sx={{ height: 20, minWidth: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.8, fontWeight: 700 } }}
                />
              ) : TRACKED_SECTIONS.includes(index) ? (
                <CheckCircleOutlineOutlinedIcon aria-label='Completo' sx={{ fontSize: 16, color: '#00897B' }} />
              ) : null}
            </Stack>
          }
        />
      ))}
    </Tabs>
  </Paper>
)

export default CalibrationServiceWorkspaceSectionTabs
