import React, { useState } from 'react'
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

/**
 * Campo de las pantallas de acceso: TextField de contorno con foco
 * turquesa. Con `type='password'` agrega el botón de mostrar u ocultar.
 */
const AuthField: React.FC<TextFieldProps> = ({
  type,
  InputProps,
  sx,
  ...props
}) => {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <TextField
      fullWidth
      variant='outlined'
      {...props}
      type={isPassword && visible ? 'text' : type}
      InputProps={{
        ...InputProps,
        endAdornment: isPassword ? (
          <InputAdornment position='end'>
            <IconButton
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setVisible((value) => !value)}
              edge='end'
            >
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ) : (
          InputProps?.endAdornment
        )
      }}
      sx={[
        {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused fieldset': { borderColor: '#00897b', borderWidth: 2 }
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#00695c' }
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    />
  )
}

export default AuthField
