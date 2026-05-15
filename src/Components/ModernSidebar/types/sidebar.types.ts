import { ReactNode, ComponentType } from 'react'

export interface SidebarBadge {
  count: number
  color: 'error' | 'warning' | 'success' | 'info'
  pulse?: boolean
}

export interface ModernSidebarItem {
  id: string
  type: 'link' | 'dropdown' | 'divider'
  label: string
  icon?: ReactNode | ComponentType<{ sx?: any }>
  to?: string
  roles: string[]
  moduleName: string
  badge?: SidebarBadge
  children?: ModernSidebarItem[]
  isFavorite?: boolean
  isNew?: boolean
  pathData?: string // Para compatibilidad con iconos SVG existentes
}

export interface SidebarState {
  isMinimized: boolean
  isMobileOpen: boolean
  searchTerm: string
  favorites: string[]
  recentItems: string[]
  theme: 'light' | 'dark'
  notifications: Record<string, number>
}

export interface SidebarProps {
  sidebarMinimized: boolean
  userMinimized: boolean
  setUserMinimized: (min: boolean) => void
  setHovered?: (hover: boolean) => void
  hoverEnabled?: boolean
  setHoverEnabled?: (enabled: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export interface SidebarItemProps {
  item: ModernSidebarItem
  isActive: boolean
  isMinimized: boolean
  onItemClick?: () => void
  userRoles: string[]
}

export interface SidebarDropdownProps {
  item: ModernSidebarItem
  isActive: boolean
  isMinimized: boolean
  onItemClick?: () => void
  userRoles: string[]
  currentPath: string
}

export interface SidebarSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  isMinimized: boolean
}

export interface SidebarFooterProps {
  isMinimized: boolean
  onToggleMinimized: () => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

// Tipos para compatibilidad con el sistema existente
export interface LegacySidebarItem {
  type: 'link' | 'dropdown'
  label: string
  to?: string
  icon?: ReactNode
  roles: string[]
  moduleName: string
  buttonText?: string
  pathData?: string
  menuItems?: Array<{
    label: string
    url: string
    roles: string[]
  }>
}

// Interfaces adicionales para hooks
export interface SidebarPermissions {
  canViewModule: (moduleName: string, userRoles: string[]) => boolean
  hasModuleAccess: (moduleName: string, customerModules: any[]) => boolean
}

export interface SidebarSearchResult {
  item: ModernSidebarItem
  matchType: 'exact' | 'partial'
  highlightedLabel: string
}

// Utilidades de tipo
export type SidebarTheme = 'light' | 'dark'
export type SidebarItemType = 'link' | 'dropdown' | 'divider'
export type BadgeColor = 'error' | 'warning' | 'success' | 'info'