import React from 'react'
import { capitalize } from '../utils/loadOptions'
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
  TextField,
  Typography
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircleIcon from '@mui/icons-material/Circle'
import AddIcon from '@mui/icons-material/Add'
import { Certificate } from './CertificateListItem'
import SelectedHq from './SelectedHq'

interface HeadquartersProps {
  hqs: { [key: string]: any }
  onDelete: (id: number) => void
  sedes: string[]
  onAddSede: (newSede: string) => void // Callback function to handle adding new sede
}

const Headquarters: React.FC<HeadquartersProps> = ({
  hqs,
  onDelete,
  sedes,
  onAddSede
}) => {
  const [selectedSede, setSelectedSede] = React.useState<null | Certificate[]>(
    null
  )

  const [isAdding, setIsAdding] = React.useState(false)
  const [newSede, setNewSede] = React.useState('')

  const onSedeClick = (sede: string) => {
    setSelectedSede(hqs[sede])
  }

  const handleAddClick = () => {
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setNewSede('')
  }

  const handleSubmit = () => {
    if (newSede.trim()) {
      onAddSede(newSede.trim())
      setNewSede('')
      setIsAdding(false)
    }
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
        <>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {!isAdding ? (
              <Button
                variant='contained'
                sx={{ mb: 2 }}
                onClick={handleAddClick}
              >
                <AddIcon />
              </Button>
            ) : (
              <Box sx={{ mb: 2 }}>
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
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                >
                  Agregar
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </Box>
            )}
            <List sx={{ flexGrow: 1, overflowY: 'auto', width: '200px' }}>
              {sedes.map((sede, index) => (
                <ButtonBase
                  key={index}
                  sx={{ width: '100%' }}
                  onClick={() => onSedeClick(sede)}
                >
                  <ListItem
                    sx={{
                      '&:hover': {
                        backgroundColor: 'lightgreen',
                        borderRadius: '5px'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <CircleIcon sx={{ fontSize: 10 }} />
                    </ListItemIcon>
                    <ListItemText primary={sede.toUpperCase()} />
                  </ListItem>
                </ButtonBase>
              ))}
            </List>
          </Box>
        </>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <IconButton onClick={() => setSelectedSede(null)} sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <SelectedHq
            certificates={selectedSede}
            onDelete={onDelete}
            sedes={sedes}
          />
        </Box>
      )}
    </Paper>
  )
}

export default Headquarters
