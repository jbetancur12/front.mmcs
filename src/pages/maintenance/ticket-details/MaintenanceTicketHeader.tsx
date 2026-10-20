import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
  Breadcrumbs,
  Link,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Menu,
  MenuList,
  ListItemButton,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  PictureAsPdf,
  Refresh,
  ExpandMore,
  Print,
  NotificationsActive,
  Science
} from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { formatDate } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketHeaderProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Encabezado: migas, título, indicador de tiempo real, menú de PDFs y botones de edición. */
const MaintenanceTicketHeader = ({ ticket, details }: MaintenanceTicketHeaderProps) => {
  const {
    isMobile,
    canEditTicket,
    isCustomerApprovalLocked,
    updateTicketMutation,
    generateServiceOrderMutation,
    generateStatusReportMutation,
    generateServiceCertificateMutation,
    generateServiceInvoiceMutation,
    handleSaveEdit,
    handleGenerateServiceOrder,
    handleGenerateTechnicalReport,
    handlePdfMenuOpen,
    handlePdfMenuClose,
    handleRefresh,
    handleBack,
    pdfMenuAnchor,
    realTimeUpdatesEnabled,
    setRealTimeUpdatesEnabled,
    lastUpdate,
    handleEdit,
    handleCancelEdit,
    editMode,
    isEditValid
  } = details

  return (
    <Box
      mb={{ xs: 2, sm: 3 }}
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        p: { xs: 2, sm: 3 },
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e5e7eb'
      }}
    >
      <Breadcrumbs
        aria-label='breadcrumb'
        sx={{
          mb: 2,
          display: { xs: 'none', sm: 'flex' },
          '& .MuiBreadcrumbs-separator': {
            color: '#94a3b8'
          }
        }}
      >
        <Link
          color='inherit'
          href='/maintenance'
          underline='hover'
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#475569',
            '&:hover': {
              color: '#0f172a'
            }
          }}
          onClick={(e) => {
            e.preventDefault()
            handleBack()
          }}
        >
          Dashboard de Mantenimiento
        </Link>
        <Typography
          sx={{
            color: '#0f172a',
            fontWeight: 600
          }}
        >
          Ticket #{ticket.ticketCode}
        </Typography>
      </Breadcrumbs>

      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box
          display='flex'
          alignItems='center'
          gap={{ xs: 1, sm: 2 }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <IconButton
            onClick={handleBack}
            aria-label='Volver al dashboard de mantenimiento'
            sx={{
              minWidth: 48,
              minHeight: 48,
              backgroundColor: '#ffffff',
              color: '#475569',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              '&:hover': {
                backgroundColor: '#f8fafc'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box flex={1}>
            <Typography
              variant='h4'
              component='h1'
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em'
              }}
            >
              Ticket #{ticket.ticketCode}
            </Typography>
            <Typography
              variant='subtitle1'
              color='text.secondary'
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500
              }}
            >
              {ticket.customerName} - {ticket.equipmentType}
            </Typography>
          </Box>
        </Box>

        <Box
          display='flex'
          gap={{ xs: 0.5, sm: 1 }}
          alignItems='center'
          flexWrap='wrap'
          width={{ xs: '100%', sm: 'auto' }}
        >
          {/* Real-time updates indicator - hide on mobile */}
          <Box
            display={{ xs: 'none', md: 'flex' }}
            alignItems='center'
            gap={1}
            mr={2}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdatesEnabled}
                  onChange={(e) =>
                    setRealTimeUpdatesEnabled(e.target.checked)
                  }
                  size='small'
                />
              }
              label='Tiempo Real'
              sx={{ m: 0 }}
            />
            {lastUpdate && (
              <Tooltip
                title={`Última actualización: ${formatDate(lastUpdate.toISOString())}`}
              >
                <Badge color='primary' variant='dot'>
                  <NotificationsActive fontSize='small' color='action' />
                </Badge>
              </Tooltip>
            )}
          </Box>

          <Tooltip title='Actualizar datos'>
            <IconButton
              onClick={handleRefresh}
              aria-label='Actualizar datos del ticket'
              sx={{
                minWidth: 48,
                minHeight: 48,
                backgroundColor: '#ffffff',
                color: '#475569',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  color: '#0f172a'
                }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          {/* PDF Generation Menu */}
          <Button
            variant='outlined'
            startIcon={
              !isMobile &&
              (generateServiceOrderMutation.isLoading ||
              generateStatusReportMutation.isLoading ||
              generateServiceCertificateMutation.isLoading ||
              generateServiceInvoiceMutation.isLoading ? (
                <CircularProgress size={16} />
              ) : (
                <PictureAsPdf />
              ))
            }
            onClick={handlePdfMenuOpen}
            disabled={
              generateServiceOrderMutation.isLoading ||
              generateStatusReportMutation.isLoading ||
              generateServiceCertificateMutation.isLoading ||
              generateServiceInvoiceMutation.isLoading
            }
            size={isMobile ? 'small' : 'medium'}
            endIcon={<ExpandMore />}
            aria-label='Menú de generación de documentos PDF'
            aria-haspopup='menu'
            aria-expanded={Boolean(pdfMenuAnchor)}
            aria-controls='pdf-menu'
            sx={{
              minHeight: 48,
              fontSize: { xs: '0.813rem', sm: '0.875rem' },
              borderColor: '#d1d5db',
              color: '#334155',
              borderRadius: '12px',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            {isMobile ? <PictureAsPdf /> : 'Documentos'}
          </Button>

          <Menu
            id='pdf-menu'
            anchorEl={pdfMenuAnchor}
            open={Boolean(pdfMenuAnchor)}
            onClose={handlePdfMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            aria-labelledby='pdf-menu-button'
            sx={{
              '& .MuiPaper-root': {
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                border: '1px solid #e5e7eb',
                mt: 1
              }
            }}
          >
            <MenuList dense role='menu'>
              <ListItemButton
                onClick={handleGenerateServiceOrder}
                role='menuitem'
                aria-label='Generar orden de servicio'
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                <ListItemIcon>
                  <Print
                    fontSize='small'
                    aria-hidden='true'
                    sx={{ color: '#00bf75' }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Orden de Servicio'
                  secondary='Documento de trabajo'
                />
              </ListItemButton>
              {ticket.status === MaintenanceStatus.COMPLETED && (
                <ListItemButton
                  onClick={handleGenerateTechnicalReport}
                  role='menuitem'
                  aria-label='Generar reporte técnico'
                  sx={{
                    borderRadius: '8px',
                    mx: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Science
                      fontSize='small'
                      aria-hidden='true'
                      sx={{ color: '#2563eb' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary='Reporte Técnico'
                    secondary='Documento técnico de cierre'
                  />
                </ListItemButton>
              )}
              {/* 
              <ListItemButton
                onClick={handleGenerateStatusReport}
                role='menuitem'
                aria-label='Generar reporte de estado'
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'rgba(109, 198, 98, 0.1)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon>
                  <Assessment fontSize='small' aria-hidden='true' sx={{ color: '#00bf75' }} />
                </ListItemIcon>
                <ListItemText
                  primary='Reporte de Estado'
                  secondary='Estado actual del ticket'
                />
              </ListItemButton> */}
              {/* 
              <ListItemButton
                onClick={handleGenerateServiceCertificate}
                disabled={ticket.status !== MaintenanceStatus.COMPLETED}
                role='menuitem'
                aria-label='Generar certificado de servicio'
                aria-disabled={ticket.status !== MaintenanceStatus.COMPLETED}
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: ticket.status === MaintenanceStatus.COMPLETED
                      ? 'rgba(109, 198, 98, 0.1)'
                      : 'rgba(0, 0, 0, 0.04)',
                    transform: ticket.status === MaintenanceStatus.COMPLETED
                      ? 'translateX(4px)'
                      : 'none'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5
                  }
                }}
              >
                <ListItemIcon>
                  <AssignmentTurnedIn
                    fontSize='small'
                    aria-hidden='true'
                    sx={{
                      color: ticket.status === MaintenanceStatus.COMPLETED
                        ? '#00bf75'
                        : 'text.disabled'
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Certificado de Servicio'
                  secondary={
                    ticket?.status !== MaintenanceStatus.COMPLETED
                      ? 'Solo para tickets completados'
                      : 'Certificado oficial'
                  }
                />
              </ListItemButton>

              <ListItemButton
                onClick={handleGenerateInvoice}
                disabled={!ticket.actualCost && !ticket.estimatedCost}
                role='menuitem'
                aria-label='Generar factura'
                aria-disabled={!ticket.actualCost && !ticket.estimatedCost}
                sx={{
                  borderRadius: '8px',
                  mx: 1,
                  mb: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: (ticket.actualCost || ticket.estimatedCost)
                      ? 'rgba(109, 198, 98, 0.1)'
                      : 'rgba(0, 0, 0, 0.04)',
                    transform: (ticket.actualCost || ticket.estimatedCost)
                      ? 'translateX(4px)'
                      : 'none'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5
                  }
                }}
              >
                <ListItemIcon>
                  <Receipt
                    fontSize='small'
                    aria-hidden='true'
                    sx={{
                      color: (ticket.actualCost || ticket.estimatedCost)
                        ? '#00bf75'
                        : 'text.disabled'
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary='Factura'
                  secondary={
                    !ticket?.actualCost && !ticket?.estimatedCost
                      ? 'Requiere costo especificado'
                      : 'Documento de facturación'
                  }
                />
              </ListItemButton> */}
            </MenuList>
          </Menu>

          {editMode ? (
            <>
              <Button
                variant='outlined'
                startIcon={!isMobile && <Cancel />}
                onClick={handleCancelEdit}
                disabled={updateTicketMutation.isLoading}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minHeight: 48,
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  borderColor: '#ff5722',
                  color: '#ff5722',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: '#d84315',
                    background: 'rgba(255, 87, 34, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {isMobile ? <Cancel /> : 'Cancelar'}
              </Button>
              <Button
                variant='contained'
                startIcon={
                  !isMobile &&
                  (updateTicketMutation.isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Save />
                  ))
                }
                onClick={handleSaveEdit}
                disabled={updateTicketMutation.isLoading || !isEditValid}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minHeight: 48,
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  background:
                    'linear-gradient(135deg, #00bf75 0%, #008f4f 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #008f4f 0%, #4a9642 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                {isMobile ? (
                  <Save />
                ) : updateTicketMutation.isLoading ? (
                  'Guardando...'
                ) : (
                  'Guardar'
                )}
              </Button>
            </>
          ) : (
            <Button
              variant='contained'
              startIcon={!isMobile && <Edit />}
              onClick={handleEdit}
              disabled={!canEditTicket || isCustomerApprovalLocked}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                minHeight: 48,
                fontSize: { xs: '0.813rem', sm: '0.875rem' },
                background:
                  'linear-gradient(135deg, #00bf75 0%, #008f4f 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #008f4f 0%, #4a9642 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
                }
              }}
            >
              {isMobile ? <Edit /> : 'Editar'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default MaintenanceTicketHeader
