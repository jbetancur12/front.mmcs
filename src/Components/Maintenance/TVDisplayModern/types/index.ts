export interface TVMetrics {
  totalTickets: number
  pendingTickets: number
  assignedTickets: number
  inProgressTickets: number
  pendingTechnicalReport: number
  completedTickets: number
  urgentTickets: number
  overdueTickets: number
  techniciansAvailable: string
  averageWorkload: number
  avgResolutionTimeHours: number
  completedLast30Days: number
  isInvoiced: number
}

export interface DisplayConfig {
  autoRefresh: boolean
  slideInterval: number
  showAnimations: boolean
  compactView: boolean
  primaryColor: string
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting'
  lastUpdate: Date
  latency?: number
  retryCount?: number
  usingPollingFallback?: boolean
}

export interface SmartPagination {
  isActive: boolean
  isPaused: boolean
  baseSpeed: number
  urgentSpeed: number
  currentSpeed: number
  smoothTransitions: boolean
  stickyUrgents: boolean
}

export interface OrganizedTickets {
  stickyUrgents: any[]
  paginatedTickets: any[]
  allActive: any[]
  urgent: any[]
  high: any[]
  normal: any[]
  totalUrgentPages?: number
  currentUrgentPage?: number
}

export interface ModernColors {
  primary: string
  primaryLight: string
  primaryDark: string
  background: string
  cardBackground: string
  secondaryBackground: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
  danger: string
  info: string
  border: string
  borderLight: string
}

export interface ModernHeaderProps {
  currentTime: Date
  connectionStatus: ConnectionStatus
  companyName?: string
  showLogo?: boolean
}

export interface MetricsDashboardProps {
  metrics: TVMetrics
  colors: ModernColors
}

export interface CriticalTicketsSectionProps {
  urgentTickets: any[]
  colors: ModernColors
  getElapsedTime: (createdAt: string) => string
  totalUrgentTickets?: number
  currentPage?: number
  totalPages?: number
}

export interface RegularTicketsGridProps {
  tickets: any[]
  gridCalculation: any
  colors: ModernColors
  getElapsedTime: (createdAt: string) => string
  displayColumns?: number
  centerSparsePage?: boolean
  sparseCardHeight?: number
}

export interface PaginationProgressProps {
  slideIndex: number
  totalTickets: number
  ticketsPerPage: number
  colors: ModernColors
}
