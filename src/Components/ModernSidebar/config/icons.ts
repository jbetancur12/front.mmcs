// Mapeo de iconos Material-UI para el sidebar
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  RequestQuote as QuoteIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  DirectionsCar as FleetIcon,
  Sensors as IoTIcon,
  ShoppingCart as PurchasesIcon,
  Store as SuppliersIcon,
  People as UsersIcon,
  Apps as ModulesIcon,
  LocationCity as HeadquartersIcon,
  AccountBox as ProfilesIcon,
  Settings as SettingsIcon,
  Folder as RepositoryIcon,
  Description as TemplatesIcon,
  Assignment as CertificateTypesIcon,
  Biotech as BiotechIcon,
  Engineering as EngineeringIcon,
  Science as ScienceIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocalHospital as HospitalIcon,
  Healing as HealingIcon

} from '@mui/icons-material'

export const sidebarIcons = {
  // Iconos principales
  dashboard: DashboardIcon,
  business: BusinessIcon,
  customers: BusinessIcon,
  quotes: QuoteIcon,
  biomedicos: PersonIcon,
  traceability: TimelineIcon,
  certificates: AssignmentIcon,
  datasheets: BuildIcon,
  maintenance: BuildIcon,
  fleet: FleetIcon,
  iot: IoTIcon,
  purchases: PurchasesIcon,
  suppliers: SuppliersIcon,
  users: UsersIcon,
  modules: ModulesIcon,
  headquarters: HeadquartersIcon,
  profiles: ProfilesIcon,
  settings: SettingsIcon,
  repository: RepositoryIcon,
  templates: TemplatesIcon,
  certificateTypes: CertificateTypesIcon,
  
  // Iconos específicos de biomédicos
  biotech: BiotechIcon,
  engineering: EngineeringIcon,
  science: ScienceIcon,
  hospital: HospitalIcon,
  healing: HealingIcon,
  
  // Iconos de utilidad
  inventory: InventoryIcon,
  analytics: AnalyticsIcon,
  security: SecurityIcon,
  upload: UploadIcon,
  download: DownloadIcon,
  refresh: RefreshIcon,
  notifications: NotificationsIcon,
  star: StarIcon,
  search: SearchIcon,
  menu: MenuIcon,
  close: CloseIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  expandMore: ExpandMoreIcon,
  expandLess: ExpandLessIcon,
  home: HomeIcon,
  work: WorkIcon,
  school: SchoolIcon
}

export type IconName = keyof typeof sidebarIcons

export const getIcon = (iconName: IconName) => {
  return sidebarIcons[iconName] || sidebarIcons.dashboard
}