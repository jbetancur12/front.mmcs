// components/DeviceIotMap/parts/MapControls.tsx
import { IconButton, Box } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { neutral, withAlpha } from 'src/theme/designTokens'

export const MapControls = ({
  isSidebarOpen,
  onToggleSidebar
}: {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}) => (
  <Box sx={{ position: 'absolute', top: 40, left: 22, zIndex: 1000 }}>
    {!isSidebarOpen && (
      <IconButton
        sx={{
          backgroundColor: neutral.surface,
          border: `2px solid ${withAlpha(neutral.black, 0.2)}`,
          '&:hover': { backgroundColor: neutral.surfaceHead }
        }}
        onClick={onToggleSidebar}
      >
        <MenuIcon />
      </IconButton>
    )}
  </Box>
)
