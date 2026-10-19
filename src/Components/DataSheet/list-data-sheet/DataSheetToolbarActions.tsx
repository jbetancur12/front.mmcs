import {
  CallMissedOutgoing,
  Event,
  Inventory,
  PrecisionManufacturing,
  SyncAlt
} from '@mui/icons-material'
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
  Tooltip
} from '@mui/material'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { menuOptions } from './constants'
import { DataSheetData, MenuOption } from './types'

interface ScheduleMenuProps {
  title: string
  icon: React.ReactNode
  general: MenuOption
  tableData: DataSheetData[]
}

// Botón con menú: opción general + una por tipo de servicio
const ScheduleMenu = ({ title, icon, general, tableData }: ScheduleMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClose = () => setAnchorEl(null)

  return (
    <Tooltip arrow placement='right' title={title}>
      <div>
        <IconButton
          onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(event.currentTarget)
          }
        >
          {icon}
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
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
    </Tooltip>
  )
}

interface DataSheetToolbarActionsProps {
  tableData: DataSheetData[]
}

const DataSheetToolbarActions = ({ tableData }: DataSheetToolbarActionsProps) => (
  <Box display='flex' alignItems='center' sx={{ gap: 2, position: 'relative' }}>
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
      title='Programa de Calibración'
      icon={<PrecisionManufacturing />}
      general={{
        value: 'Cronograma General',
        text: 'Cronograma General',
        route: 'calibration-program'
      }}
      tableData={tableData}
    />
    <ScheduleMenu
      title='Cronograma de Mantenimiento'
      icon={<Event />}
      general={{
        value: 'Cronograma General',
        text: 'Cronograma General',
        route: 'maintenance-schedule'
      }}
      tableData={tableData}
    />
    <Divider orientation='vertical' flexItem />
    <Tooltip arrow placement='right' title='Inventario Prestamo'>
      <Link to='inventory-leasing'>
        <IconButton>
          <SyncAlt />
        </IconButton>
      </Link>
    </Tooltip>
    <Tooltip arrow placement='right' title='Equipos en Prestamo'>
      <Link to='devices-on-loan'>
        <IconButton>
          <CallMissedOutgoing />
        </IconButton>
      </Link>
    </Tooltip>
  </Box>
)

export default DataSheetToolbarActions
