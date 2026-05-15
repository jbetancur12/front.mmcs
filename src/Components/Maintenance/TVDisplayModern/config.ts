import { ModernColors, DisplayConfig } from './types'

/**
 * Default configuration for the Modern TV Display
 * Can be customized for different environments or branding needs
 */

export const DEFAULT_MODERN_COLORS: ModernColors = {
  primary: '#7bff7f',
  primaryLight: '#a3ff9f',
  primaryDark: '#5ed65a',
  background: '#ffffff',
  cardBackground: '#ffffff',
  secondaryBackground: '#f8f9fa',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  border: '#e9ecef',
  borderLight: '#f1f3f4'
}

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  autoRefresh: true,
  slideInterval: 30, // seconds
  showAnimations: true,
  compactView: false,
  primaryColor: '#7bff7f'
}

/**
 * Company branding configuration
 */
export const COMPANY_CONFIG = {
  name: 'MetroMedics',
  displayName: 'Centro de Mantenimiento',
  showLogo: true,
  logoSize: '2rem'
}

/**
 * TV Display specific configuration
 */
export const TV_DISPLAY_CONFIG = {
  // Optimal settings for 1920x1080 displays
  containerMaxWidth: false, // Use full width
  headerHeight: '80px',
  metricCardHeight: '140px',
  ticketCardHeight: '180px',
  criticalTicketHeight: '200px',
  
  // Grid configuration
  metricsColumns: 5, // 2.4 each for 5 columns
  criticalTicketsColumns: 2, // 6 each for 2 columns
  regularTicketsColumns: 4, // 3 each for 4 columns
  
  // Spacing (based on 8px system)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  // Typography scales for TV viewing
  typography: {
    display: '3rem',
    headline: '2.25rem',
    title: '1.75rem',
    bodyLarge: '1.125rem',
    body: '1rem',
    small: '0.875rem'
  },
  
  // Animation settings
  animations: {
    slideTransitionDuration: 800, // ms
    hoverTransitionDuration: 200, // ms
    enableStaggeredAnimations: true,
    staggerDelay: 100 // ms between elements
  }
}

/**
 * Performance optimization settings
 */
export const PERFORMANCE_CONFIG = {
  enableVirtualization: false, // For future implementation
  maxTicketsPerPage: 12,
  debounceDelay: 300, // ms
  enableMemoization: true,
  lazyLoadImages: true
}

/**
 * Accessibility configuration
 */
export const ACCESSIBILITY_CONFIG = {
  minContrastRatio: 4.5, // WCAG AA standard
  enableHighContrastMode: false,
  enableReducedMotion: false, // Respect user preferences
  focusVisibleOutlineWidth: '2px',
  focusVisibleOutlineColor: '#007bff'
}

/**
 * Create custom configuration by merging with defaults
 */
export const createCustomConfig = (overrides: Partial<{
  colors: Partial<ModernColors>
  display: Partial<DisplayConfig>
  company: Partial<typeof COMPANY_CONFIG>
  tv: Partial<typeof TV_DISPLAY_CONFIG>
  performance: Partial<typeof PERFORMANCE_CONFIG>
  accessibility: Partial<typeof ACCESSIBILITY_CONFIG>
}>) => {
  return {
    colors: { ...DEFAULT_MODERN_COLORS, ...overrides.colors },
    display: { ...DEFAULT_DISPLAY_CONFIG, ...overrides.display },
    company: { ...COMPANY_CONFIG, ...overrides.company },
    tv: { ...TV_DISPLAY_CONFIG, ...overrides.tv },
    performance: { ...PERFORMANCE_CONFIG, ...overrides.performance },
    accessibility: { ...ACCESSIBILITY_CONFIG, ...overrides.accessibility }
  }
}