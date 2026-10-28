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
  TextFieldProps,
  Typography
} from '@mui/material'
import React from 'react'

import { roleModulesText, unassignableText } from './roleSummary'
import { AssignableRole, Role } from './types'
import { getRoleChipLabel } from './userValidation'

/** TextField de los diálogos de usuario (reenvía la ref para usarlo dentro de Fade). */
export const UserTextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  function UserTextField(props, ref) {
    return <TextField ref={ref} variant='outlined' fullWidth {...props} />
  }
)

interface RolesFieldProps {
  rolesList?: AssignableRole[]
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
    const selectedIds = new Set(value.map((role) => role.id))
    // Los roles elegidos se completan con los datos de la lista (capacidades, si se pueden dar...)
    const selected = value.map(
      (role) =>
        rolesList?.find((candidate) => candidate.id === role.id) ??
        ({
          ...role,
          isActive: true,
          isSystem: false,
          permissions: [],
          assignable: true,
          reason: null,
          missing: []
        } as AssignableRole)
    )
    // Los roles desactivados no se ofrecen (salvo que la persona ya lo tenga)
    const options = (rolesList ?? []).filter(
      (role) => role.isActive || selectedIds.has(role.id)
    )
    const someBlocked = options.some(
      (role) => !role.assignable && !selectedIds.has(role.id)
    )

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
          options={options}
          autoComplete={false}
          value={selected}
          isOptionEqualToValue={(option, current) => option.id === current.id}
          // Un rol que quien asigna no puede dar se ve gris y dice por qué; si la persona ya lo tiene se deja
          // (quitarlo siempre se puede)
          getOptionDisabled={(option) =>
            !option.assignable && !selectedIds.has(option.id)
          }
          getOptionLabel={(option) => getRoleChipLabel(option)}
          renderOption={(props, option) => {
            const blocked = unassignableText(option)
            const disabled = !option.assignable && !selectedIds.has(option.id)
            return (
              <li {...props} key={option.id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='body2' fontWeight={600}>
                    {getRoleChipLabel(option)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {roleModulesText(option)}
                  </Typography>
                  {disabled && blocked && (
                    <Typography
                      variant='caption'
                      component='div'
                      sx={{ color: '#b45309' }}
                    >
                      {blocked}
                    </Typography>
                  )}
                </Box>
              </li>
            )
          }}
          onChange={(_, newValues) => onChange(newValues)}
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
              helperText={
                helperText ||
                (someBlocked
                  ? 'Los roles en gris no los puedes dar: incluyen capacidades que tú no tienes.'
                  : undefined)
              }
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
          filterOptions={(candidates, state) => {
            const term = state.inputValue.toLowerCase()
            return candidates.filter(
              (option) =>
                getRoleChipLabel(option).toLowerCase().includes(term) ||
                (option.description ?? '').toLowerCase().includes(term)
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
