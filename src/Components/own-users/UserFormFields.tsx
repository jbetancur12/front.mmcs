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

// Estilo de los campos de los diálogos (borde esmeralda al pasar/enfocar)
export const userFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease-in-out',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#10b981'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#10b981',
      borderWidth: '2px'
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600
  }
}

/** TextField de los diálogos de usuario (reenvía la ref para usarlo dentro de Fade). */
export const UserTextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  function UserTextField(props, ref) {
    return (
      <TextField
        ref={ref}
        variant='outlined'
        fullWidth
        sx={userFieldSx}
        {...props}
      />
    )
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
          >
            Ver roles
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
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  fontWeight: 500,
                  '& .MuiChip-deleteIcon': {
                    color: '#059669'
                  }
                }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label='Roles *'
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
              sx={userFieldSx}
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
    <Alert
      severity='warning'
      sx={{
        borderRadius: '12px',
        '& .MuiAlert-message': {
          fontWeight: 500
        }
      }}
    >
      Por favor, corrige los errores antes de continuar
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

// Botón secundario (cancelar/descartar) de los diálogos
export const cancelButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  px: 4,
  py: 1.5,
  borderColor: '#d1d5db',
  color: '#6b7280',
  '&:hover': {
    borderColor: '#9ca3af',
    backgroundColor: '#f9fafb',
    transform: 'translateY(-1px)'
  }
} as const

// Botón principal con degradado esmeralda de los diálogos
export const submitButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  px: 4,
  py: 1.5,
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.6)'
  },
  '&:disabled': {
    background: '#e5e7eb',
    color: '#9ca3af',
    transform: 'none',
    boxShadow: 'none'
  }
} as const
