import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  completedCourses: number
  totalCertificates: number
  averageCompletionRate: number
  topCourses: Array<{
    id: number
    title: string
    enrolledStudents: number
    completionRate: number
    rating: number
  }>
  userGrowth: Array<{
    month: string
    newUsers: number
    activeUsers: number
  }>
  coursePerformance: Array<{
    category: string
    totalCourses: number
    averageRating: number
    totalEnrollments: number
  }>
}

const LmsAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30')
  const axiosPrivate = useAxiosPrivate()

  // Mock data para analíticas
  const mockAnalyticsData: AnalyticsData = {
    totalUsers: 2547,
    activeUsers: 1834,
    totalCourses: 156,
    completedCourses: 89,
    totalCertificates: 1203,
    averageCompletionRate: 87,
    topCourses: [
      {
        id: 1,
        title: 'JavaScript Avanzado',
        enrolledStudents: 234,
        completionRate: 92,
        rating: 4.8
      },
      {
        id: 2,
        title: 'React Fundamentals',
        enrolledStudents: 189,
        completionRate: 88,
        rating: 4.6
      },
      {
        id: 3,
        title: 'Gestión de Proyectos',
        enrolledStudents: 156,
        completionRate: 95,
        rating: 4.9
      },
      {
        id: 4,
        title: 'Excel Avanzado',
        enrolledStudents: 145,
        completionRate: 85,
        rating: 4.5
      },
      {
        id: 5,
        title: 'Comunicación Efectiva',
        enrolledStudents: 123,
        completionRate: 90,
        rating: 4.7
      }
    ],
    userGrowth: [
      { month: 'Ene', newUsers: 45, activeUsers: 120 },
      { month: 'Feb', newUsers: 52, activeUsers: 135 },
      { month: 'Mar', newUsers: 38, activeUsers: 142 },
      { month: 'Abr', newUsers: 67, activeUsers: 158 },
      { month: 'May', newUsers: 73, activeUsers: 165 },
      { month: 'Jun', newUsers: 89, activeUsers: 178 }
    ],
    coursePerformance: [
      {
        category: 'Programación',
        totalCourses: 45,
        averageRating: 4.7,
        totalEnrollments: 1234
      },
      {
        category: 'Gestión',
        totalCourses: 32,
        averageRating: 4.6,
        totalEnrollments: 987
      },
      {
        category: 'Ofimática',
        totalCourses: 28,
        averageRating: 4.5,
        totalEnrollments: 756
      },
      {
        category: 'Habilidades Blandas',
        totalCourses: 23,
        averageRating: 4.8,
        totalEnrollments: 654
      },
      {
        category: 'Marketing',
        totalCourses: 18,
        averageRating: 4.4,
        totalEnrollments: 432
      }
    ]
  }

  // Query para obtener datos de analíticas (usando mock data por ahora)
  const { data: analyticsData = mockAnalyticsData, isLoading } =
    useQuery<AnalyticsData>(['lms-analytics', timeRange], async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get(`/lms/analytics?timeRange=${timeRange}`)
      // return response.data
      return mockAnalyticsData
    })

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Cargando analíticas...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' component='h1'>
          Analíticas del Sistema
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={timeRange}
            label='Período'
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value='7'>Últimos 7 días</MenuItem>
            <MenuItem value='30'>Últimos 30 días</MenuItem>
            <MenuItem value='90'>Últimos 90 días</MenuItem>
            <MenuItem value='365'>Último año</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardHeader
              avatar={<PeopleIcon color='primary' />}
              title='Total Usuarios'
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
                {analyticsData.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {analyticsData.activeUsers} activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardHeader
              avatar={<BookOpenIcon color='success' />}
              title='Cursos Activos'
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
                {analyticsData.totalCourses}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {analyticsData.completedCourses} completados
              </Typography>
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
                {analyticsData.totalCertificates.toLocaleString()}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Emitidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardHeader
              avatar={<TrendingUpIcon color='info' />}
              title='Tasa de Finalización'
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
                {analyticsData.averageCompletionRate}%
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Cursos */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title='Top Cursos por Rendimiento' />
            <CardContent>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Curso</TableCell>
                      <TableCell align='right'>Estudiantes</TableCell>
                      <TableCell align='right'>Finalización</TableCell>
                      <TableCell align='right'>Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.topCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {course.title}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {course.enrolledStudents}
                        </TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={`${course.completionRate}%`}
                            color={
                              course.completionRate > 90 ? 'success' : 'warning'
                            }
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end'
                            }}
                          >
                            <StarIcon
                              sx={{
                                fontSize: 'small',
                                color: 'warning.main',
                                mr: 0.5
                              }}
                            />
                            {course.rating}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Rendimiento por Categoría */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title='Rendimiento por Categoría' />
            <CardContent>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell align='right'>Cursos</TableCell>
                      <TableCell align='right'>Rating Prom.</TableCell>
                      <TableCell align='right'>Inscripciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.coursePerformance.map((category) => (
                      <TableRow key={category.category}>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {category.category}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {category.totalCourses}
                        </TableCell>
                        <TableCell align='right'>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end'
                            }}
                          >
                            <StarIcon
                              sx={{
                                fontSize: 'small',
                                color: 'warning.main',
                                mr: 0.5
                              }}
                            />
                            {category.averageRating}
                          </Box>
                        </TableCell>
                        <TableCell align='right'>
                          {category.totalEnrollments.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Crecimiento de Usuarios */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Crecimiento de Usuarios (Últimos 6 meses)' />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell align='right'>Nuevos Usuarios</TableCell>
                      <TableCell align='right'>Usuarios Activos</TableCell>
                      <TableCell align='right'>Crecimiento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.userGrowth.map((data, index) => (
                      <TableRow key={data.month}>
                        <TableCell>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {data.month}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={data.newUsers}
                            color='primary'
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='right'>{data.activeUsers}</TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={`${((data.activeUsers / (index > 0 ? analyticsData.userGrowth[index - 1].activeUsers : data.activeUsers)) * 100 - 100).toFixed(1)}%`}
                            color={
                              index > 0 &&
                              data.activeUsers >
                                analyticsData.userGrowth[index - 1].activeUsers
                                ? 'success'
                                : 'default'
                            }
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LmsAnalytics
