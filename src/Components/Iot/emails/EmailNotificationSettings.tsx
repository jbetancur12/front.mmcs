import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState } from 'react'
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
import {
  useIotNotificationEmailMutations,
  useIotNotificationEmails
} from '@hooks/iot/useIotNotificationEmails'
import { notify } from 'src/utils/notify'
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
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success?: boolean
    fallbackUsed?: boolean
    emailConfig?: any
  } | null>(null)


  // Cargar la lista de emails de notificación
  const { data: emails = [], isLoading: emailsLoading } =
    useIotNotificationEmails(customerId, {
      onSuccess: () => setError(null),
      onError: (err) => {
        console.error('Error fetching emails:', err)
        setError(
          'No se pudieron cargar los correos electrónicos de notificación'
        )
      }
    })
  const { addEmail, removeEmail } = useIotNotificationEmailMutations(customerId)
  const loading = emailsLoading || addEmail.isLoading || removeEmail.isLoading

  // Manejar la adición de un nuevo email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación simple de email
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Por favor ingresa una dirección de correo electrónico válida')
      return
    }

    try {
      await addEmail.mutateAsync(email)
      setEmail('')
      setError(null)
      setSuccess('Correo electrónico añadido correctamente')

      notify.success(
        'Correo electrónico añadido',
        `El correo ${email} recibirá notificaciones de alarmas`
      )

      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error adding email:', err)
      setError('No se pudo añadir el correo electrónico')
    }
  }

  // Manejar la eliminación de un email
  const handleRemoveEmail = async (emailToRemove: number) => {
    try {
      await removeEmail.mutateAsync(emailToRemove)
      setError(null)
      setSuccess('Correo electrónico eliminado correctamente')

      notify.warning(
        'Correo electrónico eliminado',
        `${emailToRemove} ya no recibirá notificaciones`
      )

      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error removing email:', err)
      setError('No se pudo eliminar el correo electrónico')
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
        notify.success(
          'Correo de prueba enviado',
          response.fallbackUsed
            ? 'El correo se guardó como un archivo de texto (modo de respaldo)'
            : 'El correo se envió correctamente'
        )
      } else {
        notify.error('Error al enviar correo de prueba', response.message)
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
            <SignalLoader size='small' />
          </Box>
        ) : emails.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {emails.map((emailItem) => (
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
