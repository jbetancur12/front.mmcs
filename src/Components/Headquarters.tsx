import React from 'react'
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Box,
  ButtonBase,
  ListItemIcon,
  Button,
  TextField
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircleIcon from '@mui/icons-material/Circle'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CancelIcon from '@mui/icons-material/Cancel'

import SelectedHq from './SelectedHq'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'

interface HeadquartersProps {
  setSelectedSede: (sede: string | null) => void
  selectedSede: string | null
  onDelete: (id: number) => void
  sedes: string[]
  onAddSede: (newSede: string) => void
  onEditSede: (oldSede: string, newSede: string) => void
}

const Headquarters: React.FC<HeadquartersProps> = ({
  setSelectedSede,
  selectedSede,
  onDelete,
  sedes,
  onAddSede,
  onEditSede
}) => {
  const [selectedSedeString, setSelectedSedeString] = React.useState<
    string | null
  >(null)
  const $userStore = useStore(userStore)
  const [isAdding, setIsAdding] = React.useState(false)
  const [newSede, setNewSede] = React.useState('')

  // Estados para la edición en línea
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [editingValue, setEditingValue] = React.useState<string>('')

  const onSedeClick = (sede: string) => {
    setSelectedSede(sede)
    setSelectedSedeString(sede)
  }

  const handleAddClick = () => setIsAdding(true)

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewSede('')
  }

  const handleSubmitAdd = () => {
    if (newSede.trim()) {
      onAddSede(newSede.trim())
      setNewSede('')
      setIsAdding(false)
    }
  }

  const handleEditClick = (index: number, sede: string) => {
    // Al hacer clic en el botón de editar, se activa el modo edición para ese índice
    setEditingIndex(index)
    setEditingValue(sede)
  }

  const handleEditSave = (index: number) => {
    const oldSede = sedes[index]
    // Llamamos a la función onEditSede para propagar el cambio
    onEditSede(oldSede, editingValue)
    setEditingIndex(null)
  }

  const handleEditCancel = () => {
    setEditingIndex(null)
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {!selectedSede ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {$userStore.rol.some((role) =>
            ['admin', 'metrologist'].includes(role)
          ) && (
            <Box sx={{ mb: 2 }}>
              {!isAdding ? (
                <Button variant='contained' onClick={handleAddClick}>
                  <AddIcon />
                </Button>
              ) : (
                <Box>
                  <TextField
                    label='Nueva Sede'
                    variant='outlined'
                    fullWidth
                    value={newSede}
                    onChange={(e) => setNewSede(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSubmitAdd}
                    sx={{ mr: 1 }}
                  >
                    Agregar
                  </Button>
                  <Button
                    variant='outlined'
                    color='secondary'
                    onClick={handleCancelAdd}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Box>
          )}
          <List sx={{ flexGrow: 1, overflowY: 'auto', width: '400px' }}>
            {sedes.map((sede, index) => (
              <ButtonBase key={index} sx={{ width: '100%' }} component='div'>
                {editingIndex === index ? (
                  // Modo edición: sin efecto hover
                  <ListItem
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    <ListItemIcon>
                      <CircleIcon sx={{ fontSize: 10 }} />
                    </ListItemIcon>
                    {/* Contenedor que ocupa el ancho completo */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: 'auto'
                      }}
                    >
                      <TextField
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        autoFocus
                        variant='standard'
                        // Calcula el ancho: mínimo 200px y, de lo contrario, un factor multiplicado por la cantidad de caracteres
                        InputProps={{
                          style: {
                            width: `${Math.max(200, editingValue.length * 10)}px`
                          }
                        }}
                      />
                      {/* Contenedor de botones: siempre a la derecha */}
                      <Box
                        sx={{ ml: 2, display: 'flex', gap: 1, flexShrink: 0 }}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditSave(index)
                          }}
                        >
                          <CheckIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCancel()
                          }}
                        >
                          <CancelIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ) : (
                  // Modo visualización: se aplica el efecto hover
                  <ListItem
                    sx={{
                      '&:hover': {
                        backgroundColor: 'lightgreen',
                        borderRadius: '5px'
                      }
                    }}
                    onClick={() => onSedeClick(sede)}
                    secondaryAction={
                      $userStore.rol.some((role) =>
                        ['admin', 'metrologist'].includes(role)
                      ) && (
                        <IconButton
                          edge='end'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(index, sede)
                          }}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>
                      <CircleIcon sx={{ fontSize: 10 }} />
                    </ListItemIcon>
                    <ListItemText primary={sede.toUpperCase()} />
                  </ListItem>
                )}
              </ButtonBase>
            ))}
          </List>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <IconButton onClick={() => setSelectedSede(null)} sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <SelectedHq
            onDelete={onDelete}
            sedes={sedes}
            selectedSede={selectedSedeString}
          />
        </Box>
      )}
    </Paper>
  )
}

export default Headquarters
