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
  ListItemIcon
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircleIcon from '@mui/icons-material/Circle'
import { Certificate } from './CertificateListItem'
import SelectedHq from './SelectedHq'

interface HeadquartersProps {
  hqs: { [key: string]: any }
  onDelete: (id: number) => void
}

const Headquarters: React.FC<HeadquartersProps> = ({ hqs, onDelete }) => {
  const sedes = Object.keys(hqs)
  const [selectedSede, setSelectedSede] = React.useState<null | Record<
    string,
    Certificate
  >>(null)

  const onSedeClick = (sede: string) => {
    setSelectedSede(hqs[sede])
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2
        // height: '100%', // Full height of the container
        // display: 'flex',
        // flexDirection: 'column',
        // overflow: 'hidden' // Prevent scroll unless necessary
      }}
    >
      {!selectedSede ? (
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
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <IconButton onClick={() => setSelectedSede(null)} sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <SelectedHq certificates={selectedSede} onDelete={onDelete} />
        </Box>
      )}
    </Paper>
  )
}

export default Headquarters
