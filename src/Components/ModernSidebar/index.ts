// Exportaciones principales
export { default as ModernSidebar } from './ModernSidebar'
export { default as SidebarSearch } from './SidebarSearch'

// Componentes
export { default as SidebarHeader } from './components/SidebarHeader'
export { default as SidebarContent } from './components/SidebarContent'
export { default as SidebarMenuItem } from './components/SidebarMenuItem'
export { default as SidebarFooter } from './components/SidebarFooter'

// Hooks
export { useSidebarState } from './hooks/useSidebarState'
export { useSidebarPermissions } from './hooks/useSidebarPermissions'
export { useSidebarSearch } from './hooks/useSidebarSearch'

// Tipos
export type {
  ModernSidebarItem,
  SidebarState,
  SidebarPermissions,
  SidebarSearchResult,
  SidebarTheme
} from './types/sidebar.types'

// Configuración
export { createSidebarItems, sidebarItems } from './config/sidebarItems'
export { sidebarIcons, getIcon } from './config/icons'
export type { IconName } from './config/icons'