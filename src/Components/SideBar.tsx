import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AccountTreeOutlined,
  AssignmentTurnedInOutlined,
  BuildOutlined,
  BusinessOutlined,
  Close,
  DashboardOutlined,
  DirectionsCarOutlined,
  Inventory2Outlined,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  MonitorHeartOutlined,
  PeopleAltOutlined,
  ScienceOutlined,
  SearchOutlined,
  SchoolOutlined,
  SettingsOutlined,
  ShoppingCartOutlined,
  SpeedOutlined,
  StorefrontOutlined,
  VerifiedOutlined
} from '@mui/icons-material'

import DropdownButton from './DropdownButton'
import NavItem from './Common/NavItem'
import CommandPalette, {
  CommandEntry,
  CommandSource
} from './Common/CommandPalette'
import { usePostHog } from 'posthog-js/react'
import {
  frequentPaths,
  recentPaths,
  recordVisit
} from 'src/utils/quickSearchUsage'
import { QUICK_SEARCH_PAGES } from 'src/constants/quickSearchPages'
import { useStore } from '@nanostores/react'
import { UserData, userStore } from 'src/store/userStore'
import {
  getEffectiveLmsMenuRoles,
  isLmsOnlyUser,
  LMS_ACCESS_MENU_ROLES
} from 'src/utils/lmsIdentity'
import {
  audienceIncludes,
  isCoreModule,
  getModuleAudience
} from 'src/constants/modules'

import { ROLES, ROLE_GROUPS } from 'src/constants/roles'
import {
  hasPermission,
  PERMISSIONS,
  PermissionKey
} from 'src/constants/permissions'
// Advertir una sola vez por moduleName desconocido (atrapa typos como
// 'Flota' vs 'fleet' que quedarían silenciosamente como core).
const warnedUnknownModules = new Set<string>()

const LMS_SIDEBAR_HINT_DISMISSED_KEY = 'lms-sidebar-hint-dismissed'

// Helper para verificar si un módulo debe ser visible
const canViewModule = (roles: string[], userRole: string[]) => {
  return userRole.some((role) => roles.includes(role))
}

// Los ítems migrados a capacidades llevan `permission` (any-of) en vez de depender de `roles`.
// Se lee con `in` porque los ítems del sidebar son objetos literales de forma distinta.
const getItemPermission = (
  item: object
): PermissionKey | readonly PermissionKey[] | undefined =>
  'permission' in item
    ? (item as { permission: PermissionKey | readonly PermissionKey[] })
        .permission
    : undefined

interface SearchableMenuItem {
  label: string
  url: string
  roles?: string[]
  permission?: PermissionKey | readonly PermissionKey[]
}

const toRoutePath = (path: string) => `/${path.replace(/^\//, '')}`

/** La opción de la búsqueda a la que pertenece la pantalla abierta (detalles incluidos). */
const entryForPath = (pathname: string, entries: CommandEntry[]) =>
  entries
    .filter(
      (entry) =>
        entry.path !== '/' &&
        (pathname === entry.path || pathname.startsWith(`${entry.path}/`))
    )
    .sort((a, b) => b.path.length - a.path.length)[0]

const getLinkToCustomer =(to: string, $userStore: UserData) => {
  if (!$userStore.customer) {
    return '/' // Ruta predeterminada para usuarios sin cliente
  } else {
    return `${to}${$userStore.customer.id}`
  }
}

