import { Add } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  Select,
  Typography
} from '@mui/material'
import React from 'react'

import { CustomerLmsCoursesResponse } from './types'

interface LmsCoursesTabProps {
  customerLmsCourses?: CustomerLmsCoursesResponse
  isLoadingCustomerLmsCourses: boolean
  selectedLmsCourseId: string
  setSelectedLmsCourseId: (courseId: string) => void
  handleAssignLmsCourse: () => void
  handleRemoveLmsCourse: (courseId: number) => void
}

/** Cursos LMS visibles para el cliente y asignación de cursos específicos. */
const LmsCoursesTab: React.FC<LmsCoursesTabProps> = ({
  customerLmsCourses,
  isLoadingCustomerLmsCourses,
  selectedLmsCourseId,
  setSelectedLmsCourseId,
  handleAssignLmsCourse,
  handleRemoveLmsCourse
}) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Cursos LMS del cliente
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Gestiona los cursos LMS visibles para esta empresa. Los cursos abiertos
      para todos los clientes se muestran aquí, pero no se pueden modificar
      manualmente.
    </Typography>

    <Alert severity='info' sx={{ mb: 3 }}>
      Desde esta pestaña solo se pueden asignar o quitar cursos habilitados para
      clientes específicos.
    </Alert>

    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-end',
        mb: 3,
        flexWrap: 'wrap'
      }}
    >
      <FormControl sx={{ minWidth: 320 }}>
        <InputLabel htmlFor='customer-lms-course-select'>
          Asignar curso específico
        </InputLabel>
        <Select
          native
          value={selectedLmsCourseId}
          label='Asignar curso específico'
          inputProps={{ id: 'customer-lms-course-select' }}
          onChange={(event) =>
            setSelectedLmsCourseId(String(event.target.value))
          }
        >
          <option value=''></option>
          {(customerLmsCourses?.assignableCourses || []).map((course) => (
            <option key={course.id} value={String(course.id)}>
              {course.title} ({course.status})
            </option>
          ))}
        </Select>
      </FormControl>
      <Button
        variant='contained'
        startIcon={<Add />}
        onClick={handleAssignLmsCourse}
        disabled={!selectedLmsCourseId}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Asignar curso
      </Button>
    </Box>

    {isLoadingCustomerLmsCourses ? (
      <Box display='flex' justifyContent='center' alignItems='center' py={6}>
        <CircularProgress />
      </Box>
    ) : (customerLmsCourses?.visibleCourses || []).length === 0 ? (
      <Typography color='text.secondary'>
        Esta empresa no tiene cursos LMS visibles en este momento.
      </Typography>
    ) : (
      <Grid container spacing={2}>
        {(customerLmsCourses?.visibleCourses || []).map((course) => (
          <Grid item xs={12} md={6} key={course.id}>
            <Card
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                height: '100%'
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5
                  }}
                >
                  <Box>
                    <Typography variant='subtitle1' fontWeight={700}>
                      {course.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {course.description || 'Sin descripcion'}
                    </Typography>
                  </Box>
                  {!course.all_clients && (
                    <Button
                      color='error'
                      variant='outlined'
                      onClick={() => handleRemoveLmsCourse(course.id)}
                      sx={{ textTransform: 'none', height: 'fit-content' }}
                    >
                      Quitar
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={
                      course.status === 'published'
                        ? 'Publicado'
                        : course.status === 'draft'
                          ? 'Borrador'
                          : 'Archivado'
                    }
                    size='small'
                    variant='outlined'
                  />
                  <Chip
                    label={
                      course.all_clients
                        ? 'Todos los clientes'
                        : 'Asignado por empresa'
                    }
                    size='small'
                    color={course.all_clients ? 'success' : 'primary'}
                  />
                  <Chip
                    label={
                      course.audience === 'both'
                        ? 'Internos y clientes'
                        : 'Solo clientes'
                    }
                    size='small'
                    variant='outlined'
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
)

export default LmsCoursesTab
