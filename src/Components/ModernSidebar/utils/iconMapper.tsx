import React from 'react'
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Inventory as InventoryIcon,
  DirectionsCar as FleetIcon,
  Build as MaintenanceIcon,
  Star as StarIcon,
  BarChart as BarChartIcon,
  Assignment as CalibrationIcon,
  Microwave as MicrowaveIcon
} from '@mui/icons-material'

// Mapeo de iconos SVG path a componentes Material-UI
export const iconPathToComponent: Record<string, React.ComponentType> = {
  // Dashboard
  'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z': DashboardIcon,
  
  // Business/Company
  'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z': BusinessIcon,
  
  // Shopping Cart
  'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-2h7.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.26-.25z': ShoppingCartIcon,
  
  // Settings
  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z': MaintenanceIcon,
  
  // Star (Quality)
  'M12 2l2.9 6.9 7.1.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.8 7.1-.6z': StarIcon,
  
  // Inventory/Clipboard
  'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H8v-2h6v2zm3-4H8v-2h8v2zm0-4H8V7h8v2z': InventoryIcon,
  
  // Laboratory
  'M19 19V8.83l-6-6-6 6V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zm-7-7h2v5h-2z': ScienceIcon,
  
  // Calibration/Check
  'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 13.17l6.59-6.59L20 8l-8 8z': CalibrationIcon,
  
  // Quotations/Document
  'M18 1H6a3 3 0 0 0-3 3v18a1 1 0 0 0 1.707.707l2.138-2.137 1.323 1.984A1 1 0 0 0 8.9 23a.986.986 0 0 0 .806-.288L12 20.414l2.293 2.293a1 1 0 0 0 1.539-.153l1.323-1.984 2.138 2.137A1 1 0 0 0 21 22V4a3 3 0 0 0-3-3Zm1 18.586-1.293-1.293a.984.984 0 0 0-.806-.288 1 1 0 0 0-.733.44l-1.323 1.985-2.138-2.137a1 1 0 0 0-1.414 0L9.155 20.43l-1.323-1.985a1 1 0 0 0-1.539-.152L5 19.586V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1ZM13 11a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1Zm4-4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0 4a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Zm0-9a1 1 0 0 1-1 1H8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Z': AssignmentIcon
}

// Función para obtener el icono basado en el pathData
export const getIconFromPath = (pathData?: string): React.ComponentType => {
  if (!pathData) return BusinessIcon // Icono por defecto
  
  return iconPathToComponent[pathData] || BusinessIcon
}

// Mapeo de nombres de módulos a iconos
export const moduleIconMap: Record<string, React.ComponentType> = {
  'Dashboard': DashboardIcon,
  'Empresas': BusinessIcon,
  'Equipos': MicrowaveIcon,
  'Cotizaciones': AssignmentIcon,
  'Compras': ShoppingCartIcon,
  'LMS': SchoolIcon,
  'Biomedicos': PeopleIcon,
  'Trazabilidades': AssessmentIcon,
  'Calidad': StarIcon,
  'Inventario': InventoryIcon,
  'Laboratorio': ScienceIcon,
  'Telemetría': BarChartIcon,
  'Calibraciones': CalibrationIcon,
  'Flota': FleetIcon,
  'Mantenimiento': MaintenanceIcon,
  'Ajustes': SettingsIcon
}

// Función para obtener icono por nombre de módulo
export const getIconByModuleName = (moduleName: string): React.ComponentType => {
  return moduleIconMap[moduleName] || BusinessIcon
}