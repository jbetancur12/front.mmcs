import React, { useState } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material'
import {
  Bookmark,
  BookmarkBorder,
  Save,
  Delete,
  Star
} from '@mui/icons-material'
import { FilterPreset, MaintenanceFilters } from '../../types/maintenance'
import { useFilterPresets } from '../../hooks/useFilterPresets'

interface FilterPresetSelectorProps {
  currentFilters: MaintenanceFilters
  onFiltersChange: (filters: MaintenanceFilters) => void
  onPresetSelect?: (preset: FilterPreset) => void
}

const FilterPresetSelector: React.FC<FilterPresetSelectorProps> = ({
  currentFilters,
  onFiltersChange,
  onPresetSelect
}) => {
  const { presets, loading, createPreset, deletePreset } = useFilterPresets()
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [saveError, setSaveError] = useState('')

  // Check if current filters match any preset
  const getCurrentPresetMatch = () => {
    return presets.find(preset =>
      JSON.stringify(preset.filters) === JSON.stringify(currentFilters)
    )
  }

  const currentMatch = getCurrentPresetMatch()

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setSelectedPresetId(presetId)
      onFiltersChange(preset.filters)
      onPresetSelect?.(preset)
    }
  }

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      setSaveError('El nombre del preset es requerido')
      return
    }

    if (presets.some(p => p.name.toLowerCase() === newPresetName.toLowerCase())) {
      setSaveError('Ya existe un preset con este nombre')
      return
    }

    try {
      const newPreset = createPreset(newPresetName.trim(), currentFilters)
      setSelectedPresetId(newPreset.id)
      setSaveDialogOpen(false)
      setNewPresetName('')
      setSaveError('')
    } catch (error) {
      setSaveError('Error al guardar el preset')
    }
  }

  const handleDeletePreset = (presetId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const preset = presets.find(p => p.id === presetId)
    if (preset && !preset.isDefault) {
      deletePreset(presetId)
      if (selectedPresetId === presetId) {
        setSelectedPresetId('')
      }
    }
  }

  const formatFiltersDescription = (filters: MaintenanceFilters) => {
    const parts = []
    if (filters.status?.length) parts.push(`Estado: ${filters.status.length}`)
    if (filters.priority?.length) parts.push(`Prioridad: ${filters.priority.length}`)
    if (filters.assignedTechnician?.length) parts.push(`Técnico: ${filters.assignedTechnician.length}`)
    if (filters.search) parts.push(`Búsqueda: "${filters.search}"`)
    return parts.join(', ') || 'Sin filtros'
  }

  if (loading) {
    return (
      <Box sx={{ minWidth: 200 }}>
        <Typography variant="body2" color="text.secondary">
          Cargando presets...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 300 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Filtros Guardados</InputLabel>
        <Select
          value={currentMatch?.id || selectedPresetId || ''}
          label="Filtros Guardados"
          onChange={(e) => handlePresetSelect(e.target.value)}
          startAdornment={
            currentMatch ? (
              <Bookmark sx={{ mr: 1, color: 'primary.main' }} />
            ) : (
              <BookmarkBorder sx={{ mr: 1, color: 'action.active' }} />
            )
          }
        >
          <MenuItem value="">
            <em>Seleccionar preset</em>
          </MenuItem>

          <Divider />

          {presets.filter(p => p.isDefault).map((preset) => (
            <MenuItem key={preset.id} value={preset.id}>
              <ListItemIcon>
                <Star sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={preset.name}
                secondary={formatFiltersDescription(preset.filters)}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }
                }}
              />
            </MenuItem>
          ))}

          {presets.filter(p => !p.isDefault).length > 0 && (
            <>
              <Divider />
              {presets.filter(p => !p.isDefault).map((preset) => (
                <MenuItem key={preset.id} value={preset.id}>
                  <ListItemIcon>
                    <Bookmark sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={preset.name}
                    secondary={formatFiltersDescription(preset.filters)}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    sx={{ ml: 1 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
            </>
          )}
        </Select>
      </FormControl>

      <Tooltip title="Guardar filtros actuales">
        <Button
          variant="outlined"
          size="small"
          startIcon={<Save />}
          onClick={() => setSaveDialogOpen(true)}
          disabled={!Object.keys(currentFilters).some(key =>
            currentFilters[key as keyof MaintenanceFilters]
          )}
        >
          Guardar
        </Button>
      </Tooltip>

      {/* Save Preset Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => {
          setSaveDialogOpen(false)
          setNewPresetName('')
          setSaveError('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Guardar Preset de Filtros</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre del preset"
              value={newPresetName}
              onChange={(e) => {
                setNewPresetName(e.target.value)
                setSaveError('')
              }}
              error={!!saveError}
              helperText={saveError}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Filtros actuales:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFiltersDescription(currentFilters)}
            </Typography>

            {saveError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {saveError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSaveDialogOpen(false)
              setNewPresetName('')
              setSaveError('')
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePreset}
            variant="contained"
            startIcon={<Save />}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FilterPresetSelector