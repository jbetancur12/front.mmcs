import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Badge,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  Whatshot as WhatshotIcon,
  NewReleases as NewReleasesIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface Course {
  id: number
  title: string
  description: string
  progress: number
  totalLessons: number
  completedLessons: number
  category: string
  instructor: string
  duration: string
  rating: number
  image?: string
  isPublic: boolean
}

interface ClientDashboardProps {
  user?: User
}

// Mock data para cursos públicos disponibles
const mockAvailableCourses: Course[] = [
  {
    id: 1,
    title: 'Introducción a la Programación',
    description: 'Conceptos básicos de programación para principiantes',
    progress: 60,
    totalLessons: 10,
    completedLessons: 6,
    category: 'Programación',
    instructor: 'Dr. Carlos Méndez',
    duration: '6 horas',
    rating: 4.7,
    isPublic: true
  },
  {
    id: 2,
    title: 'Excel Básico',
    description: 'Aprende a usar Excel desde cero',
    progress: 30,
    totalLessons: 8,
    completedLessons: 2,
    category: 'Ofimática',
    instructor: 'Ing. María García',
    duration: '4 horas',
    rating: 4.5,
    isPublic: true
  },
  {
    id: 3,
    title: 'Comunicación Efectiva',
    description: 'Mejora tus habilidades de comunicación',
    progress: 100,
    totalLessons: 6,
    completedLessons: 6,
    category: 'Habilidades Blandas',
    instructor: 'Lic. Ana López',
    duration: '3 horas',
    rating: 4.8,
    isPublic: true
  },
  {
    id: 4,
    title: 'Marketing Digital',
    description: 'Estrategias de marketing en el mundo digital',
    progress: 0,
    totalLessons: 12,
    completedLessons: 0,
    category: 'Marketing',
    instructor: 'Lic. Roberto Silva',
    duration: '8 horas',
    rating: 4.6,
    isPublic: true
  },
  {
    id: 5,
    title: 'Fotografía Básica',
    description: 'Aprende los fundamentos de la fotografía',
    progress: 0,
    totalLessons: 15,
    completedLessons: 0,
    category: 'Arte y Diseño',
    instructor: 'Prof. Laura Martínez',
    duration: '10 horas',
    rating: 4.9,
    isPublic: true
  },
  {
    id: 6,
    title: 'Gestión del Tiempo',
    description: 'Técnicas para optimizar tu productividad',
    progress: 0,
    totalLessons: 8,
    completedLessons: 0,
    category: 'Productividad',
    instructor: 'Dr. Patricia Ruiz',
    duration: '5 horas',
    rating: 4.7,
    isPublic: true
  }
]

const mockPopularCourses = [
  {
    id: 1,
    title: 'Introducción a la Programación',
    enrollments: 1250,
    rating: 4.7,
    category: 'Programación'
  },
  {
    id: 4,
    title: 'Marketing Digital',
    enrollments: 980,
    rating: 4.6,
    category: 'Marketing'
  },
  {
    id: 5,
    title: 'Fotografía Básica',
    enrollments: 756,
    rating: 4.9,
    category: 'Arte y Diseño'
  }
]

const mockNewCourses = [
  {
    id: 6,
    title: 'Gestión del Tiempo',
    releaseDate: '2024-01-15',
    rating: 4.7,
    category: 'Productividad'
  },
  {
    id: 4,
    title: 'Marketing Digital',
    releaseDate: '2024-01-10',
    rating: 4.6,
    category: 'Marketing'
  }
]

const mockCategories = [
  'Todos',
  'Programación',
  'Ofimática',
  'Habilidades Blandas',
  'Marketing',
  'Arte y Diseño',
  'Productividad'
]

const mockStats = {
  totalCourses: 8,
  completedCourses: 3,
  inProgressCourses: 2,
  averageProgress: 65,
  certificatesEarned: 5,
  totalHoursLearned: 25
}

