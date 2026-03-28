import React, { useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  Article as ContentIcon,
  CheckCircle as PublishedIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  School as CourseIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useCourses } from '../../../hooks/useLms'
import type { Course } from '../../../services/lmsService'
import { getCourseAudienceLabel } from '../../../utils/lmsAudience'

const statusColor = (status: Course['status']) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'archived':
      return 'default'
    default:
      return 'warning'
  }
}

const statusLabel = (status: Course['status']) => {
  switch (status) {
    case 'published':
      return 'Publicado'
    case 'archived':
      return 'Archivado'
    default:
      return 'Borrador'
  }
}

const LmsCourseDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | Course['status']>('all')
  const [audience, setAudience] = useState<'all' | Course['audience']>('all')

  const { data, isLoading } = useCourses({
    limit: 100,
    sortBy: 'updated_at',
    sortOrder: 'DESC'
  })

  const courses = data?.courses || []

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = status === 'all' || course.status === status
      const matchesAudience = audience === 'all' || course.audience === audience

      return matchesSearch && matchesStatus && matchesAudience
    })
  }, [audience, courses, search, status])

  const publishedCourses = courses.filter((course) => course.status === 'published').length
  const draftCourses = courses.filter((course) => course.status === 'draft').length
  const certificateCourses = courses.filter((course) => course.has_certificate).length

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Mis Cursos
          </Typography>
          <Typography color='text.secondary'>
            Tablero operativo del catalogo real del LMS con accesos directos a gestion y
            contenido.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant='outlined' onClick={() => navigate('/lms/admin/courses')}>
            Gestion completa
          </Button>
          <Button variant='contained' onClick={() => navigate('/lms/admin/courses')}>
            Crear o editar cursos
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <CourseIcon />
                </Avatar>
                <Box>
                  <Typography variant='h4'>{courses.length}</Typography>
                  <Typography color='text.secondary'>Cursos totales</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <PublishedIcon />
                </Avatar>
                <Box>
                  <Typography variant='h4'>{publishedCourses}</Typography>
                  <Typography color='text.secondary'>Publicados</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <EditIcon />
                </Avatar>
                <Box>
                  <Typography variant='h4'>{draftCourses}</Typography>
                  <Typography color='text.secondary'>Borradores</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <PreviewIcon />
                </Avatar>
                <Box>
                  <Typography variant='h4'>{certificateCourses}</Typography>
                  <Typography color='text.secondary'>Con certificado</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label='Buscar curso'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3.5}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={status}
                label='Estado'
                onChange={(event) => setStatus(event.target.value as 'all' | Course['status'])}
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='draft'>Borrador</MenuItem>
                <MenuItem value='published'>Publicado</MenuItem>
                <MenuItem value='archived'>Archivado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3.5}>
            <FormControl fullWidth>
              <InputLabel>Audiencia</InputLabel>
              <Select
                value={audience}
                label='Audiencia'
                onChange={(event) =>
                  setAudience(event.target.value as 'all' | Course['audience'])
                }
              >
                <MenuItem value='all'>Todas</MenuItem>
                <MenuItem value='internal'>Interno</MenuItem>
                <MenuItem value='client'>Cliente</MenuItem>
                <MenuItem value='both'>Ambos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Typography color='text.secondary'>Cargando catalogo de cursos...</Typography>
      ) : filteredCourses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No hay cursos que coincidan con los filtros
          </Typography>
          <Typography color='text.secondary'>
            Ajusta la busqueda o crea el siguiente curso desde Gestion de Cursos.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  avatar={<Avatar>{course.title.charAt(0).toUpperCase()}</Avatar>}
                  title={course.title}
                  subheader={`Actualizado ${new Date(course.updated_at).toLocaleDateString('es-CO')}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    {course.description}
                  </Typography>

                  <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mb: 2 }}>
                    <Chip
                      label={statusLabel(course.status)}
                      color={statusColor(course.status)}
                      size='small'
                    />
                    <Chip label={getCourseAudienceLabel(course.audience)} size='small' variant='outlined' />
                    {course.has_certificate ? (
                      <Chip label='Certificado' size='small' color='info' variant='outlined' />
                    ) : null}
                    {course.is_mandatory ? (
                      <Chip label='Obligatorio' size='small' color='warning' variant='outlined' />
                    ) : null}
                  </Stack>

                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
                    Modulos: {course.modules?.length || 0}
                  </Typography>

                  <Stack direction='row' spacing={1} flexWrap='wrap'>
                    <Button
                      size='small'
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/lms/course/${course.id}`)}
                    >
                      Ver
                    </Button>
                    <Button
                      size='small'
                      startIcon={<PreviewIcon />}
                      onClick={() => navigate(`/lms/course/${course.id}/preview`)}
                    >
                      Probar
                    </Button>
                    <Button
                      size='small'
                      startIcon={<ContentIcon />}
                      onClick={() => navigate(`/lms/admin/courses/${course.id}/content`)}
                    >
                      Contenido
                    </Button>
                    <Button
                      size='small'
                      startIcon={<EditIcon />}
                      onClick={() => navigate('/lms/admin/courses')}
                    >
                      Gestionar
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default LmsCourseDashboard
