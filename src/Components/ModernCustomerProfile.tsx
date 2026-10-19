import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Container,
  Alert
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import useAxiosPrivate from '@utils/use-axios-private'

import { CreateFileModal } from './TableFiles/CreateFileModal/CreateFileModal'

import { bigToast } from './ExcelManipulation/Utils'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import {
  DEFAULT_AVATAR,
  minioUrl,
  STATUS_FILTERS,
  VALID_TABS
} from './customer-profile/constants'
import CustomerProfileBanner from './customer-profile/CustomerProfileBanner'
import CustomerProfileTabs from './customer-profile/CustomerProfileTabs'
import {
  HeadquartersTab,
  ModulesTab,
  ScheduleTab,
  UsersTab
} from './customer-profile/CustomerSectionTabs'
import CustomerStatsCards from './customer-profile/CustomerStatsCards'
import EquipmentFilters from './customer-profile/EquipmentFilters'
import EquipmentList from './customer-profile/EquipmentList'
import {
  exportOverviewReport,
  exportToExcel,
  getMatchedFields
} from './customer-profile/exportUtils'
import LmsCoursesTab from './customer-profile/LmsCoursesTab'
import OverviewTab from './customer-profile/OverviewTab'
import {
  DownloadFilter,
  StatusFilter,
  TabValue
} from './customer-profile/types'
import { useCustomerProfileActions } from './customer-profile/useCustomerProfileActions'
import {
  useCustomerCertificates,
  useCustomerData,
  useCustomerLmsCourses,
  useFetchAllCertificates
} from './customer-profile/useCustomerProfileData'

export type { Certificate } from './customer-profile/types'

