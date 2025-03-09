// CommentsSection.tsx
import React from 'react'
import { Button, Grid, Paper, TextField, Typography } from '@mui/material'

interface CommentsSectionProps {
  comments: string[]
  handleAddComment: () => void
  handleCommentChange: (index: number, text: string) => void
  onlyRead: boolean
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  handleAddComment,
  handleCommentChange,
  onlyRead
}) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Typography variant='h4' component='p' sx={{ mb: 2 }}>
      Comentarios
    </Typography>

    {comments.map((comment, index) => (
      <Grid container spacing={2} key={index} alignItems='center'>
        <Grid item xs={11}>
          <TextField
            disabled={onlyRead}
            label={`Comentario ${index + 1}`}
            variant='outlined'
            multiline
            rows={1}
            value={comment}
            onChange={(e) => handleCommentChange(index, e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={1}>
          <Button
            variant='contained'
            color='error'
            onClick={() => {
              const updatedComments = [...comments]
              updatedComments.splice(index, 1)
              handleCommentChange(index, '')
            }}
            sx={{ mb: 2 }}
          >
            X
          </Button>
        </Grid>
      </Grid>
    ))}

    <Button
      variant='contained'
      onClick={handleAddComment}
      sx={{ mb: 2 }}
      disabled={onlyRead}
    >
      Agregar Comentario
    </Button>
  </Paper>
)
