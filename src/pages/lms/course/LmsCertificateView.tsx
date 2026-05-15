import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  TextField,
  InputAdornment,
  Tooltip,
  Avatar,
  LinearProgress,
  Snackbar
} from '@mui/material'
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  EmojiEvents as CertificateIcon,
  Verified as VerifiedIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUserCertificates, useCertificate, useDownloadCertificate } from '../../../hooks/useLms'
import { lmsService, type Certificate as ApiCertificate } from '../../../services/lmsService'

interface Certificate extends ApiCertificate {
  certificateNumber: string
  courseTitle: string
  courseDescription: string
  issuedAt: string
  pdfPath: string
  verification_url: string
  course_name: string
  user_name: string
  completion_date: string
  template_name: string
  userName: string
  certificateData: {
    userName?: string
    courseTitle?: string
    completionDate?: string
    certificateNumber?: string
    courseDuration?: number
    instructorName?: string
    organizationName?: string
  }
  course_thumbnail?: string
  course_category?: string
}

interface CertificateVerification {
  isValid: boolean
  certificate?: Certificate
  error?: string
}

const normalizeCertificate = (certificate: ApiCertificate | Certificate): Certificate => ({
  ...certificate,
  certificateNumber: (certificate as Certificate).certificateNumber || certificate.certificate_number || '',
  courseTitle: (certificate as Certificate).courseTitle || (certificate as Certificate).course_name || (certificate as Certificate).certificateData?.courseTitle || '',
  courseDescription: (certificate as Certificate).courseDescription || '',
  issuedAt: (certificate as Certificate).issuedAt || certificate.issued_at || certificate.created_at || '',
  pdfPath: (certificate as Certificate).pdfPath || certificate.file_url || '',
  verification_url: (certificate as Certificate).verification_url || certificate.verificationUrl || '',
  course_name: (certificate as Certificate).course_name || (certificate as Certificate).courseTitle || (certificate as Certificate).certificateData?.courseTitle || '',
  user_name: (certificate as Certificate).user_name || (certificate as Certificate).userName || (certificate as Certificate).certificateData?.userName || 'Usuario',
  completion_date: (certificate as Certificate).completion_date || (certificate as Certificate).certificateData?.completionDate || certificate.issued_at || certificate.created_at || '',
  template_name: (certificate as Certificate).template_name || 'Certificado',
  userName: (certificate as Certificate).userName || (certificate as Certificate).user_name || (certificate as Certificate).certificateData?.userName || 'Usuario',
  certificateData: (certificate as Certificate).certificateData || {}
})

const getOrganizationName = (certificate?: Certificate | null) =>
  certificate?.certificateData?.organizationName || 'MMCS Learning Management System'

const getCourseDurationLabel = (certificate?: Certificate | null) => {
  const duration = certificate?.certificateData?.courseDuration

  if (!duration || duration <= 0) {
    return 'Duración no registrada'
  }

  return `${duration} minuto${duration === 1 ? '' : 's'}`
}

