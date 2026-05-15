import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Alert,
  IconButton
} from '@mui/material'
import {
  Send,
  Lock,
  Public,
  AccessTime,
  Edit,
  Delete,
  Save,
  Close
} from '@mui/icons-material'
import { MaintenanceComment } from '../../types/maintenance'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MaintenanceCommentsListProps {
  comments: MaintenanceComment[]
  onAddComment: (comment: string, isInternal: boolean) => Promise<void>
  onUpdateComment: (
    commentId: string,
    content: string,
    isInternal?: boolean
  ) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  currentUserRole: string
  currentUserEmail: string
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
  onUpdateComment,
  onDeleteComment,
  currentUserRole,
  currentUserEmail,
  loading = false,
  disabled = false
}) => {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }

  const canAddInternalComments = ['admin', 'mantenimiento'].includes(
    currentUserRole
  )
  const isPrivilegedUser = ['admin', 'maintenance_coordinator'].includes(
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
      case 'technician':
        return 'primary'
      case 'client':
      case 'customer':
        return 'success'
      case 'system':
        return 'info'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'mantenimiento':
      case 'technician':
        return 'Técnico'
      case 'client':
      case 'customer':
        return 'Cliente'
      case 'system':
        return 'Sistema'
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

  const canManageComment = (comment: MaintenanceComment) => {
    if (!comment.isVisible) {
      return false
    }

    if (isPrivilegedUser) {
      return true
    }

    return (
      comment.user?.email === currentUserEmail ||
      comment.technician?.email === currentUserEmail
    )
  }

  const handleStartEdit = (comment: MaintenanceComment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  const handleSaveEdit = async (comment: MaintenanceComment) => {
    if (!editingContent.trim()) return

    try {
      await onUpdateComment(comment.id, editingContent.trim(), comment.isInternal)
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await onDeleteComment(commentId)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  return (
    <Box>
      <Typography 
        variant='h6' 
        gutterBottom
        sx={{
          fontWeight: 600,
          color: '#0f172a',
          mb: 3
        }}
      >
        Comentarios ({userComments.length})
      </Typography>

      {/* Comments List */}
      <Box 
        sx={{ 
          maxHeight: 400, 
          overflowY: 'auto', 
          mb: 3,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#e2e8f0',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#94a3b8',
            borderRadius: '3px',
          },
        }}
      >
        {sortedComments.length === 0 ? (
          <Alert 
            severity='info' 
            sx={{ 
              mb: 2,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid rgba(33, 150, 243, 0.2)'
            }}
          >
            No hay comentarios aún. ¡Sé el primero en comentar!
          </Alert>
        ) : (
          sortedComments.map((comment, index) => (
            <Paper
              key={comment.id}
              elevation={1}
              sx={{
                ...surfaceSx,
                p: 2,
                mb: 2,
                backgroundColor: comment.isInternal ? '#fffbeb' : '#ffffff',
                border: comment.isInternal 
                  ? '1px solid #fde68a' 
                  : '1px solid #e5e7eb',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  borderColor: comment.isInternal ? '#fcd34d' : '#cbd5e1',
                  boxShadow: comment.isInternal
                    ? '0 4px 12px rgba(245, 158, 11, 0.12)'
                    : '0 4px 12px rgba(15, 23, 42, 0.08)'
                }
              }}
            >
              {/* Comment Header */}
              <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      backgroundColor:
                        getRoleColor(comment.authorType || comment.userRole) === 'primary'
                          ? '#eef6ee'
                          : getRoleColor(comment.authorType || comment.userRole) === 'error'
                            ? '#fef2f2'
                            : getRoleColor(comment.authorType || comment.userRole) === 'success'
                              ? '#ecfdf5'
                              : getRoleColor(comment.authorType || comment.userRole) === 'info'
                                ? '#eff6ff'
                                : '#f1f5f9',
                      color:
                        getRoleColor(comment.authorType || comment.userRole) === 'primary'
                          ? '#2f7d32'
                          : getRoleColor(comment.authorType || comment.userRole) === 'error'
                            ? '#dc2626'
                            : getRoleColor(comment.authorType || comment.userRole) === 'success'
                              ? '#059669'
                              : getRoleColor(comment.authorType || comment.userRole) === 'info'
                                ? '#2563eb'
                                : '#475569'
                    }}
                  >
                    {getInitials(comment.authorName || comment.userName)}
                  </Avatar>

                  <Box>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      {comment.authorName || comment.userName}
                    </Typography>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <Chip
                        size='small'
                        label={getRoleLabel(
                          comment.authorType || comment.userRole
                        )}
                        sx={{
                          borderRadius: '6px',
                          fontWeight: 500,
                          background: getRoleColor(comment.authorType || comment.userRole) === 'primary' 
                            ? '#eef6ee'
                            : undefined,
                          color: getRoleColor(comment.authorType || comment.userRole) === 'primary' 
                            ? '#2f7d32' 
                            : undefined,
                          border: getRoleColor(comment.authorType || comment.userRole) === 'primary' 
                            ? 'none' 
                            : undefined
                        }}
                        color={
                          getRoleColor(
                            comment.authorType || comment.userRole
                          ) as any
                        }
                        variant={getRoleColor(comment.authorType || comment.userRole) === 'primary' ? 'filled' : 'outlined'}
                      />
                      {comment.isInternal && (
                        <Tooltip title='Comentario interno - Solo visible para técnicos y administradores'>
                          <Chip
                            size='small'
                            icon={<Lock />}
                            label='Interno'
                            sx={{
                              borderRadius: '6px',
                              fontWeight: 500,
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              border: 'none',
                              '& .MuiChip-icon': {
                                color: '#b45309'
                              }
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box display='flex' alignItems='center' gap={0.5}>
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
                  {canManageComment(comment) && (
                    <>
                      <Tooltip title='Editar comentario'>
                        <IconButton
                          size='small'
                          onClick={() => handleStartEdit(comment)}
                          disabled={loading}
                        >
                          <Edit fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Eliminar comentario'>
                        <IconButton
                          size='small'
                          onClick={() => handleDelete(comment.id)}
                          disabled={loading}
                        >
                          <Delete fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>

              {/* Comment Content */}
              {editingCommentId === comment.id ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box display='flex' justifyContent='flex-end' gap={1}>
                    <Button
                      size='small'
                      startIcon={<Close />}
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size='small'
                      variant='contained'
                      startIcon={<Save />}
                      onClick={() => handleSaveEdit(comment)}
                      disabled={!editingContent.trim()}
                    >
                      Guardar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant='body2'
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontStyle: comment.isVisible === false ? 'italic' : 'normal',
                    color: comment.isVisible === false ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {comment.content}
                </Typography>
              )}

              {index < sortedComments.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Paper>
          ))
        )}
      </Box>

      {/* Add Comment Form */}
      {!disabled && (
        <Paper 
          sx={{ 
            ...surfaceSx,
            p: 2,
          }}
        >
          <Typography 
            variant='subtitle2' 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#0f172a'
            }}
          >
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
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#86c88a',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2f7d32',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2f7d32',
                }
              }}
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
                sx={{
                  backgroundColor: '#2f7d32',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#27672a'
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
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
