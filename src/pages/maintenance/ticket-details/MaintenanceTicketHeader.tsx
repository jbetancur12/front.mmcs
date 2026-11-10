import {
  Typography,
  Box,
  IconButton,
  Tooltip,
  Button,
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
  Build,
  Edit,
  PictureAsPdf,
  Refresh,
  ExpandMore,
  Print,
  NotificationsActive,
  Science,
  Share
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { formatDate } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'
import { brand, neutral, intent, withAlpha } from 'src/theme/designTokens'

interface MaintenanceTicketHeaderProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Encabezado: volver, título del ticket, tiempo real, documentos PDF y editar. */
const MaintenanceTicketHeader = ({
  ticket,
  details
}: MaintenanceTicketHeaderProps) => {
  const {
    isMobile,
    canEditTicket,
    isCustomerApprovalLocked,
    generateServiceOrderMutation,
    generateStatusReportMutation,
    generateServiceCertificateMutation,
    generateServiceInvoiceMutation,
    handleGenerateServiceOrder,
    handleGenerateTechnicalReport,
    handlePdfMenuOpen,
    handlePdfMenuClose,
    handleRefresh,
    handleBack,
    showToast,
    pdfMenuAnchor,
    realTimeUpdatesEnabled,
    setRealTimeUpdatesEnabled,
    lastUpdate,
    handleEdit,
    editMode
  } = details

  const generatingPdf =
    generateServiceOrderMutation.isLoading ||
    generateStatusReportMutation.isLoading ||
    generateServiceCertificateMutation.isLoading ||
    generateServiceInvoiceMutation.isLoading

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Enlace copiado al portapapeles', 'success')
    } catch {
      showToast('No se pudo copiar el enlace', 'error')
    }
  }

  const menuItemSx = {
    borderRadius: '8px',
    mx: 1,
    mb: 0.5,
    '&:hover': { backgroundColor: neutral.surfaceAlt }
  }

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        aria-label='Volver al panel de mantenimiento'
        sx={{
          mb: 1,
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Volver al panel
      </Button>

      <LmsPageHeader
        title={`Ticket ${ticket.ticketCode}`}
        subtitle={`${ticket.customerName} - ${ticket.equipmentType}`}
        icon={<Build />}
        actions={
          <>
            <Box
              display={{ xs: 'none', md: 'flex' }}
              alignItems='center'
              gap={1}
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
                label='Tiempo real'
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
              >
                <Refresh />
              </IconButton>
            </Tooltip>

            <Tooltip title='Copiar enlace del ticket'>
              <IconButton
                onClick={handleShare}
                aria-label='Copiar enlace del ticket'
              >
                <Share />
              </IconButton>
            </Tooltip>

            <Button
              variant='outlined'
              startIcon={
                !isMobile &&
                (generatingPdf ? (
                  <CircularProgress size={16} />
                ) : (
                  <PictureAsPdf />
                ))
              }
              onClick={handlePdfMenuOpen}
              disabled={generatingPdf}
              endIcon={<ExpandMore />}
              aria-label='Menú de generación de documentos PDF'
              aria-haspopup='menu'
              aria-expanded={Boolean(pdfMenuAnchor)}
              aria-controls='pdf-menu'
              sx={{
                color: brand.hover,
                borderColor: brand.main,
                '&:hover': { borderColor: brand.hover, bgcolor: brand.soft }
              }}
            >
              {isMobile ? <PictureAsPdf /> : 'Documentos'}
            </Button>

            <Menu
              id='pdf-menu'
              anchorEl={pdfMenuAnchor}
              open={Boolean(pdfMenuAnchor)}
              onClose={handlePdfMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{
                '& .MuiPaper-root': {
                  backgroundColor: neutral.surface,
                  borderRadius: '12px',
                  boxShadow: `0 8px 24px ${withAlpha(neutral.text, 0.12)}`,
                  border: `1px solid ${neutral.border}`,
                  mt: 1
                }
              }}
            >
              <MenuList dense role='menu'>
                <ListItemButton
                  onClick={handleGenerateServiceOrder}
                  role='menuitem'
                  aria-label='Generar orden de servicio'
                  sx={menuItemSx}
                >
                  <ListItemIcon>
                    <Print
                      fontSize='small'
                      aria-hidden='true'
                      sx={{ color: intent.successInk }}
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
                    sx={menuItemSx}
                  >
                    <ListItemIcon>
                      <Science
                        fontSize='small'
                        aria-hidden='true'
                        sx={{ color: intent.action }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary='Reporte Técnico'
                      secondary='Documento técnico de cierre'
                    />
                  </ListItemButton>
                )}
              </MenuList>
            </Menu>

            {!editMode && (
              <Button
                variant='contained'
                startIcon={!isMobile && <Edit />}
                onClick={handleEdit}
                disabled={!canEditTicket || isCustomerApprovalLocked}
                aria-label='Editar ticket'
                sx={{
                  bgcolor: brand.main,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: brand.hover }
                }}
              >
                {isMobile ? <Edit /> : 'Editar'}
              </Button>
            )}
            {editMode && (
              <Typography variant='body2' color='text.secondary'>
                Editando: guarda o cancela desde la barra de abajo.
              </Typography>
            )}
          </>
        }
      />
    </>
  )
}

export default MaintenanceTicketHeader
