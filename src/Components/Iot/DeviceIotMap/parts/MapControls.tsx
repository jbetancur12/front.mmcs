// components/DeviceIotMap/parts/MapControls.tsx
import { IconButton, Box } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

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
          backgroundColor: '#fff',
          border: '2px solid rgba(0,0,0,0.2)',
          '&:hover': { backgroundColor: '#f5f5f5' }
        }}
        onClick={onToggleSidebar}
      >
        <MenuIcon />
      </IconButton>
    )}
  </Box>
)
