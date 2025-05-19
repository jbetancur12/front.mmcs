import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import withReactContent from 'sweetalert2-react-content'
import Swal from 'sweetalert2'
import useAxiosPrivate from '@utils/use-axios-private'
// Utilidad para manejar peticiones API
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`)
  }
  return response.json()
}

// Importaciones originales

export const EmailNotificationSettings = ({
  customerId
}: {
  customerId?: number | string
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [email, setEmail] = useState('')
  const [emails, setEmails] = useState<any>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success?: boolean
    fallbackUsed?: boolean
    emailConfig?: any
  } | null>(null)

  const MySwal = withReactContent(Swal)

  // Cargar la lista de emails de notificación
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true)
        const response = await axiosPrivate.get(
          '/customers/emails-notifications/' + customerId
        )
        setEmails(response.data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching emails:', err)
        setError(
          'No se pudieron cargar los correos electrónicos de notificación'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchEmails()
  }, [])

  // Manejar la adición de un nuevo email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación simple de email
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Por favor ingresa una dirección de correo electrónico válida')
      return
    }

    try {
      setLoading(true)
      const response = await axiosPrivate.post(
        '/customers/emails-notifications/' + customerId,
        {
          email
        }
      )

      setEmails((prevEmails: any) => [...prevEmails, response.data])
      setEmail('')
      setError(null)
      setSuccess('Correo electrónico añadido correctamente')

      MySwal.fire({
        icon: 'success',
        title: 'Correo electrónico añadido',
        text: `El correo ${email} recibirá notificaciones de alarmas`,
        confirmButtonText: 'Aceptar'
      })

      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error adding email:', err)
      setError('No se pudo añadir el correo electrónico')
    } finally {
      setLoading(false)
    }
  }

  // Manejar la eliminación de un email
  const handleRemoveEmail = async (emailToRemove: number) => {
    try {
      setLoading(true)
      await axiosPrivate.delete(
        '/customers/emails-notifications/' + emailToRemove
      )

      setEmails((prevEmails: any) =>
        prevEmails.filter((emailItem: any) => emailItem.id !== emailToRemove)
      )
      setError(null)
      setSuccess('Correo electrónico eliminado correctamente')

      MySwal.fire({
        icon: 'warning',
        title: 'Correo electrónico eliminado',
        text: `${emailToRemove} ya no recibirá notificaciones`,
        confirmButtonText: 'Entendido'
      })

      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error removing email:', err)
      setError('No se pudo eliminar el correo electrónico')
    } finally {
      setLoading(false)
    }
  }

  // Manejar envío de correo de prueba
  const handleTestEmail = async () => {
    try {
      setTestLoading(true)
      setTestResult(null)

      const response = await apiRequest('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      setTestResult(response)

      if (response.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Correo de prueba enviado',
          text: response.fallbackUsed
            ? 'El correo se guardó como un archivo de texto (modo de respaldo)'
            : 'El correo se envió correctamente',
          confirmButtonText: 'Aceptar'
        })
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error al enviar correo de prueba',
          text: response.message,
          confirmButtonText: 'Aceptar'
        })
      }
    } catch (err) {
      console.error('Error sending test email:', err)
      setError('No se pudo enviar el correo de prueba')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <EmailIcon sx={{ mr: 1 }} /> Notificaciones por Correo Electrónico
      </Typography>

      <Typography variant='body2' color='text.secondary' paragraph>
        Configura las direcciones de correo electrónico que recibirán
        notificaciones cuando se active o desactive una alarma.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Formulario para añadir un nuevo email */}
      <Box
        component='form'
        onSubmit={handleAddEmail}
        sx={{ mb: 3, display: 'flex', gap: 2 }}
      >
        <TextField
          fullWidth
          label='Correo electrónico'
          variant='outlined'
          size='small'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='ejemplo@dominio.com'
          disabled={loading}
        />
        <Button
          type='submit'
          variant='contained'
          disabled={loading || !email}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Añadir'}
        </Button>
      </Box>

      {/* Mensajes de error y éxito */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity='success'
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Lista de emails configurados */}
      <Typography variant='subtitle2' gutterBottom>
        Correos configurados:
      </Typography>

      <Box sx={{ minHeight: '100px', mb: 3 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 2
            }}
          >
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant='body2'>Cargando...</Typography>
          </Box>
        ) : emails.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {emails.map((emailItem: any) => (
              <Chip
                key={emailItem.id}
                label={emailItem.email}
                onDelete={() => handleRemoveEmail(emailItem.id)}
                deleteIcon={<DeleteIcon />}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        ) : (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ fontStyle: 'italic', py: 2 }}
          >
            No hay correos electrónicos configurados. Añade al menos uno para
            recibir notificaciones.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Botón para enviar correo de prueba */}
      <Box sx={{ mb: 1 }}>
        <Typography variant='subtitle2' gutterBottom>
          Prueba de notificaciones:
        </Typography>

        <Button
          variant='outlined'
          startIcon={<SendIcon />}
          onClick={handleTestEmail}
          disabled={testLoading || emails.length === 0}
          sx={{ mb: 2 }}
        >
          {testLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Enviar correo de prueba'
          )}
        </Button>

        {testResult && (
          <Alert
            severity={testResult.success ? 'info' : 'error'}
            icon={
              testResult.success ? (
                testResult.fallbackUsed ? (
                  <ErrorIcon />
                ) : (
                  <CheckCircleIcon />
                )
              ) : (
                <ErrorIcon />
              )
            }
            sx={{ mb: 2 }}
          >
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
              {testResult.success
                ? testResult.fallbackUsed
                  ? 'El correo fue guardado como archivo (modo respaldo)'
                  : 'Correo enviado correctamente'
                : 'Error al enviar correo'}
            </Typography>

            {testResult.emailConfig && (
              <>
                <Typography variant='body2'>
                  Estado: {testResult.emailConfig.status}
                </Typography>
                {testResult.emailConfig.message && (
                  <Typography variant='body2'>
                    {testResult.emailConfig.message}
                  </Typography>
                )}
                <Typography variant='body2'>
                  Destinatarios:{' '}
                  {testResult.emailConfig.recipients?.join(', ') || 'Ninguno'}
                </Typography>
              </>
            )}

            {testResult.fallbackUsed && (
              <Typography variant='body2' sx={{ mt: 1, fontSize: '0.85rem' }}>
                Los correos están siendo guardados en archivos de texto debido a
                un problema con la conexión SMTP.
                <br />
                Para usar el envío de correos real, configura EMAIL_USER,
                EMAIL_PASS y EMAIL_SERVICE en las variables de entorno.
              </Typography>
            )}
          </Alert>
        )}
      </Box>
    </Paper>
  )
}

export default EmailNotificationSettings