// Array combinado de items del sidebar (incluyendo dropdowns)
const sidebarItems = ($userStore: UserData) => [
  {
    type: 'link', // Tipo de ítem (enlace simple)
    label: 'Inicio',
    to: '/',
    icon: <DashboardOutlined />,
    roles: ROLE_GROUPS.ADMIN_AND_CLIENT,
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Equipos',
    to: getLinkToCustomer(`customers/`, $userStore),
    icon: <MonitorHeartOutlined />,
    roles: [ROLES.USER],
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Empresas',
    to: '/customers',
    permission: PERMISSIONS.CUSTOMERS_CUSTOMER_MANAGE,
    icon: <BusinessOutlined />,
    roles: ROLE_GROUPS.METROLOGY_STAFF,
    moduleName: 'Basic'
  },

  {
    type: 'dropdown',
    buttonText: 'Compras',
    // Migrado a capacidades: se ve si el usuario puede ver al menos uno de sus ítems
    roles: [] as string[],
    permission: [
      PERMISSIONS.PURCHASES_SUPPLIER_SELECTION_VIEW,
      PERMISSIONS.PURCHASES_SUPPLIER_VIEW,
      PERMISSIONS.PURCHASES_REQUEST_VIEW,
      PERMISSIONS.PURCHASES_ORDER_VIEW,
      PERMISSIONS.PURCHASES_VERIFICATION_VIEW,
      PERMISSIONS.PURCHASES_FISCAL_PARAMETER_MANAGE,
      PERMISSIONS.PURCHASES_EVALUATION_VIEW,
      PERMISSIONS.PURCHASES_STATISTICS_VIEW
    ] as readonly PermissionKey[],
    moduleName: 'Basic',
    icon: <ShoppingCartOutlined />,
    menuItems: [
      {
        label: 'Selección de proveedores',
        url: 'purchases/supplier-selection',
        permission: PERMISSIONS.PURCHASES_SUPPLIER_SELECTION_VIEW
      },
      {
        label: 'Lista de proveedores',
        url: 'purchases/suppliers',
        permission: PERMISSIONS.PURCHASES_SUPPLIER_VIEW
      },
      {
        label: 'Solicitudes de compra',
        url: 'purchases/requests',
        permission: PERMISSIONS.PURCHASES_REQUEST_VIEW
      },
      {
        label: 'Órdenes de compra',
        url: 'purchases/orders',
        permission: PERMISSIONS.PURCHASES_ORDER_VIEW
      },
      {
        label: 'Verificaciones',
        url: 'purchases/verifications',
        permission: PERMISSIONS.PURCHASES_VERIFICATION_VIEW
      },
      {
        label: 'Parámetros fiscales',
        url: 'purchases/fiscal-parameters',
        permission: PERMISSIONS.PURCHASES_FISCAL_PARAMETER_MANAGE
      },
      {
        label: 'Evaluaciones de proveedores',
        url: 'purchases/suppliers/evaluations',
        permission: PERMISSIONS.PURCHASES_EVALUATION_VIEW
      },
      {
        label: 'Estadísticas',
        url: 'purchases/statistics',
        permission: PERMISSIONS.PURCHASES_STATISTICS_VIEW
      }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Academia',
    roles: [...LMS_ACCESS_MENU_ROLES],
    moduleName: 'lms',
    icon: <SchoolOutlined />,
    menuItems: [
      {
        label: 'Panel de Academia',
        url: 'lms',
        permission: PERMISSIONS.LMS_TRAINING_MANAGE
      },
      {
        label: 'Gestión de cursos',
        url: 'lms/admin/courses',
        permission: PERMISSIONS.LMS_COURSE_MANAGE
      },
      {
        label: 'Gestión de usuarios',
        url: 'lms/admin/users',
        permission: PERMISSIONS.LMS_USER_MANAGE
      },
      {
        label: 'Analíticas',
        url: 'lms/admin/analytics',
        permission: PERMISSIONS.LMS_DASHBOARD_VIEW
      },
      {
        label: 'Mis notificaciones',
        url: 'lms/admin/notifications',
        permission: PERMISSIONS.LMS_NOTIFICATION_MANAGE
      },
      {
        label: 'Reportes',
        url: 'lms/admin/reporting',
        permission: PERMISSIONS.LMS_REPORT_MANAGE
      },
      {
        label: 'Asignaciones',
        url: 'lms/admin/assignments',
        permission: PERMISSIONS.LMS_ASSIGNMENT_MANAGE
      },
      {
        label: 'Planes de formación',
        url: 'lms/admin/plans',
        permission: PERMISSIONS.LMS_PLAN_MANAGE
      },
      {
        label: 'Cumplimiento',
        url: 'lms/admin/compliance',
        permission: PERMISSIONS.LMS_NOTIFICATION_MANAGE
      },
      {
        label: 'Plantillas de certificados',
        url: 'lms/admin/certificate-templates',
        permission: PERMISSIONS.LMS_CERTIFICATE_MANAGE
      },
      {
        label: 'Certificados emitidos',
        url: 'lms/admin/certificates',
        permission: PERMISSIONS.LMS_CERTIFICATE_MANAGE
      },
      {
        label: 'Mi aprendizaje',
        url: 'lms/employee',
        roles: [ROLES.EMPLOYEE]
      },
      {
        label: 'Mis certificados',
        url: 'lms/certificates',
        roles: [ROLES.EMPLOYEE, ROLES.USER]
      },
      {
        label: 'Mi aprendizaje',
        url: 'lms/client',
        roles: [ROLES.USER]
      }
    ]
  },
  {
    type: 'link',
    label: 'Biomédicos',
    to: '/profiles',
    icon: <PeopleAltOutlined />,
    roles: ROLE_GROUPS.ADMIN_AND_CLIENT,
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Trazabilidades',
    to: '/trazabilidad',
    icon: <AccountTreeOutlined />,
    roles: ROLE_GROUPS.ADMIN_AND_CLIENT,
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Trabajo no conforme',
    to: '/non-conform-work-reports',
    icon: <VerifiedOutlined />,
    roles: [] as string[],
    permission: PERMISSIONS.NONCONFORM_REPORT_VIEW,
    moduleName: 'Basic'
  },

  {
    type: 'dropdown',
    buttonText: 'Inventario',
    roles: [] as string[],
    permission: PERMISSIONS.CALIBRATION_DATASHEET_VIEW,
    moduleName: 'Basic',
    icon: <Inventory2Outlined />,
    menuItems: [
      {
        label: 'Hoja de vida',
        url: 'datasheets',
        permission: PERMISSIONS.CALIBRATION_DATASHEET_VIEW
      },
      {
        label: 'Hoja de vida TI',
        url: 'asset-life-sheets',
        permission: PERMISSIONS.ASSETS_LIFE_SHEET_MANAGE
      },
      {
        label: 'Alertas',
        url: 'datasheets/alerts',
        permission: PERMISSIONS.CALIBRATION_DATASHEET_VIEW
      }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Laboratorio',
    // Migrado a capacidades: se ve si el usuario puede ver al menos uno de sus ítems
    roles: [] as string[],
    permission: [
      PERMISSIONS.LABORATORY_DEVICE_VIEW,
      PERMISSIONS.LABORATORY_CALIBRATION_VIEW
    ] as readonly PermissionKey[],
    moduleName: 'Basic',
    icon: <ScienceOutlined />,
    menuItems: [
      {
        label: 'Condiciones',
        url: 'laboratory/conditions',
        permission: PERMISSIONS.LABORATORY_DEVICE_VIEW
      }, // Sub-item Condiciones
      {
        label: 'Patrones',
        url: 'laboratory/patterns',
        permission: PERMISSIONS.LABORATORY_CALIBRATION_VIEW
      } // Sub-item Patrones
    ]
  },
  // {
  //   type: 'dropdown',
  //   buttonText: 'Telemetría',
  //   roles: ROLE_GROUPS.ADMIN_AND_CLIENT,
  //   moduleName: 'Iot',
  //   pathData:
  //     'M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7 0-1.66.56-3.19 1.5-4.39l9.89 9.89C15.19 18.44 13.66 19 12 19zm4.5-2.61L6.61 7.5C7.81 6.56 9.34 6 11 6c3.87 0 7 3.13 7 7 0 1.66-.56 3.19-1.5 4.39z',
  //   menuItems: [
  //     { label: 'Lista', url: 'iot', roles: [ROLES.ADMIN] },
  //     { label: 'Map', url: 'iot/map', roles: ROLE_GROUPS.ADMIN_AND_CLIENT },
  //     {
  //       label: 'Gestión de Clientes',
  //       url: 'iot/customers-management',
  //       roles: [ROLES.ADMIN]
  //     }
  //   ]
  // },
  {
    type: 'dropdown',
    buttonText: 'Calibraciones',
    roles: [] as string[],
    permission: [
      PERMISSIONS.CALIBRATION_DEVICE_VIEW,
      PERMISSIONS.CALIBRATION_CERTIFICATE_TYPE_MANAGE,
      PERMISSIONS.CALIBRATION_FILE_CREATE,
      PERMISSIONS.CALIBRATION_TEMPLATE_VIEW
    ] as readonly PermissionKey[],
    moduleName: 'Basic',
    icon: <SpeedOutlined />,
    menuItems: [
      {
        label: 'Equipos',
        url: 'calibraciones/equipos',
        permission: PERMISSIONS.CALIBRATION_DEVICE_VIEW
      },
      {
        label: 'Tipos de certificado',
        url: 'calibraciones/tipos-de-certificado',
        permission: PERMISSIONS.CALIBRATION_CERTIFICATE_TYPE_MANAGE
      },
      {
        label: 'Certificados',
        url: 'calibraciones/certificados',
        roles: [ROLES.ADMIN, ROLES.USER, ROLES.METROLOGIST]
      },
      {
        label: 'Subir Excel',
        url: 'calibraciones/subir-excel',
        permission: PERMISSIONS.CALIBRATION_FILE_CREATE
      },
      {
        label: 'Plantillas',
        url: 'calibraciones/templates',
        permission: PERMISSIONS.CALIBRATION_TEMPLATE_VIEW
      }
    ]
  },
  {
    type: 'link',
    label: 'Servicios de calibración',
    to: '/calibration-services',
    icon: <AssignmentTurnedInOutlined />,
    roles: [] as string[],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Venta de equipos',
    to: '/equipment-sales',
    icon: <StorefrontOutlined />,
    roles: [] as string[],
    permission: PERMISSIONS.SALES_QUOTATION_VIEW,
    moduleName: 'Basic'
  },
  {
    type: 'link',
    label: 'Flota',
    to: '/fleet',
    icon: <DirectionsCarOutlined />,
    roles: [] as string[],
    permission: PERMISSIONS.FLEET_VEHICLE_VIEW,
    moduleName: 'Fleet'
  },
  {
    type: 'dropdown',
    buttonText: 'Mantenimiento',
    // Migrado a capacidades: se ve si el usuario puede ver al menos uno de sus ítems
    roles: [] as string[],
    permission: [
      PERMISSIONS.MAINTENANCE_TICKET_VIEW,
      PERMISSIONS.MAINTENANCE_TECHNICIAN_LIST,
      PERMISSIONS.MAINTENANCE_PROTOCOL_MANAGE,
      PERMISSIONS.MAINTENANCE_INVOICING_VIEW
    ] as readonly PermissionKey[],
    moduleName: 'Basic',
    icon: <BuildOutlined />,
    menuItems: [
      {
        label: 'Panel de mantenimiento',
        url: 'maintenance',
        permission: PERMISSIONS.MAINTENANCE_TICKET_VIEW
      },
      {
        label: 'Técnicos',
        url: 'maintenance/technicians',
        permission: PERMISSIONS.MAINTENANCE_TECHNICIAN_LIST
      },
      {
        label: 'Protocolos',
        url: 'maintenance/protocols',
        permission: PERMISSIONS.MAINTENANCE_PROTOCOL_MANAGE
      },
      {
        label: 'Facturación',
        url: 'maintenance/billing',
        permission: PERMISSIONS.MAINTENANCE_INVOICING_VIEW
      }
    ]
  },
  {
    type: 'dropdown',
    buttonText: 'Ajustes',
    // Se ve si el usuario puede abrir al menos una de sus opciones
    roles: [] as string[],
    permission: [
      PERMISSIONS.USERS_USER_LIST,
      PERMISSIONS.RBAC_VIEW,
      PERMISSIONS.CUSTOMERS_MODULE_CATALOG_VIEW
    ] as PermissionKey[],
    moduleName: 'Basic',
    icon: <SettingsOutlined />,
    menuItems: [
      {
        label: 'Usuarios',
        url: 'settings',
        permission: PERMISSIONS.USERS_USER_LIST
      },
      {
        label: 'Roles y permisos',
        url: 'settings/roles',
        permission: PERMISSIONS.RBAC_VIEW
      },
      {
        label: 'Módulos',
        url: 'modules',
        permission: PERMISSIONS.CUSTOMERS_MODULE_CATALOG_VIEW
      }
    ]
  }
  // Otros ítems...
]

// Secciones del menú, en orden. Cada entrada es el `label` o `buttonText`
// del ítem. Una sección sin ítems visibles para el usuario no se muestra.
const SIDEBAR_SECTIONS: {
  title?: string
  /** Título para usuarios de cliente, cuando el interno no tiene sentido */
  clientTitle?: string
  items: string[]
}[] = [
  { items: ['Inicio', 'Equipos'] },
  {
    title: 'Metrología',
    items: [
      'Empresas',
      'Calibraciones',
      'Servicios de calibración',
      'Laboratorio',
      'Inventario',
      'Trazabilidades',
      'Biomédicos'
    ]
  },
  {
    title: 'Operación',
    items: ['Mantenimiento', 'Venta de equipos', 'Compras', 'Flota']
  },
  {
    title: 'Calidad y personas',
    clientTitle: 'Capacitación',
    items: ['Trabajo no conforme', 'Academia']
  },
  { title: 'Administración', items: ['Ajustes'] }
]

const itemKey = (item: { label?: string; buttonText?: string }) =>
  item.label ?? item.buttonText ?? ''

const sidebarSections = (
  $userStore: UserData,
  renderItem: (
    item: ReturnType<typeof sidebarItems>[number],
    key: string
  ) => JSX.Element | null,
  minimized: boolean
) => {
  const items = sidebarItems($userStore)
  const placed = new Set(SIDEBAR_SECTIONS.flatMap((section) => section.items))
  // Un ítem nuevo que nadie ubicó aparece al final en vez de perderse.
  const layout = [
    ...SIDEBAR_SECTIONS,
    { items: items.map(itemKey).filter((key) => !placed.has(key)) }
  ]

  return layout.map((section, index) => {
    const rows = section.items
      .flatMap((name) => items.filter((item) => itemKey(item) === name))
      .map((item) => renderItem(item, itemKey(item)))
      .filter(Boolean)

    if (rows.length === 0) return null

    const headingId = `sidebar-section-${index}`
    const title =
      'clientTitle' in section && $userStore.customer
        ? section.clientTitle
        : section.title
    return (
      <div key={headingId} className={index === 0 ? '' : 'mt-4'}>
        {title &&
          (minimized ? (
            <div
              role='separator'
              aria-label={title}
              className='mx-auto mb-2 h-px w-8 bg-gray-200'
            />
          ) : (
            <p
              id={headingId}
              className='mb-1 px-3 text-xs font-semibold text-gray-500'
            >
              {title}
            </p>
          ))}
        <ul
          className='space-y-0.5'
          aria-labelledby={title && !minimized ? headingId : undefined}
        >
          {rows}
        </ul>
      </div>
    )
  })
}

const isLmsSidebarItem = (item: ReturnType<typeof sidebarItems>[number]) => {
  if (item.type === 'link') {
    return item.to?.startsWith('/lms') || item.to?.startsWith('lms')
  }

  return item.buttonText === 'Academia' || item.buttonText === 'LMS'
}

interface SideBarProps {
  sidebarMinimized: boolean
  userMinimized: boolean
  setUserMinimized: (min: boolean) => void
  setHovered: (hover: boolean) => void
  hoverEnabled: boolean
  setHoverEnabled: (enabled: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const SideBar = ({
  sidebarMinimized,
  userMinimized,
  setUserMinimized,
  setHovered,
  hoverEnabled,
  mobileMenuOpen,
  setMobileMenuOpen
}: SideBarProps) => {
  const $userStore = useStore(userStore)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [searchOpen, setSearchOpen] = useState(false)
  const userKey = $userStore.email || 'anonimo'
  const openSearch = (source: 'shortcut' | 'button') => {
    posthog?.capture('quick_search_opened', { source })
    setSearchOpen(true)
  }
  const openSearchRef = useRef(openSearch)
  openSearchRef.current = openSearch
  // Ctrl+K (Cmd+K en Mac) abre la búsqueda desde cualquier pantalla.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSearchRef.current('shortcut')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const effectiveLmsMenuRoles = getEffectiveLmsMenuRoles($userStore)
  const [isLmsHintDismissed, setIsLmsHintDismissed] = useState(true)
  const isLmsRoute = pathname.startsWith('/lms')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      setIsLmsHintDismissed(
        window.localStorage.getItem(LMS_SIDEBAR_HINT_DISMISSED_KEY) === 'true'
      )
    } catch {
      setIsLmsHintDismissed(false)
    }
  }, [])

  const dismissLmsHint = () => {
    setIsLmsHintDismissed(true)

    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(LMS_SIDEBAR_HINT_DISMISSED_KEY, 'true')
    } catch {
      // Ignore localStorage failures and keep the hint dismissed for this session.
    }
  }

  const hasModuleAccess = (moduleName: string) => {
    // Core (Basic / sin módulo): visible para todos, sin gate.
    if (isCoreModule(moduleName)) return true

    const userType = $userStore.customer ? 'client' : 'internal'
    if (!getModuleAudience(moduleName)) {
      if (!warnedUnknownModules.has(moduleName)) {
        warnedUnknownModules.add(moduleName)
        console.warn(
          `[sidebar] moduleName "${moduleName}" no está en el catálogo de módulos — se trata como core. ¿Typo?`
        )
      }
      return true
    }

    // Audiencia: módulos internal/client/both vs tipo de usuario.
    // Interno = sin customer; cliente = con customer.
    if (!audienceIncludes(moduleName, userType)) return false

    // Licensing: solo aplica a usuarios de cliente
    if (!$userStore.customer) return true
    return $userStore.customer.modules.some(
      (m) => m.name === moduleName && m.customerModules.isActive
    )
  }

  const handleLinkClick = () => {
    // Cerrar el menú móvil cuando se hace clic en un enlace
    setMobileMenuOpen(false)
  }

  // Minimizado, se abre al dejar el mouse encima un momento (no al cruzarlo).
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  const handleMouseEnter = () => {
    if (!hoverEnabled || !userMinimized) return
    hoverTimer.current = setTimeout(() => setHovered(true), 250)
  }
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current)
    setHovered(false)
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  // En el panel móvil siempre se ven los nombres.
  const minimized = sidebarMinimized && !mobileMenuOpen

  const isLinkActive = (to: string) =>
    pathname === to || (to !== '/' && pathname.startsWith(`${to}/`))

  type SidebarItem = ReturnType<typeof sidebarItems>[number]

  const rolesFor = (item: SidebarItem) =>
    item.buttonText === 'Academia' || item.buttonText === 'LMS'
      ? effectiveLmsMenuRoles
      : $userStore.rol

  // El usuario puede ver el ítem del menú (rol/capacidad, módulo y LMS).
  const canSeeItem = (item: SidebarItem) => {
    if (
      isLmsOnlyUser($userStore.rol, $userStore.lmsOnly) &&
      !isLmsSidebarItem(item)
    ) {
      return false
    }

    const permission = getItemPermission(item)
    const allowed = permission
      ? hasPermission(
          $userStore.permissions,
          permission as PermissionKey | readonly PermissionKey[]
        )
      : canViewModule(item.roles, rolesFor(item))

    return allowed && hasModuleAccess(item.moduleName)
  }

  // Pantallas que el usuario puede abrir, para el buscador (Ctrl+K).
  const searchEntries = (): CommandEntry[] => {
    const items = sidebarItems($userStore)
    const sectionOf = (item: SidebarItem) =>
      SIDEBAR_SECTIONS.find((section) => section.items.includes(itemKey(item)))
    const sectionTitle = (item: SidebarItem) => {
      const section = sectionOf(item)
      return section?.title && $userStore.customer && section.clientTitle
        ? section.clientTitle
        : section?.title
    }

    const fromMenu = items.filter(canSeeItem).flatMap((item): CommandEntry[] => {
      if (item.type === 'link' && item.to) {
        const path = toRoutePath(item.to)
        return [
          {
            id: path,
            label: item.label ?? '',
            path,
            hint: sectionTitle(item),
            icon: item.icon
          }
        ]
      }

      const roles = rolesFor(item)
      return (item.menuItems ?? [])
        .filter((menuItem: SearchableMenuItem) =>
          menuItem.permission
            ? hasPermission($userStore.permissions, menuItem.permission)
            : (menuItem.roles ?? []).some((role) => roles.includes(role))
        )
        .map((menuItem: SearchableMenuItem) => ({
          id: toRoutePath(menuItem.url),
          label: menuItem.label,
          path: toRoutePath(menuItem.url),
          parents: [item.buttonText ?? ''],
          hint: sectionTitle(item),
          icon: item.icon
        }))
    })

    // Pantallas con ruta pero sin ítem de menú (ver quickSearchPages).
    const known = new Set(fromMenu.map((entry) => entry.id))
    const lmsOnly = isLmsOnlyUser($userStore.rol, $userStore.lmsOnly)
    const extras = lmsOnly
      ? []
      : QUICK_SEARCH_PAGES.filter(
          (page) =>
            !known.has(page.path) &&
            hasPermission($userStore.permissions, page.permission) &&
            hasModuleAccess(page.moduleName ?? 'Basic')
        ).map((page): CommandEntry => {
          const owner = items.find((item) => itemKey(item) === page.parents[0])
          return {
            id: page.path,
            label: page.label,
            path: page.path,
            parents: page.parents,
            hint: owner ? sectionTitle(owner) : undefined,
            keywords: page.keywords,
            icon: owner?.icon
          }
        })

    return [...fromMenu, ...extras]
  }

  // Devuelve la fila del ítem o null si el usuario no debe verlo.
  const renderItem = (item: SidebarItem, key: string) => {
    if (!canSeeItem(item)) return null

    const roles = rolesFor(item)

    if (item.type === 'link' && item.to) {
      return (
        <li key={key}>
          <NavItem
            label={item.label ?? ''}
            icon={item.icon}
            to={item.to}
            active={isLinkActive(item.to)}
            minimized={minimized}
            onClick={handleLinkClick}
          />
        </li>
      )
    }

    if (item.type === 'dropdown') {
      return (
        <DropdownButton
          key={key}
          buttonText={item.buttonText ?? ''}
          menuItems={item.menuItems ?? []}
          icon={item.icon}
          rol={roles}
          permissions={$userStore.permissions}
          currentPath={pathname}
          onlyIcons={minimized}
          onItemClick={handleLinkClick}
        />
      )
    }

    return null
  }

  // Cada pantalla que se abre (por menú, buscador o enlace) cuenta como una visita.
  const trackedPath = useRef('')
  // Va antes que el efecto de abajo: al cambiar de ruta, la marca se reinicia
  // (si no, volver a una pantalla después de pasar por Inicio no contaría).
  useEffect(() => {
    trackedPath.current = ''
  }, [pathname])
  useEffect(() => {
    if (trackedPath.current === pathname) return
    const entry = entryForPath(pathname, searchEntries())
    if (!entry) return
    trackedPath.current = pathname
    recordVisit(userKey, entry.id)
  }, [pathname, userKey, $userStore.permissions])

  // Sugerencias para el buscador sin texto: solo se calculan con el diálogo abierto.
  const searchEntriesNow = searchOpen ? searchEntries() : []
  const currentId = entryForPath(pathname, searchEntriesNow)?.id
  const frequentIds = searchOpen
    ? frequentPaths(userKey, 4, currentId ? [currentId] : [])
    : []
  const recentIds = searchOpen
    ? recentPaths(userKey, 5, currentId ? [currentId] : [])
    : []

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-0 left-0 z-30 flex flex-col flex-shrink-0 h-full pt-[calc(4rem+var(--imp-h,0px))] bg-white border-r border-gray-200 transition-[width,transform] duration-200 ease-out motion-reduce:transition-none ${
        mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      } lg:z-20 lg:translate-x-0 ${sidebarMinimized ? 'lg:w-20' : 'lg:w-64'} ${
        userMinimized && !sidebarMinimized ? 'lg:shadow-xl' : 'lg:shadow-none'
      } w-64`}
    >
      <div className='flex-shrink-0 px-3 pt-4'>
        <button
          type='button'
          onClick={() => openSearch('button')}
          aria-label='Búsqueda rápida'
          aria-keyshortcuts='Control+K'
          title='Búsqueda rápida (Ctrl K)'
          className={`flex w-full items-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:border-[#00BFA5] hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00BFA5] ${
            minimized ? 'justify-center py-2.5' : 'gap-2 px-3 py-2'
          }`}
        >
          <SearchOutlined sx={{ fontSize: 20 }} />
          {!minimized && (
            <>
              <span className='flex-1 text-left'>Búsqueda rápida</span>
              <kbd className='hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 lg:block'>
                Ctrl K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav
        aria-label='Menú principal'
        className='flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent'
      >
        {sidebarSections($userStore, renderItem, minimized)}
      </nav>

      {/* En móvil no hay nada que minimizar: el pie solo existe en escritorio. */}
      <div className='hidden lg:block flex-shrink-0 border-t border-gray-200 px-3 py-2'>
        {isLmsRoute && !minimized && !isLmsHintDismissed && (
          <div className='mb-3 flex items-start gap-2 rounded-lg bg-[#e0f7f4] p-3'>
            <p className='flex-1 text-xs leading-5 text-[#00695c]'>
              <span className='block font-semibold'>
                Gana espacio en Academia
              </span>
              Minimiza el menú con el botón de abajo mientras trabajas en los
              cursos.
            </p>
            <button
              type='button'
              onClick={dismissLmsHint}
              className='rounded p-0.5 text-[#00695c] hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00695c]'
              aria-label='Cerrar sugerencia'
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>
        )}
        <NavItem
          label={
            minimized
              ? 'Expandir menú'
              : userMinimized
                ? 'Mantener abierto'
                : 'Minimizar menú'
          }
          icon={
            userMinimized ? (
              <KeyboardDoubleArrowRight />
            ) : (
              <KeyboardDoubleArrowLeft />
            )
          }
          minimized={minimized}
          onClick={() => {
            clearTimeout(hoverTimer.current)
            setHovered(false)
            setUserMinimized(!userMinimized)
          }}
        />
      </div>
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        entries={searchEntriesNow}
        frequentIds={frequentIds}
        recentIds={recentIds}
        onSelect={(entry, source: CommandSource) => {
          posthog?.capture('quick_search_selected', {
            path: entry.path,
            source
          })
          handleLinkClick()
          navigate(entry.path)
        }}
      />
    </aside>
  )
}

export default SideBar
