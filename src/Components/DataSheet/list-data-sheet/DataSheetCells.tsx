import { Cancel, CheckCircle, Warning } from '@mui/icons-material'
import {
  Divider,
  FormControlLabel,
  MenuItem as MuiMenuItem,
  Switch,
  TextField,
  Tooltip
} from '@mui/material'
import {
  type MRT_Cell,
  type MRT_Column,
  type MRT_Row,
  type MRT_TableInstance
} from 'material-react-table'
import React from 'react'

import { menuOptions } from './constants'
import { DataSheetData } from './types'

interface CellProps {
  cell: MRT_Cell<DataSheetData>
  row: MRT_Row<DataSheetData>
}

interface EditProps extends CellProps {
  column: MRT_Column<DataSheetData>
  table: MRT_TableInstance<DataSheetData>
}

export const InvoiceCell = ({ cell }: Pick<CellProps, 'cell'>) =>
  cell.getValue() ? (
    <div style={{ textAlign: 'center' }}>
      <CheckCircle color='success' />
    </div>
  ) : (
    <div style={{ textAlign: 'center' }}>
      <Cancel color='error' />
    </div>
  )

export const StatusCell = ({ cell, row }: CellProps) => {
  const isDue =
    row.original.isInspectionDueSoon || row.original.isCalibrationDueSoon

  let isDueMessage = ''
  if (row.original.isInspectionDueSoon && row.original.isCalibrationDueSoon) {
    isDueMessage = 'Calibración y mantenimiento vencidos o prontos a vencer'
  } else if (row.original.isCalibrationDueSoon) {
    isDueMessage = 'Calibración vencida o pronta a vencer'
  } else {
    isDueMessage = 'Mantenimiento vencido o pronto a vencer'
  }
  const status = cell.getValue<string>()
  const color =
    status === 'available' ? 'green' : status === 'busy' ? 'red' : 'gray'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          marginRight: 8
        }}
      />
      {isDue && (
        <>
          <Divider orientation='vertical' flexItem />
          <Tooltip title={isDueMessage}>
            <Warning sx={{ color: 'red' }} />
          </Tooltip>
        </>
      )}
    </div>
  )
}

export const ManualEdit = ({ cell, row, column, table }: EditProps) => {
  // Función que se ejecuta al cambiar el estado del checkbox
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked

    // Actualiza el valor en el cache de edición de la fila
    row._valuesCache[column.id] = newValue

    // Actualiza el estado de edición en la tabla
    table.setEditingRow({ ...row })
  }

  return (
    <FormControlLabel
      control={
        <Switch
          checked={!!cell.getValue()} // Asegura que se trate el valor como booleano
          onChange={handleChange}
          name='manual'
          color='primary'
        />
      }
      label='Manual'
    />
  )
}

export const ServiceTypeEdit = ({ cell, row, column, table }: EditProps) => {
  // Función para manejar el cambio del select y actualizar el valor de la celda
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Actualizar el valor en el cache de edición de la fila
    row._valuesCache[column.id] = event.target.value

    // Actualizar el estado de edición en la tabla
    table.setEditingRow({ ...row })
  }

  return (
    <TextField
      variant='standard'
      fullWidth
      select
      label='Tipo de Servicio'
      value={cell.getValue()?.toString() || ''}
      onChange={handleChange}
    >
      {menuOptions.map((option) => (
        <MuiMenuItem key={option.value} value={option.value}>
          {option.text}
        </MuiMenuItem>
      ))}
    </TextField>
  )
}