const LmsCertificateView: React.FC = () => {
  const { certificateId, certificateNumber: certificateNumberParam } = useParams<{ certificateId: string; certificateNumber: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const certificateIdNumber = certificateId ? Number(certificateId) : undefined
  const verificationParam = certificateNumberParam || searchParams.get('verify') || ''
  const isAuthenticated = localStorage.getItem('accessToken') !== null
  const isPublicVerificationMode = Boolean(verificationParam && !certificateId)
  const hasAutoVerified = useRef(false)

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [verificationNumber, setVerificationNumber] = useState(verificationParam)
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode] = useState<'single' | 'gallery'>(certificateId ? 'single' : 'gallery')
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  // Fetch user certificates or single certificate
  const { data: userCertificatesData, isLoading: isLoadingCertificates } = useUserCertificates(undefined, {
    enabled: isAuthenticated && !certificateId && !isPublicVerificationMode
  })
  const { data: singleCertificate, isLoading: isLoadingSingle } = useCertificate(
    certificateIdNumber ?? 0,
    { enabled: !!certificateId && isAuthenticated }
  )
  const downloadCertificateMutation = useDownloadCertificate()

  const loading = isLoadingCertificates || isLoadingSingle || downloadCertificateMutation.isLoading
  const certificate = useMemo(
    () => (viewMode === 'single'
      ? (singleCertificate ? normalizeCertificate(singleCertificate) : null)
      : selectedCertificate),
    [selectedCertificate, singleCertificate, viewMode]
  )
  const userCertificates = useMemo(
    () => (userCertificatesData || []).map(normalizeCertificate),
    [userCertificatesData]
  )

  const handleDownloadCertificate = async (certificateId: number) => {
    try {
      await downloadCertificateMutation.mutateAsync(certificateId)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      showSnackbar('No se pudo descargar el certificado.', 'error')
    }
  }

  const handlePrintCertificate = () => {
    window.print()
  }

  const handleShareCertificate = (cert: Certificate) => {
    setSelectedCertificate(cert)
    setIsShareDialogOpen(true)
  }

  const handleVerifyCertificate = async () => {
    if (!verificationNumber.trim()) return

    try {
      const result = await lmsService.verifyCertificate(verificationNumber)
      setVerificationResult({
        ...result,
        certificate: result.certificate ? normalizeCertificate(result.certificate) : undefined
      })
    } catch (error) {
      console.error('Error verifying certificate:', error)
      setVerificationResult({
        isValid: false,
        error: 'Error al verificar el certificado'
      })
    }
  }

  const copyVerificationLink = async (verificationUrl?: string) => {
    if (!verificationUrl) {
      showSnackbar('Este certificado aún no tiene un enlace de verificación disponible.', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(verificationUrl)
      showSnackbar('Enlace de verificación copiado.')
    } catch (error) {
      showSnackbar('No se pudo copiar el enlace.', 'error')
    }
  }

  useEffect(() => {
    if (!verificationParam) {
      return
    }

    setVerificationNumber(verificationParam)
    setIsVerificationDialogOpen(true)

    if (!hasAutoVerified.current) {
      hasAutoVerified.current = true
      void lmsService.verifyCertificate(verificationParam)
        .then((result) => {
          setVerificationResult({
            ...result,
            certificate: result.certificate ? normalizeCertificate(result.certificate) : undefined
          })
        })
        .catch(() => {
          setVerificationResult({
            isValid: false,
            error: 'Error al verificar el certificado'
          })
        })
    }
  }, [verificationParam])

  const generateCertificateHtml = (cert: Certificate) => {
    return `
      <div style="width: 800px; min-height: 600px; box-sizing: border-box; border: 8px solid #0f766e; padding: 48px; font-family: Georgia, 'Times New Roman', serif; text-align: center; background: linear-gradient(135deg, #fdfcf7 0%, #f1f5f9 100%); margin: 0 auto; position: relative; overflow: hidden;">
        <div style="position: absolute; inset: 16px; border: 1px solid rgba(15,118,110,0.18);"></div>
        <div style="position: relative; z-index: 1;">
          <p style="letter-spacing: 0.4em; text-transform: uppercase; color: #0f766e; font-size: 12px; margin: 0 0 16px;">${getOrganizationName(cert)}</p>
          <h1 style="color: #0f172a; margin: 0 0 10px; font-size: 38px; font-weight: 700;">Certificado de Finalización</h1>
          <p style="font-size: 17px; color: #475569; margin-bottom: 40px;">Reconocimiento oficial por completar satisfactoriamente esta experiencia de aprendizaje.</p>
          <p style="font-size: 18px; margin-bottom: 8px; color: #334155;">Se certifica que</p>
          <h2 style="color: #111827; font-size: 30px; margin: 18px auto; padding-bottom: 14px; border-bottom: 2px solid rgba(15,118,110,0.35); width: fit-content; max-width: 100%;">${cert.certificateData?.userName || 'Usuario'}</h2>
          <p style="font-size: 18px; margin: 0; color: #334155;">ha completado el curso</p>
          <h3 style="color: #0f766e; font-size: 26px; margin: 20px 0 12px;">${cert.certificateData?.courseTitle || cert.courseTitle}</h3>
          <p style="font-size: 15px; color: #64748b; margin-bottom: 28px;">${cert.courseDescription || 'Curso certificado dentro del entorno de aprendizaje MMCS.'}</p>
          <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin: 36px 0; color: #334155;">
            <div>
              <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px; color: #64748b;">Finalización</p>
              <p style="font-size: 16px; margin: 0;">${cert.certificateData?.completionDate || new Date(cert.issuedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px; color: #64748b;">Duración</p>
              <p style="font-size: 16px; margin: 0;">${getCourseDurationLabel(cert)}</p>
            </div>
            <div>
              <p style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px; color: #64748b;">Certificado</p>
              <p style="font-size: 16px; margin: 0;">${cert.certificateData?.certificateNumber || cert.certificateNumber}</p>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 32px; margin-top: 56px; align-items: flex-end;">
            <div style="flex: 1; text-align: left;">
              <p style="margin: 0 0 8px; color: #0f766e; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;">Verificación pública</p>
              <p style="margin: 0; color: #475569; font-size: 13px; word-break: break-word;">${cert.verification_url || 'Disponible desde el panel LMS'}</p>
            </div>
            <div style="width: 220px; border-top: 1px solid #334155; padding-top: 10px;">
              <p style="font-size: 14px; margin: 0; color: #0f172a;">Firma autorizada</p>
              <p style="font-size: 12px; margin: 4px 0 0; color: #64748b;">${getOrganizationName(cert)}</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  const filteredCertificates = userCertificates.filter(cert =>
    cert.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const shareOptions = [
    {
      name: 'Copiar enlace',
      icon: <LinkIcon />,
      action: async () => {
        await copyVerificationLink(certificate?.verification_url)
      }
    },
    {
      name: 'Email',
      icon: <EmailIcon />,
      action: () => {
        const subject = `Mi certificado: ${certificate?.course_name}`
        const body = `He completado el curso "${certificate?.course_name}" y obtenido mi certificado. Puedes verificarlo en: ${certificate?.verification_url}`
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      }
    }
  ]

  if (loading && viewMode === 'single') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Cargando certificado...</Typography>
      </Box>
    )
  }

  if (isPublicVerificationMode) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Verificación de Certificado
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Este enlace permite validar la autenticidad del certificado sin iniciar sesión.
        </Alert>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Número de Certificado"
              value={verificationNumber}
              onChange={(e) => setVerificationNumber(e.target.value)}
              placeholder="Ej: MMCS-2026-ABCD1234"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VerifiedIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleVerifyCertificate}
            disabled={!verificationNumber.trim()}
            sx={{ mb: 3 }}
          >
            Verificar Certificado
          </Button>

          {verificationResult && (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: verificationResult.isValid ? 'success.main' : 'error.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {verificationResult.isValid ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Typography variant="h6" color={verificationResult.isValid ? 'success.main' : 'error.main'}>
                  {verificationResult.isValid ? 'Certificado válido' : 'Certificado no válido'}
                </Typography>
              </Box>

              {verificationResult.isValid && verificationResult.certificate ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Estudiante</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {verificationResult.certificate.userName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Curso</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {verificationResult.certificate.courseTitle}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Organización</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {getOrganizationName(verificationResult.certificate)}
                    </Typography>
                  </Grid>
                  {verificationResult.certificate.courseDescription && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Descripción del curso</Typography>
                      <Typography variant="body2">
                        {verificationResult.certificate.courseDescription}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Fecha de finalización</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {verificationResult.certificate.certificateData?.completionDate
                        ? new Date(verificationResult.certificate.certificateData.completionDate).toLocaleDateString('es-ES')
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">Fecha de emisión</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {verificationResult.certificate.issuedAt
                        ? new Date(verificationResult.certificate.issuedAt).toLocaleDateString('es-ES')
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="error">
                  {verificationResult.error || 'El certificado no pudo ser verificado.'}
                </Typography>
              )}
            </Paper>
          )}
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {viewMode === 'single' && certificate ? (
        // Single Certificate View
        <Box>
          <Alert
            severity='success'
            sx={{ mb: 3 }}
          >
            Tu certificado ya está listo para descargar, compartir o verificar con un enlace público.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" component="h1">
                Certificado de Finalización
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                <Chip label={getOrganizationName(certificate)} color='success' variant='outlined' />
                <Chip label={getCourseDurationLabel(certificate)} variant='outlined' />
                <Chip label={certificate.certificateNumber} variant='outlined' />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintCertificate}
              >
                Imprimir
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => handleShareCertificate(certificate)}
              >
                Compartir
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadCertificate(certificate.id)}
              >
                Descargar PDF
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateCertificateHtml(certificate)
                  }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card sx={{ mb: 3 }}>
                <CardHeader
                  title="Información del Certificado"
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CertificateIcon />
                    </Avatar>
                  }
                />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Estudiante"
                        secondary={certificate.user_name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Curso"
                        secondary={certificate.courseTitle}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Duración del curso"
                        secondary={getCourseDurationLabel(certificate)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Fecha de finalización"
                        secondary={new Date(certificate.completion_date).toLocaleDateString('es-ES')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Fecha de emisión"
                        secondary={certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('es-ES') : 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CertificateIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Organización"
                        secondary={getOrganizationName(certificate)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Número de certificado"
                        secondary={certificate.certificateNumber}
                      />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="success.main">
                      Certificado verificado
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Este certificado puede ser verificado usando el número: {certificate.certificateNumber}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Compartir y Verificar" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Usa este enlace cuando necesites compartir el certificado o validar su autenticidad.
                  </Typography>
                  <Alert severity='info' sx={{ mb: 2 }}>
                    El enlace público permite verificar este certificado sin iniciar sesión.
                  </Alert>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300', mb: 2 }}>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {certificate.verification_url}
                    </Typography>
                  </Paper>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<LinkIcon />}
                    sx={{ mb: 1 }}
                    onClick={() => copyVerificationLink(certificate.verification_url)}
                  >
                    Copiar enlace de verificación
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VerifiedIcon />}
                    onClick={() => setIsVerificationDialogOpen(true)}
                  >
                    Verificar Certificado
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : (
        // Certificate Gallery View
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Mis Certificados
            </Typography>
            <Button
              variant="outlined"
              startIcon={<VerifiedIcon />}
              onClick={() => setIsVerificationDialogOpen(true)}
            >
              Verificar Certificado
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar certificados por nombre del curso o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography>Cargando certificados...</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredCertificates.map((cert) => (
                <Grid item xs={12} md={6} lg={4} key={cert.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'divider',
                      background:
                        'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 42%)'
                    }}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CertificateIcon color="primary" />
                          <Typography variant="h6" component="div" noWrap>
                            {cert.courseTitle}
                          </Typography>
                        </Box>
                      }
                      action={
                        <Chip
                          label={`Emitido ${new Date(cert.issuedAt).toLocaleDateString('es-ES')}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      }
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Certificado N°: {cert.certificateNumber}
                      </Typography>

                      {cert.courseDescription && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {cert.courseDescription}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip size='small' label={getOrganizationName(cert)} variant='outlined' />
                        <Chip size='small' label={getCourseDurationLabel(cert)} variant='outlined' />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Organización:</strong> {getOrganizationName(cert)}
                      </Typography>

                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Duración:</strong> {getCourseDurationLabel(cert)}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Completado:</strong> {new Date(cert.completion_date).toLocaleDateString('es-ES')}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Emitido:</strong> {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('es-ES') : 'N/A'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Ver certificado">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/lms/certificate/${cert.id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar PDF">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadCertificate(cert.id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Compartir">
                          <IconButton
                            size="small"
                            onClick={() => handleShareCertificate(cert)}
                          >
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {filteredCertificates.length === 0 && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CertificateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm ? 'No se encontraron certificados' : 'No tienes certificados aún'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Completa cursos para obtener tus primeros certificados'
                }
              </Typography>
              {!searchTerm && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => navigate('/lms')}>
                    Volver al LMS
                  </Button>
                  <Button variant="outlined" onClick={() => setIsVerificationDialogOpen(true)}>
                    Verificar un certificado
                  </Button>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}   
   {/* Share Certificate Dialog */}
      <Dialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Compartir Certificado
            </Typography>
            <IconButton onClick={() => setIsShareDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Comparte el enlace de verificación o envíalo por correo cuando necesites validar tu
              certificado con otra persona.
            </Typography>
          </Alert>

          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant='subtitle2'>{certificate?.courseTitle}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {certificate?.certificateNumber} · {getOrganizationName(certificate)}
            </Typography>
          </Paper>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Enlace de verificación:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {certificate?.verification_url}
              </Typography>
            </Paper>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Opciones disponibles:
          </Typography>
          <Grid container spacing={2}>
            {shareOptions.map((option) => (
              <Grid item xs={6} key={option.name}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={option.icon}
                  onClick={option.action}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {option.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Certificate Verification Dialog */}
      <Dialog
        open={isVerificationDialogOpen}
        onClose={() => {
          setIsVerificationDialogOpen(false)
          setVerificationResult(null)
          setVerificationNumber('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Verificar Certificado
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Ingresa el número de certificado para verificar su autenticidad y validez.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Número de Certificado"
              value={verificationNumber}
              onChange={(e) => setVerificationNumber(e.target.value)}
              placeholder="Ej: MMCS-2026-ABCD1234"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VerifiedIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleVerifyCertificate}
            disabled={!verificationNumber.trim() || loading}
            fullWidth
            sx={{ mb: 3 }}
          >
            {loading ? 'Verificando...' : 'Verificar Certificado'}
          </Button>

          {verificationResult && (
            <Paper sx={{ p: 3, border: '1px solid', borderColor: verificationResult.isValid ? 'success.main' : 'error.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {verificationResult.isValid ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Typography variant="h6" color={verificationResult.isValid ? 'success.main' : 'error.main'}>
                  {verificationResult.isValid ? 'Certificado Válido' : 'Certificado No Válido'}
                </Typography>
              </Box>

              {verificationResult.isValid && verificationResult.certificate ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Este certificado es auténtico y ha sido emitido por nuestra plataforma.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        Estudiante:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {verificationResult.certificate.userName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        Curso:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {verificationResult.certificate.courseTitle}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        Fecha de finalización:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {verificationResult.certificate.certificateData?.completionDate ? new Date(verificationResult.certificate.certificateData.completionDate).toLocaleDateString('es-ES') : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        Fecha de emisión:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {new Date(verificationResult.certificate.issuedAt).toLocaleDateString('es-ES')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        navigate(`/lms/certificate/${verificationResult.certificate?.id}`)
                        setIsVerificationDialogOpen(false)
                      }}
                    >
                      Ver Certificado
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => verificationResult.certificate && handleDownloadCertificate(verificationResult.certificate.id)}
                    >
                      Descargar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="error">
                  {verificationResult.error || 'El certificado no pudo ser verificado.'}
                </Typography>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsVerificationDialogOpen(false)
              setVerificationResult(null)
              setVerificationNumber('')
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LmsCertificateView
