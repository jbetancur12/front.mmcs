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
  Alert
} from '@mui/material'
import { Send, Lock, Public, AccessTime } from '@mui/icons-material'
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

  return (
    <Box>
      <Typography 
        variant='h6' 
        gutterBottom
        sx={{
          fontWeight: 600,
          color: '#6dc662',
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
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
            borderRadius: '3px',
          },
        }}
      >
        {sortedComments.length === 0 ? (
          <Alert 
            severity='info' 
            sx={{ 
              mb: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(33, 150, 243, 0.1)',
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
                p: 2,
                mb: 2,
                background: comment.isInternal
                  ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 152, 0, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                boxShadow: comment.isInternal
                  ? '0 4px 20px rgba(255, 193, 7, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: comment.isInternal 
                  ? '1px solid rgba(255, 193, 7, 0.2)' 
                  : '1px solid rgba(109, 198, 98, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: comment.isInternal
                    ? '0 8px 30px rgba(255, 193, 7, 0.15)'
                    : '0 8px 30px rgba(109, 198, 98, 0.12)'
                }
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
                      background: `linear-gradient(135deg, ${getRoleColor(comment.authorType || comment.userRole) === 'primary' ? '#6dc662' : 
                        getRoleColor(comment.authorType || comment.userRole) === 'error' ? '#f44336' :
                        getRoleColor(comment.authorType || comment.userRole) === 'success' ? '#4caf50' :
                        getRoleColor(comment.authorType || comment.userRole) === 'info' ? '#2196f3' : '#9e9e9e'} 0%, ${
                        getRoleColor(comment.authorType || comment.userRole) === 'primary' ? '#5ab052' : 
                        getRoleColor(comment.authorType || comment.userRole) === 'error' ? '#d32f2f' :
                        getRoleColor(comment.authorType || comment.userRole) === 'success' ? '#388e3c' :
                        getRoleColor(comment.authorType || comment.userRole) === 'info' ? '#1976d2' : '#757575'} 100%)`,
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
                            ? 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)'
                            : undefined,
                          color: getRoleColor(comment.authorType || comment.userRole) === 'primary' 
                            ? 'white' 
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
                              background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)',
                              color: 'white',
                              border: 'none',
                              '& .MuiChip-icon': {
                                color: 'white'
                              }
                            }}
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
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(109, 198, 98, 0.1)'
          }}
        >
          <Typography 
            variant='subtitle2' 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#6dc662'
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
                    borderColor: '#6dc662',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6dc662',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#6dc662',
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
                  background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5ab052 0%, #4a9642 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
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
