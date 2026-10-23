import React, { useEffect, useState } from 'react'
import { Button, Stack, Typography } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
import type { SessionPrompt } from 'src/hooks/useSessions'
import SessionDeviceRow from './SessionDeviceRow'

interface ActiveSessionDialogProps {
  /** null = cerrado. */
  prompt: SessionPrompt | null
  loading: boolean
  /** Entra cerrando las sesiones escogidas. */
  onConfirm: (closeSessionIds: string[]) => void
  /** Entra sin cerrar nada; no se ofrece al llegar al tope. */
  onKeep: () => void
  onCancel: () => void
}

/**
 * Aviso del login cuando la cuenta ya tiene sesiones abiertas: el usuario
 * escoge cuáles cerrar. Al llegar al tope debe cerrar las suficientes para
 * que quede cupo; si no, puede entrar sin cerrar nada.
 */
const ActiveSessionDialog: React.FC<ActiveSessionDialogProps> = ({
  prompt,
  loading,
  onConfirm,
  onKeep,
  onCancel
}) => {
  const [selected, setSelected] = useState<string[]>([])

  // Preselección: todas las que están en uso; al llegar al tope, la más antigua
  // (la que menos se usó), para que un solo clic alcance.
  useEffect(() => {
    if (!prompt) return
    if (prompt.mode === 'active') {
      setSelected(prompt.sessions.map((session) => session.id))
      return
    }
    const oldest = [...prompt.sessions].sort(
      (a, b) =>
        new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime()
    )[0]
    setSelected(oldest ? [oldest.id] : [])
  }, [prompt])

  const isLimit = prompt?.mode === 'limit'
  const sessions = prompt?.sessions ?? []
  const limit = prompt?.limit ?? 0
  // Cupo: las que quedan abiertas más la nueva no pueden pasar del tope
  const mustClose = isLimit ? sessions.length - limit + 1 : 1

  const toggle = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    )

  return (
    <FormDialog
      open={prompt !== null}
      onClose={onCancel}
      title={
        isLimit
          ? 'Llegaste al máximo de sesiones'
          : 'Ya tienes una sesión abierta'
      }
      subtitle={
        isLimit
          ? `Tu cuenta permite ${limit} sesiones a la vez. Cierra ${
              mustClose === 1 ? 'una' : mustClose
            } para ingresar en este equipo.`
          : 'Escoge cuáles cerrar para ingresar en este equipo.'
      }
      submitLabel='Cerrar y entrar'
      onSubmit={() => onConfirm(selected)}
      submitDisabled={selected.length < (isLimit ? mustClose : 1)}
      loading={loading}
      extraActions={
        isLimit ? undefined : (
          <Button
            onClick={onKeep}
            disabled={loading}
            sx={{ color: '#00695c', textTransform: 'none', fontWeight: 600 }}
          >
            Mantenerlas e ingresar
          </Button>
        )
      }
    >
      <Stack spacing={1.5}>
        {sessions.map((session) => (
          <SessionDeviceRow
            key={session.id}
            deviceLabel={session.deviceLabel}
            ip={session.ip}
            lastSeenAt={session.lastSeenAt}
            select={{
              checked: selected.includes(session.id),
              onChange: (checked) => toggle(session.id, checked)
            }}
          />
        ))}
        <Typography variant='body2' color='text.secondary'>
          Las sesiones que cierres saldrán de la plataforma al instante.
          {isLimit
            ? ''
            : ' Si las mantienes, podrás trabajar en todos los equipos.'}
        </Typography>
      </Stack>
    </FormDialog>
  )
}

export default ActiveSessionDialog
