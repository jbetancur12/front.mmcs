import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Tooltip
} from '@mui/material'
import { type MRT_Cell, type MRT_Row } from 'material-react-table'
import React from 'react'

import { Role, UserData } from './types'
import { getRoleChipLabel } from './userValidation'

const MAX_VISIBLE_ROLES = 2

// Chip outlined turquesa; los roles que sobran se agrupan en "+N" con su detalle al pasar el mouse
const roleChipSx = {
  color: '#00695C',
  borderColor: '#00BFA5',
  fontWeight: 500,
  cursor: 'help'
}

export const RolesCell: React.FC<{ cell: MRT_Cell<UserData> }> = ({ cell }) => {
  const roles = cell.getValue<Role[]>() ?? []
  const visible = roles.slice(0, MAX_VISIBLE_ROLES)
  const hidden = roles.slice(MAX_VISIBLE_ROLES)
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((role, index) => (
        <Tooltip key={index} title={role.description} arrow placement='top'>
          <Chip
            label={getRoleChipLabel(role)}
            size='small'
            variant='outlined'
            sx={roleChipSx}
          />
        </Tooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip
          arrow
          placement='top'
          title={hidden.map((role) => getRoleChipLabel(role)).join(', ')}
        >
          <Chip
            label={`+${hidden.length}`}
            size='small'
            variant='outlined'
            sx={{ ...roleChipSx, color: '#4b5563', borderColor: '#d1d5db' }}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export const RolesEditCell: React.FC<{
  cell: MRT_Cell<UserData>
  roles?: Role[]
  loadingRoles: boolean
}> = ({ cell, roles, loadingRoles }) => (
  <Autocomplete
    multiple
    options={roles ?? []} // Array de roles obtenido desde la API
    autoComplete={false}
    freeSolo
    getOptionLabel={(option) => {
      if (typeof option === 'string') {
        return option
      }
      return option.description // Muestra la descripción en el input
    }}
    defaultValue={cell.getValue<Role[]>()}
    onChange={(_, newValues) => {
      const updatedRoles = newValues.map((v) => {
        if (typeof v === 'string') {
          return { id: 0, name: v, description: v } // Crear un objeto Role temporal
        }
        return v
      })
      cell.row.original.roles = updatedRoles
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label='Roles'
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {loadingRoles ? (
                <CircularProgress color='inherit' size={20} />
              ) : null}
              {params.InputProps.endAdornment}
            </>
          )
        }}
      />
    )}
    filterOptions={(options, state) => {
      return options.filter(
        (option) =>
          typeof option !== 'string' &&
          option.description
            .toLowerCase()
            .includes(state.inputValue.toLowerCase())
      )
    }}
    noOptionsText='No se encontraron roles'
    fullWidth
  />
)

export const StatusCell: React.FC<{ row: MRT_Row<UserData> }> = ({ row }) =>
  row.original.active === true ? (
    <Chip label='Activo' size='small' color='success' variant='outlined' />
  ) : (
    <Tooltip
      arrow
      title='Aún no activó su cuenta. Usa el enlace o reenvía el correo de activación.'
    >
      <Chip
        label='Pendiente de activación'
        size='small'
        color='warning'
        variant='outlined'
      />
    </Tooltip>
  )
