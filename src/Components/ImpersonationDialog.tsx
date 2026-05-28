import React, { useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'

interface ImpersonationUser {
  id: number
  name: string
  email: string
  roles: string[]
  customerId?: number | null
  customerName?: string | null
  userType: 'client' | 'internal'
}

interface ImpersonationDialogProps {
  open: boolean
  searching: boolean
  candidates: ImpersonationUser[]
  onSearch: (query: string) => void
  onSelect: (userId: number) => void
  onClose: () => void
}

const ImpersonationDialog: React.FC<ImpersonationDialogProps> = ({
  open,
  searching,
  candidates,
  onSearch,
  onSelect,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const internalUsers = candidates.filter((c) => c.userType === 'internal')
  const clientUsers = candidates.filter((c) => c.userType === 'client')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant='h6' fontWeight={800}>
          Suplantar usuario
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Busca un usuario para iniciar sesión como él y ver lo que él ve.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          fullWidth
          size='small'
          placeholder='Buscar por nombre o email...'
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {searching && (
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>
            Buscando...
          </Typography>
        )}

        {!searching && candidates.length === 0 && query.trim() && (
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>
            No se encontraron usuarios.
          </Typography>
        )}

        {!searching && !query.trim() && (
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>
            Escribe al menos 3 caracteres para buscar.
          </Typography>
        )}

        {internalUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant='caption'
              fontWeight={700}
              sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', ml: 1, mb: 0.5, display: 'block' }}
            >
              <GroupOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-top' }} />
              Usuarios internos
            </Typography>
            <List dense disablePadding>
              {internalUsers.map((u) => (
                <ListItemButton
                  key={u.id}
                  onClick={() => onSelect(u.id)}
                  sx={{ borderRadius: '8px', mb: 0.25 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#6366f1' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={u.email}
                    primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 1, maxWidth: 160, justifyContent: 'flex-end' }}>
                    {u.roles.slice(0, 3).map((r) => (
                      <Chip
                        key={r}
                        size='small'
                        label={r}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.6 } }}
                      />
                    ))}
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {clientUsers.length > 0 && (
          <Box>
            <Typography
              variant='caption'
              fontWeight={700}
              sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', ml: 1, mb: 0.5, display: 'block' }}
            >
              <BusinessOutlinedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-top' }} />
              Clientes
            </Typography>
            <List dense disablePadding>
              {clientUsers.map((u) => (
                <ListItemButton
                  key={u.id}
                  onClick={() => onSelect(u.id)}
                  sx={{ borderRadius: '8px', mb: 0.25 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#059669' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={u.customerName || u.email}
                    primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 1, maxWidth: 160, justifyContent: 'flex-end' }}>
                    {u.roles.slice(0, 2).map((r) => (
                      <Chip
                        key={r}
                        size='small'
                        label={r}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.6 } }}
                      />
                    ))}
                  </Box>
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImpersonationDialog
