import React from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  Fade,
  Chip,
  Alert,
  Tooltip
} from '@mui/material'
import {
  ArrowBack,
  Add,
  Edit,
  Check,
  Cancel,
  LocationOn,
  Business,
  Visibility
} from '@mui/icons-material'

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
    <Box sx={{ py: 2 }}>
      {!selectedSede ? (
        <>
          {/* Header with Add Button */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box display="flex" alignItems="center">
              <Avatar 
                sx={{ 
                  backgroundColor: '#10b981',
                  mr: 2,
                  width: 40,
                  height: 40
                }}
              >
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
                  Gestión de Sedes
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {sedes.length} {sedes.length === 1 ? 'sede registrada' : 'sedes registradas'}
                </Typography>
              </Box>
            </Box>

            {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddClick}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  }
                }}
              >
                Agregar Sede
              </Button>
            )}
          </Box>

          {/* Add New Sede Form */}
          {isAdding && (
            <Fade in={isAdding}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  mb: 3,
                  backgroundColor: '#f0fdf4'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1f2937' }}>
                    Nueva Sede
                  </Typography>
                  <Box display="flex" gap={2} alignItems="end">
                    <TextField
                      label="Nombre de la sede"
                      variant="outlined"
                      fullWidth
                      value={newSede}
                      onChange={(e) => setNewSede(e.target.value)}
                      placeholder="Ej: Sede Principal, Sucursal Norte..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981'
                          }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSubmitAdd}
                      disabled={!newSede.trim()}
                      sx={{
                        backgroundColor: '#10b981',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': {
                          backgroundColor: '#059669'
                        }
                      }}
                    >
                      <Check />
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelAdd}
                      sx={{
                        borderColor: '#d1d5db',
                        color: '#374151',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#9ca3af',
                          backgroundColor: '#f9fafb'
                        }
                      }}
                    >
                      <Cancel />
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Sedes Grid */}
          {sedes.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bfdbfe'
              }}
            >
              <Typography variant="body2">
                No hay sedes registradas. Agrega la primera sede para comenzar.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {sedes.map((sede, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Fade in={true} timeout={300 + index * 100}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#10b981',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {editingIndex === index ? (
                          // Edit Mode
                          <Box>
                            <TextField
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              autoFocus
                              fullWidth
                              variant="outlined"
                              sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                }
                              }}
                            />
                            <Box display="flex" gap={1} justifyContent="end">
                              <Tooltip title="Guardar cambios">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditSave(index)
                                  }}
                                  sx={{
                                    color: '#10b981',
                                    '&:hover': {
                                      backgroundColor: '#f0fdf4'
                                    }
                                  }}
                                >
                                  <Check />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditCancel()
                                  }}
                                  sx={{
                                    color: '#6b7280',
                                    '&:hover': {
                                      backgroundColor: '#f9fafb'
                                    }
                                  }}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ) : (
                          // View Mode
                          <Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                              <Box display="flex" alignItems="center">
                                <Avatar 
                                  sx={{ 
                                    backgroundColor: '#f0fdf4',
                                    mr: 2,
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  <LocationOn sx={{ color: '#10b981', fontSize: 18 }} />
                                </Avatar>
                                <Typography 
                                  variant="h6" 
                                  fontWeight="600" 
                                  sx={{ 
                                    color: '#1f2937',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {sede.toUpperCase()}
                                </Typography>
                              </Box>
                              
                              {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
                                <Tooltip title="Editar sede">
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditClick(index, sede)
                                    }}
                                    sx={{
                                      color: '#6b7280',
                                      '&:hover': {
                                        backgroundColor: '#f0fdf4',
                                        color: '#10b981'
                                      }
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Chip
                                label="Activa"
                                size="small"
                                sx={{
                                  backgroundColor: '#f0fdf4',
                                  color: '#059669',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                              
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => onSedeClick(sede)}
                                sx={{
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    borderColor: '#059669',
                                    backgroundColor: '#f0fdf4',
                                    color: '#059669'
                                  }
                                }}
                              >
                                Ver Detalles
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        // Selected Sede View
        <Box>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton 
              onClick={() => setSelectedSede(null)}
              sx={{ 
                mr: 2,
                color: '#374151',
                '&:hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
              Detalles de {selectedSedeString}
            </Typography>
          </Box>
          
          <SelectedHq
            onDelete={onDelete}
            sedes={sedes}
            selectedSede={selectedSedeString}
          />
        </Box>
      )}
    </Box>
  )
}

export default Headquarters
