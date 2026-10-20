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

export const RolesCell: React.FC<{ cell: MRT_Cell<UserData> }> = ({ cell }) => {
  const roles = cell.getValue<Role[]>() // Obtén los roles desde la celda
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {roles.map((role, index) => (
        <Tooltip key={index} title={role.description} arrow placement='top'>
          <Chip
            label={getRoleChipLabel(role)}
            size='small'
            sx={{
              backgroundColor: '#d1fae5',
              color: '#059669',
              fontWeight: 500,
              fontSize: '0.75rem',
              cursor: 'help',
              '&:hover': {
                backgroundColor: '#a7f3d0',
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          />
        </Tooltip>
      ))}
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
