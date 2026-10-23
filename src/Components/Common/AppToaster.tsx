import React from 'react'
import { Toaster } from 'react-hot-toast'

/**
 * Contenedor de avisos breves ("Enlace enviado", "No se pudo guardar") con el
 * estilo del sistema de diseño: tarjeta blanca con borde gris, radio de 12 px,
 * sombra suave e ícono turquesa en éxito y rojo en error. Se usa con
 * `toast.success()` / `toast.error()` de `react-hot-toast`; los mensajes son
 * una frase corta, sin emojis ni puntos suspensivos.
 *
 * Móntalo una vez por pantalla. Es el toast de las pantallas de acceso
 * (login, recuperar y crear contraseña); en el resto de la app migra a este
 * componente en lugar de dejar `<Toaster />` con el estilo por defecto.
 */
const AppToaster: React.FC = () => (
  <Toaster
    position='top-right'
    toastOptions={{
      duration: 4000,
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow:
          '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        padding: '12px 16px',
        fontSize: '14px',
        lineHeight: 1.5,
        maxWidth: '420px'
      },
      success: {
        iconTheme: { primary: '#00BFA5', secondary: '#ffffff' }
      },
      error: {
        iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
        duration: 5000
      }
    }}
  />
)

export default AppToaster
