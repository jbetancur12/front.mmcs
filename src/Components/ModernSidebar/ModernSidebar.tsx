import React, { useEffect } from 'react'
import {
    Drawer,
    Box,
    useTheme,
    useMediaQuery,
    Divider
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { useSidebarState } from './hooks/useSidebarState'
import { useSidebarPermissions } from './hooks/useSidebarPermissions'
import { useSidebarSearch } from './hooks/useSidebarSearch'
import { sidebarItems } from './config/sidebarItems'
import SidebarHeader from './components/SidebarHeader'
import SidebarSearch from './SidebarSearch'
import SidebarContent from './components/SidebarContent'
import SidebarFooter from './components/SidebarFooter'
import { ModernSidebarItem } from './types/sidebar.types'

interface ModernSidebarProps {
    onItemClick?: (item: ModernSidebarItem) => void
}

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_MINIMIZED = 64

const ModernSidebar: React.FC<ModernSidebarProps> = ({ onItemClick }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const $userStore = useStore(userStore)

    const { state, actions } = useSidebarState()
    const permissions = useSidebarPermissions()

    // Using imported sidebarItems from config

    // Filtrar elementos según permisos usando el hook actualizado
    const filteredItems = React.useMemo(() => {
        return permissions.filterItemsByPermissions(sidebarItems)
    }, [permissions, sidebarItems])

    const { filteredItems: searchFilteredItems } = useSidebarSearch(
        filteredItems,
        state.searchTerm
    )

    // Cerrar sidebar móvil cuando cambie la ruta
    useEffect(() => {
        if (isMobile && state.isMobileOpen) {
            actions.closeMobile()
        }
    }, [window.location.pathname])

    // Manejar click en elemento
    const handleItemClick = (item: ModernSidebarItem) => {
        // Agregar a elementos recientes
        actions.addToRecent(item.id)

        // Limpiar notificación si existe
        if (state.notifications[item.id]) {
            actions.clearNotification(item.id)
        }

        // Cerrar móvil si está abierto
        if (isMobile) {
            actions.closeMobile()
        }

        // Callback externo
        if (onItemClick) {
            onItemClick(item)
        }
    }

    const drawerWidth = state.isMinimized ? DRAWER_WIDTH_MINIMIZED : DRAWER_WIDTH

    // Preparar datos del usuario para el footer
    const userData = {
        name: $userStore.nombre,
        email: $userStore.email,
        rol: Array.isArray($userStore.rol) ? $userStore.rol[0] : $userStore.rol,
        customer: {
            name: $userStore.customer?.nombre
        }
    }

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: state.theme === 'dark' ? 'grey.900' : 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider'
            }}
        >
            {/* Header */}
            <SidebarHeader
                isMinimized={state.isMinimized}
                theme={state.theme}
                onToggleMinimized={actions.toggleMinimized}
                onToggleTheme={actions.toggleTheme}
                isMobile={isMobile}
                onCloseMobile={actions.closeMobile}
            />

            <Divider />

            {/* Search */}
            <SidebarSearch
                items={filteredItems}
                searchTerm={state.searchTerm}
                onSearchChange={actions.setSearchTerm}
                isMinimized={state.isMinimized}
                onItemClick={handleItemClick}
            />

            <Divider />

            {/* Content */}
            <SidebarContent
                items={state.searchTerm ? searchFilteredItems : filteredItems}
                isMinimized={state.isMinimized}
                favorites={state.favorites}
                recentItems={state.recentItems}
                notifications={state.notifications}
                onItemClick={handleItemClick}
                onToggleFavorite={(itemId: string) => {
                    if (state.favorites.includes(itemId)) {
                        actions.removeFromFavorites(itemId)
                    } else {
                        actions.addToFavorites(itemId)
                    }
                }}
            />

            {/* Footer */}
            <SidebarFooter
                isMinimized={state.isMinimized}
                user={userData}
            />
        </Box>
    )

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={state.isMobileOpen}
                onClose={actions.closeMobile}
                ModalProps={{
                    keepMounted: true // Better open performance on mobile
                }}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box'
                    }
                }}
            >
                {drawerContent}
            </Drawer>
        )
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen
                }),
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen
                    }),
                    overflowX: 'hidden'
                }
            }}
        >
            {drawerContent}
        </Drawer>
    )
}

export default ModernSidebar