import React from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  AutoStories as StoriesIcon,
  CheckCircle as CheckCircleIcon,
  MenuBook as BookOpenIcon,
  PlayArrow as PlayArrowIcon,
  WorkspacePremium as PremiumIcon
} from '@mui/icons-material'

export type CourseTone = {
  color: 'success' | 'primary' | 'secondary'
  icon: React.ReactElement
}

/** Color e icono de la portada según el estado del curso. */
export const getCourseTone = (course: { progress?: number; has_certificate?: boolean }): CourseTone => {
  if (course.progress === 100) return { color: 'success', icon: <CheckCircleIcon /> }
  if ((course.progress || 0) > 0) return { color: 'primary', icon: <BookOpenIcon /> }
  if (course.has_certificate) return { color: 'secondary', icon: <PremiumIcon /> }
  return { color: 'secondary', icon: <StoriesIcon /> }
}

interface LmsCourseGridProps {
  courses: any[]
  onOpen: (courseId: number) => void
}

/** Cuadrícula de tarjetas con portada de color para el catálogo del estudiante. */
const LmsCourseGrid: React.FC<LmsCourseGridProps> = ({ courses, onOpen }) => (
  <Grid container spacing={2.5}>
    {courses.map((course) => {
      const tone = getCourseTone(course)
      const done = course.progress === 100
      const started = (course.progress || 0) > 0 && !done
      return (
        <Grid item xs={12} sm={6} lg={4} key={course.id}>
          <Card
            variant='outlined'
            onClick={() => onOpen(course.id)}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform .15s ease, box-shadow .15s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }
            }}
          >
            <Box
              sx={(theme) => ({
                height: 84,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette[tone.color].main, 0.12),
                color: `${tone.color}.main`
              })}
            >
              {React.cloneElement(tone.icon, { sx: { fontSize: 38 } })}
              {done && <Chip size='small' color='success' label='Completado' />}
              {!done && course.has_certificate && (
                <Chip size='small' variant='outlined' color={tone.color} label='Con certificado' />
              )}
            </Box>
            <CardContent sx={{ flex: 1, pb: 1 }}>
              <Typography
                variant='subtitle1'
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.3,
                  minHeight: '2.6em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {course.title}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
                {course.completedLessons}/{course.totalLessons} lecciones
              </Typography>
              {started ? (
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant='determinate'
                    value={course.progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                    {course.progress}% completado
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 36 }} />
              )}
            </CardContent>
            <Box sx={{ p: 2, pt: 1 }}>
              <Button
                fullWidth
                variant={started || done ? 'outlined' : 'contained'}
                color={done ? 'success' : 'primary'}
                startIcon={done ? <CheckCircleIcon /> : <PlayArrowIcon />}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen(course.id)
                }}
              >
                {done ? 'Repasar' : started ? 'Continuar' : 'Comenzar'}
              </Button>
            </Box>
          </Card>
        </Grid>
      )
    })}
  </Grid>
)

export default LmsCourseGrid
