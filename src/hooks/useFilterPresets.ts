import { useState, useEffect, useCallback } from 'react'
import { FilterPreset, MaintenanceFilters, MaintenanceStatus, MaintenancePriority } from '../types/maintenance'

const STORAGE_KEY = 'maintenance_filter_presets'
const CURRENT_USER_EMAIL = 'coordinacion@metromedicslab.com.co' // TODO: Get from auth context

// Default presets as specified in the requirements
const createDefaultPresets = (): FilterPreset[] => {
  const now = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]

  return [
    {
      id: 'my-tickets',
      name: 'My Tickets',
      filters: {
        assignedTechnician: [CURRENT_USER_EMAIL]
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: now
    },
    {
      id: 'urgent-only',
      name: 'Urgent Only',
      filters: {
        priority: [MaintenancePriority.URGENT]
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: now
    },
    {
      id: 'completed-today',
      name: 'Completed Today',
      filters: {
        status: [MaintenanceStatus.COMPLETED],
        dateRange: {
          from: today,
          to: today
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: now
    },
    {
      id: 'pending-assignment',
      name: 'Pending Assignment',
      filters: {
        status: [MaintenanceStatus.NEW]
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: now
    }
  ]
}

export const useFilterPresets = () => {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [loading, setLoading] = useState(true)

  // Load presets from localStorage on mount
  useEffect(() => {
    const loadPresets = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedPresets = JSON.parse(stored)
          setPresets(parsedPresets)
        } else {
          // Initialize with default presets
          const defaultPresets = createDefaultPresets()
          setPresets(defaultPresets)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPresets))
        }
      } catch (error) {
        console.error('Error loading filter presets:', error)
        // Fallback to default presets
        const defaultPresets = createDefaultPresets()
        setPresets(defaultPresets)
      } finally {
        setLoading(false)
      }
    }

    loadPresets()
  }, [])

  // Save presets to localStorage
  const savePresets = useCallback((newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets))
      setPresets(newPresets)
    } catch (error) {
      console.error('Error saving filter presets:', error)
    }
  }, [])

  // Create a new preset
  const createPreset = useCallback((name: string, filters: MaintenanceFilters) => {
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      isDefault: false,
      createdBy: CURRENT_USER_EMAIL,
      createdAt: new Date().toISOString()
    }

    const updatedPresets = [...presets, newPreset]
    savePresets(updatedPresets)
    return newPreset
  }, [presets, savePresets])

  // Update an existing preset
  const updatePreset = useCallback((id: string, updates: Partial<FilterPreset>) => {
    const updatedPresets = presets.map(preset =>
      preset.id === id ? { ...preset, ...updates } : preset
    )
    savePresets(updatedPresets)
  }, [presets, savePresets])

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(preset => preset.id !== id && !preset.isDefault)
    savePresets(updatedPresets)
  }, [presets, savePresets])

  // Get preset by ID
  const getPresetById = useCallback((id: string) => {
    return presets.find(preset => preset.id === id)
  }, [presets])

  // Reset to default presets
  const resetToDefaults = useCallback(() => {
    const defaultPresets = createDefaultPresets()
    savePresets(defaultPresets)
  }, [savePresets])

  return {
    presets,
    loading,
    createPreset,
    updatePreset,
    deletePreset,
    getPresetById,
    resetToDefaults
  }
}

export default useFilterPresets