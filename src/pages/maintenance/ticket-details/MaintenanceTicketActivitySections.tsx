import {
  Paper,
  Typography,
  Box,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material'
import {
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import MaintenanceCommentsList from '../../../Components/Maintenance/MaintenanceCommentsList'
import MaintenanceFileUpload from '../../../Components/Maintenance/MaintenanceFileUpload'
import MaintenanceTimeline from '../../../Components/Maintenance/MaintenanceTimeline'
import { surfaceSx } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketActivitySectionsProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Historial, comentarios y archivos del ticket (secciones plegables). */
const MaintenanceTicketActivitySections = ({ ticket, details }: MaintenanceTicketActivitySectionsProps) => {
  const {
    $userStore,
    currentUserRole,
    addCommentMutation,
    uploadFilesMutation,
    deleteFileMutation,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleFileUpload,
    handleFileDelete,
    showTimeline,
    setShowTimeline,
    showComments,
    setShowComments,
    showFiles,
    setShowFiles,
    timelineData,
    timelineLoading,
    getFilePreviewUrl,
    handleFileView
  } = details

  return (
    <>
      {/* Timeline Section */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Historial del ticket'
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h6'
            sx={{ color: '#0f172a', fontWeight: 600 }}
          >
            Historial del Ticket
          </Typography>
          <IconButton
            onClick={() => setShowTimeline(!showTimeline)}
            sx={{ color: '#475569' }}
            aria-label={
              showTimeline ? 'Ocultar historial' : 'Mostrar historial'
            }
            aria-expanded={showTimeline}
            aria-controls='timeline-section'
          >
            {showTimeline ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showTimeline} id='timeline-section'>
          {timelineLoading ? (
            <Box
              display='flex'
              justifyContent='center'
              py={3}
              role='status'
              aria-live='polite'
            >
              <CircularProgress
                size={24}
                aria-label='Cargando historial'
              />
            </Box>
          ) : (
            <MaintenanceTimeline timeline={timelineData || []} />
          )}
        </Collapse>
      </Paper>

      {/* Comments Section */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Sección de comentarios'
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h6'
            sx={{ color: '#0f172a', fontWeight: 600 }}
          >
            Comentarios
          </Typography>
          <IconButton
            onClick={() => setShowComments(!showComments)}
            sx={{ color: '#475569' }}
            aria-label={
              showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'
            }
            aria-expanded={showComments}
            aria-controls='comments-section'
          >
            {showComments ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showComments} id='comments-section'>
          <MaintenanceCommentsList
            comments={ticket.comments || []}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            currentUserRole={currentUserRole}
            currentUserEmail={$userStore.email}
            loading={addCommentMutation.isLoading}
          />
        </Collapse>
      </Paper>

      {/* Files Section */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Archivos adjuntos'
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h6'
            sx={{ color: '#0f172a', fontWeight: 600 }}
          >
            Archivos Adjuntos
          </Typography>
          <IconButton
            onClick={() => setShowFiles(!showFiles)}
            sx={{ color: '#475569' }}
            aria-label={
              showFiles ? 'Ocultar archivos' : 'Mostrar archivos'
            }
            aria-expanded={showFiles}
            aria-controls='files-section'
          >
            {showFiles ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showFiles} id='files-section'>
          <MaintenanceFileUpload
            files={ticket.files || []}
            onFilesChange={handleFileUpload}
            onFileRemove={handleFileDelete}
            onFileView={handleFileView}
            getFilePreviewUrl={getFilePreviewUrl}
            uploading={uploadFilesMutation.isLoading}
            disabled={deleteFileMutation.isLoading}
          />
        </Collapse>
      </Paper>
    </>
  )
}

export default MaintenanceTicketActivitySections
