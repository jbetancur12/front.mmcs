import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Alert
} from '@mui/material'
import { Send, Person, Lock, Public, AccessTime } from '@mui/icons-material'
import { MaintenanceComment } from '../../types/maintenance'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MaintenanceCommentsListProps {
  comments: MaintenanceComment[]
  onAddComment: (comment: string, isInternal: boolean) => void
  currentUserRole: string
  loading?: boolean
  disabled?: boolean
}

/**
 * MaintenanceCommentsList component displays and manages comments for a maintenance ticket
 *
 * @param comments - Array of comments
 * @param onAddComment - Callback when a new comment is added
 * @param currentUserRole - Current user's role to determine permissions
 * @param loading - Whether comments are loading
 * @param disabled - Whether comment input is disabled
 */
const MaintenanceCommentsList: React.FC<MaintenanceCommentsListProps> = ({
  comments,
  onAddComment,
  currentUserRole,
  loading = false,
  disabled = false
}) => {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canAddInternalComments = ['admin', 'mantenimiento'].includes(
    currentUserRole
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAddComment(newComment.trim(), isInternal)
      setNewComment('')
      setIsInternal(false)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'NN'
    }
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'mantenimiento':
        return 'primary'
      case 'client':
        return 'success'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'mantenimiento':
        return 'Técnico'
      case 'client':
        return 'Cliente'
      default:
        return 'Usuario'
    }
  }

  // Filter out system events (status_update) to show only user comments
  const userComments = comments.filter(
    (comment) => comment.commentType !== 'status_update'
  )

  const sortedComments = [...userComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Comentarios ({userComments.length})
      </Typography>

      {/* Comments List */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
        {sortedComments.length === 0 ? (
          <Alert severity='info' sx={{ mb: 2 }}>
            No hay comentarios aún. ¡Sé el primero en comentar!
          </Alert>
        ) : (
          sortedComments.map((comment, index) => (
            <Paper
              key={comment.id}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: comment.isInternal
                  ? 'action.hover'
                  : 'background.paper',
                border: comment.isInternal ? '1px solid' : 'none',
                borderColor: comment.isInternal
                  ? 'warning.light'
                  : 'transparent'
              }}
            >
              {/* Comment Header */}
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                mb={1}
              >
                <Box display='flex' alignItems='center' gap={1}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: `${getRoleColor(comment.userRole)}.main`
                    }}
                  >
                    {getInitials(comment.userName)}
                  </Avatar>

                  <Box>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      {comment.userName}
                    </Typography>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <Chip
                        size='small'
                        label={getRoleLabel(comment.userRole)}
                        color={getRoleColor(comment.userRole) as any}
                        variant='outlined'
                      />
                      {comment.isInternal && (
                        <Tooltip title='Comentario interno - Solo visible para técnicos y administradores'>
                          <Chip
                            size='small'
                            icon={<Lock />}
                            label='Interno'
                            color='warning'
                            variant='outlined'
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box
                  display='flex'
                  alignItems='center'
                  gap={0.5}
                  color='text.secondary'
                >
                  <AccessTime fontSize='small' />
                  <Typography variant='caption'>
                    {formatDate(comment.createdAt)}
                  </Typography>
                </Box>
              </Box>

              {/* Comment Content */}
              <Typography
                variant='body2'
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {comment.content}
              </Typography>

              {index < sortedComments.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Paper>
          ))
        )}
      </Box>

      {/* Add Comment Form */}
      {!disabled && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant='subtitle2' gutterBottom>
            Agregar comentario
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Escribe tu comentario aquí...'
              disabled={submitting || loading}
              sx={{ mb: 2 }}
            />

            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Box>
                {canAddInternalComments && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        disabled={submitting || loading}
                        icon={<Public />}
                        checkedIcon={<Lock />}
                      />
                    }
                    label={
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <Typography variant='body2'>
                          {isInternal
                            ? 'Comentario interno'
                            : 'Comentario público'}
                        </Typography>
                        <Tooltip
                          title={
                            isInternal
                              ? 'Solo visible para técnicos y administradores'
                              : 'Visible para todos los usuarios'
                          }
                        >
                          <Box
                            component='span'
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            {isInternal ? (
                              <Lock fontSize='small' />
                            ) : (
                              <Public fontSize='small' />
                            )}
                          </Box>
                        </Tooltip>
                      </Box>
                    }
                  />
                )}
              </Box>

              <Button
                type='submit'
                variant='contained'
                endIcon={<Send />}
                disabled={!newComment.trim() || submitting || loading}
                size='small'
              >
                {submitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  )
}

export default MaintenanceCommentsList
