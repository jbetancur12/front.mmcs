import { HelpOutline } from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  TextField,
  TextFieldProps
} from '@mui/material'
import React from 'react'

import { Role } from './types'
import { getRoleChipLabel } from './userValidation'

/** TextField de los diálogos de usuario (reenvía la ref para usarlo dentro de Fade). */
export const UserTextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  function UserTextField(props, ref) {
    return <TextField ref={ref} variant='outlined' fullWidth {...props} />
  }
)

interface RolesFieldProps {
  rolesList?: Role[]
  loadingRoles: boolean
  value: Role[]
  error?: boolean
  helperText?: React.ReactNode
  onChange: (roles: Role[]) => void
  onShowHelp: () => void
  /** Lo inyecta Fade cuando el campo es su hijo directo. */
  style?: React.CSSProperties
}

/** Botón "Ver roles" + selector múltiple de roles. */
export const RolesField = React.forwardRef<HTMLDivElement, RolesFieldProps>(
  function RolesField(
    {
      rolesList,
      loadingRoles,
      value,
      error,
      helperText,
      onChange,
      onShowHelp,
      style
    },
    ref
  ) {
    return (
      <Box ref={ref} style={style}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size='small'
            variant='text'
            startIcon={<HelpOutline fontSize='small' />}
            onClick={onShowHelp}
            sx={{ color: '#00695C', textTransform: 'none', fontWeight: 600 }}
          >
            Qué permite cada rol
          </Button>
        </Box>
        <Autocomplete
          multiple
          options={rolesList ?? []}
          autoComplete={false}
          value={value}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option
            }
            return option.description
          }}
          onChange={(_, newValues) => {
            const roles = newValues.map((v) => {
              if (typeof v === 'string') {
                return { id: 0, name: v, description: v }
              }
              return v
            })
            onChange(roles)
          }}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={index}
                label={getRoleChipLabel(option)}
                size='small'
                sx={{
                  backgroundColor: '#E0F7F4',
                  color: '#00695C',
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': {
                    color: '#00695C'
                  }
                }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label='Roles'
              required
              variant='outlined'
              error={error}
              helperText={helperText}
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
            return options.filter((option) =>
              option.description
                .toLowerCase()
                .includes(state.inputValue.toLowerCase())
            )
          }}
          noOptionsText='No se encontraron roles'
          fullWidth
        />
      </Box>
    )
  }
)

/** Aviso de errores del formulario. */
export const FormErrorsAlert: React.FC = () => (
  <Fade in>
    <Alert severity='warning' sx={{ borderRadius: '8px' }}>
      Revisa los campos marcados en rojo antes de guardar.
    </Alert>
  </Fade>
)

/** Oculta un texto visualmente pero lo deja para lectores de pantalla. */
export const srOnlySx = {
  position: 'absolute',
  left: '-10000px',
  width: '1px',
  height: '1px',
  overflow: 'hidden'
} as const