const LmsClient: React.FC<ClientDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [filteredCourses, setFilteredCourses] = useState(mockAvailableCourses)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Filtrar cursos basado en búsqueda y categoría
  useEffect(() => {
    let filtered = mockAvailableCourses

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCourses(filtered)
  }, [searchTerm, selectedCategory])

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'client',
    name: $userStore.nombre || $userStore.email || 'Cliente'
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCourseClick = (courseId: number) => {
    // Navegar al curso específico
    console.log('Navegando al curso:', courseId)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            maxWidth: 'xl',
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography
                variant='h4'
                component='h1'
                sx={{ fontWeight: 'bold', color: 'text.primary' }}
              >
                Cursos Públicos
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Cliente'
                color='info'
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              />
              <Button
                variant='outlined'
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size='small'
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label='Mi Progreso' />
          <Tab label='Explorar Cursos' />
          <Tab label='Mis Certificados' />
          <Tab label='Populares' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<BookOpenIcon color='primary' />}
                    title='Cursos Totales'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {mockStats.completedCourses} completados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<TrendingUpIcon color='success' />}
                    title='Progreso Promedio'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.averageProgress}%
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={mockStats.averageProgress}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<CheckCircleIcon color='warning' />}
                    title='Certificados'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.certificatesEarned}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Obtenidos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<ScheduleIcon color='info' />}
                    title='Horas Aprendidas'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalHoursLearned}h
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Este año
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Mis cursos inscritos */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Mis Cursos Inscritos' />
                  <CardContent>
                    <List>
                      {mockAvailableCourses
                        .filter(course => course.progress > 0)
                        .map((course) => (
                          <React.Fragment key={course.id}>
                            <ListItem 
                              button 
                              onClick={() => handleCourseClick(course.id)}
                              sx={{ px: 0 }}
                            >
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                  <BookOpenIcon />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                      {course.title}
                                    </Typography>
                                    <Chip 
                                      label={course.category} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {course.instructor} • {course.duration}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={course.progress}
                                        sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {course.progress}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Button
                                variant={course.progress === 100 ? 'outlined' : 'contained'}
                                size="small"
                                startIcon={course.progress === 100 ? <AwardIcon /> : <PlayArrowIcon />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCourseClick(course.id)
                                }}
                              >
                                {course.progress === 100 ? 'Ver Certificado' : 'Continuar'}
                              </Button>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Cursos Populares" />
                  <CardContent>
                    <List dense>
                      {mockPopularCourses.map((course) => (
                        <ListItem key={course.id} sx={{ px: 0 }}>
                          <ListItemIcon><WhatshotIcon color="warning" /></ListItemIcon>
                          <ListItemText 
                            primary={course.title}
                            secondary={`${course.enrollments} inscritos • ${course.rating}⭐`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Nuevos Cursos" />
                  <CardContent>
                    <List dense>
                      {mockNewCourses.map((course) => (
                        <ListItem key={course.id} sx={{ px: 0 }}>
                          <ListItemIcon><NewReleasesIcon color="info" /></ListItemIcon>
                          <ListItemText 
                            primary={course.title}
                            secondary={`Nuevo • ${course.rating}⭐`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Barra de búsqueda y filtros */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Categoría"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {mockCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredCourses.length} cursos encontrados
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Lista de cursos */}
            <Grid container spacing={3}>
              {filteredCourses.map((course) => (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card
                    variant='outlined'
                    sx={{ cursor: 'pointer', height: '100%' }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <BookOpenIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='h6' component='div' sx={{ mb: 0.5 }}>
                            {course.title}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {course.instructor}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant='caption'>{course.rating}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              • {course.duration}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label={course.category} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`${course.totalLessons} lecciones`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      {course.progress > 0 ? (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='caption'>Tu progreso</Typography>
                            <Typography variant='caption'>{course.progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant='determinate'
                            value={course.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      ) : null}
                      
                      <Button
                        variant={course.progress > 0 ? 'outlined' : 'contained'}
                        size="small"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCourseClick(course.id)
                        }}
                      >
                        {course.progress > 0 ? 'Continuar' : 'Inscribirse'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredCourses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No se encontraron cursos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intenta con otros términos de búsqueda o cambia la categoría
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Mis Certificados
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {mockStats.certificatesEarned} certificados obtenidos
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {mockAvailableCourses
                .filter(course => course.progress === 100)
                .map((course) => (
                  <Grid item xs={12} md={6} lg={4} key={course.id}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                            <AwardIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant='h6' component='div'>
                              {course.title}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Completado el 15 de Enero, 2024
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                          Instructor: {course.instructor}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip 
                            label={course.category} 
                            size="small" 
                            color="success"
                          />
                          <Chip 
                            label={`${course.duration}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                        
                        <Button
                          variant='outlined'
                          size="small"
                          fullWidth
                          startIcon={<AwardIcon />}
                          onClick={() => handleCourseClick(course.id)}
                        >
                          Ver Certificado
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            {mockAvailableCourses.filter(course => course.progress === 100).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AwardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Aún no tienes certificados
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Completa cursos para obtener certificados
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(1)}>
                  Explorar Cursos
                </Button>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 3 }}>
              Cursos Populares y Destacados
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Más Populares" 
                    avatar={<WhatshotIcon color="warning" />}
                  />
                  <CardContent>
                    <List>
                      {mockPopularCourses.map((course, index) => (
                        <React.Fragment key={course.id}>
                          <ListItem 
                            button 
                            onClick={() => handleCourseClick(course.id)}
                            sx={{ px: 0 }}
                          >
                            <ListItemIcon>
                              <Typography variant="h6" color="warning.main">
                                #{index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption">
                                    {course.enrollments} inscritos
                                  </Typography>
                                  <Chip 
                                    label={course.category} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                    <Typography variant="caption">{course.rating}</Typography>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button size="small" variant="outlined">
                              Ver Curso
                            </Button>
                          </ListItem>
                          {index < mockPopularCourses.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Recién Agregados" 
                    avatar={<NewReleasesIcon color="info" />}
                  />
                  <CardContent>
                    <List>
                      {mockNewCourses.map((course, index) => (
                        <React.Fragment key={course.id}>
                          <ListItem 
                            button 
                            onClick={() => handleCourseClick(course.id)}
                            sx={{ px: 0 }}
                          >
                            <ListItemIcon>
                              <NewReleasesIcon color="info" />
                            </ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption">
                                    Agregado el {new Date(course.releaseDate).toLocaleDateString()}
                                  </Typography>
                                  <Chip 
                                    label={course.category} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                    <Typography variant="caption">{course.rating}</Typography>
                                  </Box>
                                </Box>
                              }
                            />
                            <Button size="small" variant="contained">
                              Inscribirse
                            </Button>
                          </ListItem>
                          {index < mockNewCourses.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                ¿Buscas algo específico?
              </Typography>
              <Button 
                variant='contained' 
                size="large"
                onClick={() => setActiveTab(1)}
                startIcon={<SearchIcon />}
              >
                Explorar Todos los Cursos
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsClient
