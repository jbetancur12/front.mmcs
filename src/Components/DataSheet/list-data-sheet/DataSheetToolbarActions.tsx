import {
  CallMissedOutgoing,
  Event,
  Inventory,
  PrecisionManufacturing,
  SyncAlt
} from '@mui/icons-material'
import { Box, Button, Menu, MenuItem as MuiMenuItem } from '@mui/material'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { menuOptions } from './constants'
import { DataSheetData, MenuOption } from './types'

// Botón secundario outlined del sistema de diseño (verde azulado)
const toolbarButtonSx = {
  whiteSpace: 'nowrap',
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
}

interface ScheduleMenuProps {
  title: string
  icon: React.ReactNode
  general: MenuOption
  tableData: DataSheetData[]
}

// Botón con menú: opción general + una por tipo de servicio
const ScheduleMenu = ({
  title,
  icon,
  general,
  tableData
}: ScheduleMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClose = () => setAnchorEl(null)

  return (
    <div>
      <Button
        size='small'
        variant='outlined'
        startIcon={icon}
        sx={toolbarButtonSx}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
          setAnchorEl(event.currentTarget)
        }
      >
        {title}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {[...[general], ...menuOptions].map((option) => (
          <MuiMenuItem
            key={option.value}
            onClick={() => handleClose()}
            component={Link}
            to={`${general.route}/${option.route === general.route ? '' : option.route}`}
            state={tableData}
          >
            {option.text}
          </MuiMenuItem>
        ))}
      </Menu>
    </div>
  )
}

interface DataSheetToolbarActionsProps {
  tableData: DataSheetData[]
}

const DataSheetToolbarActions = ({
  tableData
}: DataSheetToolbarActionsProps) => (
  <Box display='flex' alignItems='center' flexWrap='wrap' sx={{ gap: 1 }}>
    <ScheduleMenu
      title='Inventario'
      icon={<Inventory />}
      general={{
        value: 'Inventario General',
        text: 'Inventario General',
        route: 'inventory'
      }}
      tableData={tableData}
    />
    <ScheduleMenu
      title='Calibración'
      icon={<PrecisionManufacturing />}
      general={{
        value: 'Cronograma General',
        text: 'Cronograma General',
        route: 'calibration-program'
      }}
      tableData={tableData}
    />
    <ScheduleMenu
      title='Mantenimiento'
      icon={<Event />}
      general={{
        value: 'Cronograma General',
        text: 'Cronograma General',
        route: 'maintenance-schedule'
      }}
      tableData={tableData}
    />
    <Button
      size='small'
      variant='outlined'
      component={Link}
      to='inventory-leasing'
      startIcon={<SyncAlt />}
      sx={toolbarButtonSx}
    >
      Préstamos
    </Button>
    <Button
      size='small'
      variant='outlined'
      component={Link}
      to='devices-on-loan'
      startIcon={<CallMissedOutgoing />}
      sx={toolbarButtonSx}
    >
      Equipos en préstamo
    </Button>
  </Box>
)

export default DataSheetToolbarActions