// Modern Customer Profile Component
const ModernCustomerProfile: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  // Cada elemento se muestra según la capacidad que el backend le pide a su endpoint
  const canManageLmsCourses = useCan(PERMISSIONS.CUSTOMERS_LMS_COURSE_MANAGE)
  const canManageCustomer = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_MANAGE)
  const canUpdateCustomer = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_UPDATE)
  const canChangeAvatar = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_AVATAR)
  const canViewModules = useCan(PERMISSIONS.CUSTOMERS_MODULE_VIEW)
  const canListCustomerUsers = useCan(PERMISSIONS.CUSTOMERS_USER_LIST)
  const canCreateFile = useCan(PERMISSIONS.CALIBRATION_FILE_CREATE)

  // State
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const tabParam = searchParams.get('tab')
    return VALID_TABS.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : 'equipment'
  })

  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(() => {
    const param = searchParams.get('status')
    return STATUS_FILTERS.includes(param as StatusFilter)
      ? (param as StatusFilter)
      : null
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [image, setImage] = useState(DEFAULT_AVATAR)
  const [selectedSede, setSelectedSede] = useState<string | null>('')
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLmsCourseId, setSelectedLmsCourseId] = useState('')

  // Data
  const { data: customerData, isLoading: loadingCustomer } = useCustomerData(
    id,
    (data) => {
      if (data.avatar) {
        setImage(`${minioUrl}/images/${data.avatar}`)
      }
    }
  )

  const preSelectedCustomerData = React.useMemo(() => {
    if (!customerData) return undefined
    return {
      id: Number(id),
      nombre: customerData.nombre,
      sede: customerData.sede
    }
  }, [id, customerData])

  const { apiResponse, refetch, stats } = useCustomerCertificates(
    id,
    searchTerm,
    currentPage,
    statusFilter
  )
  const certificatesData = apiResponse?.files || []

  const { data: customerLmsCourses, isLoading: isLoadingCustomerLmsCourses } =
    useCustomerLmsCourses(id, canManageLmsCourses)

  const fetchAllDataForDownload = useFetchAllCertificates(id)

  const {
    handleDelete,
    handleImageChange,
    handleAddSede,
    handleEditSede,
    handleDeleteSede,
    changeStatus,
    assignCourse,
    handleRemoveLmsCourse
  } = useCustomerProfileActions(id, setImage)

  const handleStatusChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newStatus = event.target.checked
    if (!customerData || !id) return
    await changeStatus(newStatus)
  }

  const handlePageChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev' && currentPage > 1) {
        setCurrentPage((prev) => prev - 1)
      } else if (
        direction === 'next' &&
        apiResponse &&
        currentPage < apiResponse.totalPages
      ) {
        setCurrentPage((prev) => prev + 1)
      }
    },
    [currentPage, apiResponse]
  )

  const handleStatusFilter = useCallback(
    (status: StatusFilter) => {
      const next = statusFilter === status ? null : status
      setStatusFilter(next)
      setCurrentPage(1)
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        if (next) params.set('status', next)
        else params.delete('status')
        return params
      })
    },
    [statusFilter, setSearchParams]
  )

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleDownloadOption = async (type: DownloadFilter) => {
    setIsDownloading(true)
    try {
      const allData = await fetchAllDataForDownload(type)
      if (allData.length === 0) {
        bigToast('No hay datos para exportar', 'info')
      } else {
        await exportToExcel(allData, customerData?.nombre)
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      bigToast('Error al descargar el archivo Excel', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadOverviewReport = async () => {
    if (!customerData) {
      bigToast('No hay datos del cliente disponibles', 'error')
      return
    }

    setIsDownloading(true)
    try {
      const allData = await fetchAllDataForDownload('all')
      await exportOverviewReport(customerData, allData, stats)
    } catch (error) {
      console.error('Error al descargar reporte completo:', error)
      bigToast('Error al descargar el reporte completo', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAssignLmsCourse = useCallback(async () => {
    if (!id || !selectedLmsCourseId) return

    if (await assignCourse(selectedLmsCourseId)) {
      setSelectedLmsCourseId('')
    }
  }, [assignCourse, id, selectedLmsCourseId])

  const handleTabChange = useCallback(
    (newTab: TabValue) => {
      console.log('handleTabChange called:', { currentTab: activeTab, newTab })
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('tab', newTab)
      setSearchParams(newSearchParams)
      setActiveTab(newTab)
      console.log('Tab changed to:', newTab)
    },
    [searchParams, setSearchParams, activeTab]
  )

  // Update search params when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set('query', searchTerm)
        return newParams
      })
    } else {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('query')
        return newParams
      })
    }
  }, [searchTerm, setSearchParams])

  useEffect(() => {
    if (
      (activeTab === 'lmsCourses' && !canManageLmsCourses) ||
      (activeTab === 'users' && !canListCustomerUsers) ||
      (activeTab === 'modules' && !canViewModules)
    ) {
      handleTabChange('equipment')
    }
  }, [
    activeTab,
    canManageLmsCourses,
    canListCustomerUsers,
    canViewModules,
    handleTabChange
  ])

  // Permission check
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (canManageCustomer || id === String($userStore.customer.id)) {
          setHasPermission(true)
        } else {
          setHasPermission(false)
          navigate(-1)
        }
      } catch (error) {
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      checkPermission()
    }

    return () => {
      setLoading(true)
    }
  }, [id, canManageCustomer, $userStore.customer, navigate])

  const matchedFields = getMatchedFields(apiResponse?.files ?? [])

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='60vh'
        >
          <CircularProgress size={60} />
          <Typography variant='h6' sx={{ ml: 2 }}>
            Cargando...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (!hasPermission) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error'>
          No tienes permisos suficientes para acceder a esta página.
        </Alert>
      </Container>
    )
  }

  if (loadingCustomer) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='60vh'
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' sx={{ py: 2 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <IconButton
          onClick={() => navigate('/customers')}
          sx={{
            mb: 2,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
          }}
        >
          <ArrowBack sx={{ color: '#10b981' }} />
        </IconButton>
      </Box>

      {/* Customer Profile Header */}
      <CustomerProfileBanner
        image={image}
        customerData={customerData}
        canChangeAvatar={canChangeAvatar}
        canUpdateCustomer={canUpdateCustomer}
        handleImageChange={handleImageChange}
        handleStatusChange={handleStatusChange}
      />

      {/* Statistics Cards */}
      <CustomerStatsCards
        stats={stats}
        statusFilter={statusFilter}
        handleStatusFilter={handleStatusFilter}
      />

      {/* Navigation Tabs */}
      <CustomerProfileTabs
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        isMobile={isMobile}
        totalEquipment={stats.total}
        sedeCount={customerData?.sede?.length || 0}
        canListCustomerUsers={canListCustomerUsers}
        canViewModules={canViewModules}
        canManageLmsCourses={canManageLmsCourses}
      />

      {/* Tab Content */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          minHeight: '400px'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {activeTab === 'overview' && (
            <OverviewTab
              handleTabChange={handleTabChange}
              isDownloading={isDownloading}
              handleDownloadOverviewReport={handleDownloadOverviewReport}
            />
          )}

          {activeTab === 'equipment' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Gestión de Equipos
              </Typography>

              {/* Advanced Search and Filters */}
              <EquipmentFilters
                apiResponse={apiResponse}
                statusFilter={statusFilter}
                handleStatusFilter={handleStatusFilter}
                searchTerm={searchTerm}
                handleSearchChange={handleSearchChange}
                clearSearch={clearSearch}
                matchedFields={matchedFields}
                canCreateFile={canCreateFile}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                isDownloading={isDownloading}
                onDownload={handleDownloadOption}
              />

              {/* Equipment Grid */}
              <EquipmentList
                apiResponse={apiResponse}
                certificatesData={certificatesData}
                searchTerm={searchTerm}
                clearSearch={clearSearch}
                handleDelete={handleDelete}
                sedes={customerData?.sede || []}
                rol={$userStore.rol}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
              />
            </Box>
          )}

          {activeTab === 'headquarters' && (
            <HeadquartersTab
              setSelectedSede={setSelectedSede}
              selectedSede={selectedSede}
              sedes={customerData?.sede || []}
              handleDelete={handleDelete}
              handleDeleteSede={handleDeleteSede}
              handleAddSede={handleAddSede}
              handleEditSede={handleEditSede}
            />
          )}

          {activeTab === 'schedule' && <ScheduleTab id={id} />}

          {activeTab === 'users' && (
            <UsersTab canListCustomerUsers={canListCustomerUsers} />
          )}

          {activeTab === 'modules' && (
            <ModulesTab canViewModules={canViewModules} id={id} />
          )}

          {activeTab === 'lmsCourses' && canManageLmsCourses && (
            <LmsCoursesTab
              customerLmsCourses={customerLmsCourses}
              isLoadingCustomerLmsCourses={isLoadingCustomerLmsCourses}
              selectedLmsCourseId={selectedLmsCourseId}
              setSelectedLmsCourseId={setSelectedLmsCourseId}
              handleAssignLmsCourse={handleAssignLmsCourse}
              handleRemoveLmsCourse={handleRemoveLmsCourse}
            />
          )}
        </CardContent>
      </Card>
      {/* Create File Modal */}
      {customerData && (
        <CreateFileModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          fetchFiles={async () => {
            await refetch()
          }}
          axiosPrivate={axiosPrivate}
          preSelectedCustomer={preSelectedCustomerData}
        />
      )}
    </Container>
  )
}

export default ModernCustomerProfile
