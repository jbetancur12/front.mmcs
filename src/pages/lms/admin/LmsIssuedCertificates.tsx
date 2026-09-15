import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Paper,
  CircularProgress,
  InputAdornment
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { lmsService } from 'src/services/lmsService'

interface AdminCertificate {
  id: number
  certificateNumber: string
  courseId: number
  courseTitle: string | null
  issuedAt: string
  userName: string
  userEmail: string | null
  userId: number
  currentUserName: string | null
  currentUserEmail: string | null
  hiddenByReset: boolean
}

const LmsIssuedCertificates = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState<number | ''>('')
  const [submitted, setSubmitted] = useState<{ q: string; courseId?: number }>({ q: '' })

  const { data: coursesData } = useQuery(['lms-courses-certificate-filter'], () =>
    lmsService.getCourses({ limit: 200 })
  )
  const courses = coursesData?.courses || []

  const { data: certificates = [], isLoading } = useQuery<AdminCertificate[]>(
    ['lms-admin-certificates', submitted.q, submitted.courseId],
    () => lmsService.searchAdminCertificates({ q: submitted.q || undefined, courseId: submitted.courseId }),
    { keepPreviousData: true }
  )

  const handleSearch = () => {
    setSubmitted({ q: query, courseId: courseId === '' ? undefined : courseId })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleSearch()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Certificados emitidos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Busca por código, nombre o correo. El nombre mostrado es el registrado al emitir el certificado
        (puede diferir del nombre actual de la cuenta). Incluye certificados ocultos por reinicio de curso.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar"
          placeholder="Código, nombre o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ minWidth: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Curso</InputLabel>
          <Select
            label="Curso"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <MenuItem value="">Todos</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearch} sx={{ alignSelf: 'center' }}>
          Buscar
        </Button>
      </Box>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre (al emitir)</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Curso</TableCell>
                <TableCell>Emitido</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Sin resultados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {cert.userName}
                      </Typography>
                      {cert.currentUserName && cert.currentUserName !== cert.userName && (
                        <Typography variant="caption" color="text.secondary">
                          Cuenta actual: {cert.currentUserName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{cert.userEmail || '—'}</Typography>
                    </TableCell>
                    <TableCell>{cert.courseTitle || '—'}</TableCell>
                    <TableCell>
                      {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('es-ES') : '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{cert.certificateNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      {cert.hiddenByReset ? (
                        <Chip label="Oculto (reinicio)" size="small" color="warning" variant="outlined" />
                      ) : (
                        <Chip label="Vigente" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/lms/certificates/verify/${cert.certificateNumber}`)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default LmsIssuedCertificates
