import React, { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  useSaveSignatory,
  useSignatories
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import SignaturePad, { SignaturePadHandle } from './SignaturePad'
import SignatoryImage from './SignatoryImage'
import { ReleaseSignatory } from './ReleaseCertificates.types'
import { brand, neutral } from 'src/theme/designTokens'

const MAX_SIZE = 1024 * 1024

type Mode = 'draw' | 'upload'

interface ReleaseSignatoriesDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Registro de firmas: la firma de cada persona del laboratorio (analista, coordinador, director, metrólogos…) con su
 * nombre y su cargo. Se dibuja o se sube como imagen; al firmar un certificado se elige cuáles van.
 */
const ReleaseSignatoriesDialog: React.FC<ReleaseSignatoriesDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: signatories = [] } = useSignatories(open, true)
  const save = useSaveSignatory()
  const inputRef = useRef<HTMLInputElement>(null)
  const padRef = useRef<SignaturePadHandle>(null)
  const [editing, setEditing] = useState<ReleaseSignatory | 'new' | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [mode, setMode] = useState<Mode>('draw')
  const [hasStroke, setHasStroke] = useState(false)
  const [picked, setPicked] = useState<File | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const reset = () => {
    setEditing(null)
    setName('')
    setRole('')
    setPicked(null)
    setHasStroke(false)
    setProblem(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const startEdit = (signatory: ReleaseSignatory | 'new') => {
    reset()
    setEditing(signatory)
    if (signatory !== 'new') {
      setName(signatory.name)
      setRole(signatory.role ?? '')
    }
  }

  const choose = (file: File | undefined) => {
    if (!file) return
    setProblem(null)
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setProblem('La firma debe ser una imagen PNG o JPG.')
      return
    }
    if (file.size > MAX_SIZE) {
      setProblem('La imagen no puede pesar más de 1 MB.')
      return
    }
    setPicked(file)
  }

  const done = (message: string) => {
    notify.success(message)
    reset()
  }

  const failed = (error: unknown) =>
    notify.error(
      'No se pudo guardar la firma',
      getApiErrorReason(error) ?? undefined
    )

  const submit = async () => {
    if (!editing) return
    setProblem(null)
    if (!name.trim()) {
      setProblem('Escribe el nombre de la persona.')
      return
    }
    let file: File | undefined
    if (mode === 'upload') {
      file = picked ?? undefined
    } else if (hasStroke) {
      const blob = await padRef.current?.toBlob()
      if (blob) file = new File([blob], 'firma.png', { type: 'image/png' })
    }
    if (file && file.size > MAX_SIZE) {
      setProblem('El dibujo es demasiado pesado; hazlo más pequeño.')
      return
    }
    if (editing === 'new') {
      if (!file) {
        setProblem('Dibuja la firma o sube la imagen.')
        return
      }
      save.mutate(
        { name, role, file },
        { onSuccess: () => done('Firma agregada'), onError: failed }
      )
      return
    }
    save.mutate(
      { id: editing.id, name, role, file },
      { onSuccess: () => done('Firma actualizada'), onError: failed }
    )
  }

  const toggleActive = (signatory: ReleaseSignatory) =>
    save.mutate(
      {
        id: signatory.id,
        name: signatory.name,
        role: signatory.role ?? '',
        active: !signatory.active
      },
      {
        onSuccess: () =>
          notify.success(
            signatory.active ? 'Firma desactivada' : 'Firma activada'
          ),
        onError: failed
      }
    )

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
      fullScreen={fullScreen}
    >
      <DialogTitle>Firmas del laboratorio</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          La firma de cada persona con su nombre y su cargo. Al firmar un
          certificado eliges cuáles van en el documento. Cada uso queda
          registrado en el historial.
        </Typography>

        {!editing && (
          <>
            {signatories.length === 0 && (
              <Alert severity='info' sx={{ mb: 2 }}>
                Aún no hay firmas. Agrega la primera.
              </Alert>
            )}
            <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {signatories.map((signatory) => (
                <Box
                  component='li'
                  key={signatory.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1,
                    borderBottom: '1px solid #f1f5f9',
                    opacity: signatory.active ? 1 : 0.55
                  }}
                >
                  <Box
                    sx={{
                      width: 96,
                      height: 44,
                      border: `1px solid ${neutral.border}`,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: neutral.surface,
                      flexShrink: 0
                    }}
                  >
                    <SignatoryImage
                      id={signatory.id}
                      alt={`Firma de ${signatory.name}`}
                      sx={{ maxWidth: 88, maxHeight: 38 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='body2' fontWeight={600}>
                      {signatory.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {signatory.role ?? 'Sin cargo'}
                    </Typography>
                  </Box>
                  {!signatory.active && (
                    <Chip size='small' label='Inactiva' variant='outlined' />
                  )}
                  <Button size='small' onClick={() => startEdit(signatory)}>
                    Editar
                  </Button>
                  <Button
                    size='small'
                    color={signatory.active ? 'inherit' : 'primary'}
                    disabled={save.isLoading}
                    onClick={() => toggleActive(signatory)}
                  >
                    {signatory.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </Box>
              ))}
            </Box>
            <Button
              variant='outlined'
              sx={{ mt: 2 }}
              onClick={() => startEdit('new')}
            >
              Agregar firma
            </Button>
          </>
        )}

        {editing && (
          <>
            <TextField
              fullWidth
              size='small'
              label='Nombre de la persona'
              value={name}
              onChange={(event) => setName(event.target.value)}
              inputProps={{ maxLength: 120 }}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              size='small'
              label='Cargo (opcional)'
              value={role}
              onChange={(event) => setRole(event.target.value)}
              inputProps={{ maxLength: 120 }}
              sx={{ mb: 2 }}
            />
            {editing !== 'new' && (
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                sx={{ mb: 1 }}
              >
                Deja la imagen vacía si solo cambias el nombre o el cargo.
              </Typography>
            )}
            <Tabs
              value={mode}
              onChange={(_event, value: Mode) => {
                setMode(value)
                setProblem(null)
              }}
              sx={{
                mb: 2,
                '& .MuiTabs-indicator': { backgroundColor: brand.main },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
              }}
            >
              <Tab value='draw' label='Dibujar' />
              <Tab value='upload' label='Subir imagen' />
            </Tabs>
            {mode === 'draw' ? (
              <>
                <SignaturePad ref={padRef} onChange={setHasStroke} />
                <Button
                  sx={{ mt: 1 }}
                  size='small'
                  disabled={!hasStroke}
                  onClick={() => padRef.current?.clear()}
                >
                  Borrar y empezar de nuevo
                </Button>
              </>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type='file'
                  accept='image/png,image/jpeg'
                  hidden
                  onChange={(event) => {
                    choose(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                <Button
                  variant='outlined'
                  onClick={() => inputRef.current?.click()}
                >
                  {picked ? `Imagen: ${picked.name}` : 'Elegir imagen'}
                </Button>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  sx={{ mt: 0.5 }}
                >
                  PNG o JPG, fondo blanco o transparente, hasta 1 MB
                </Typography>
              </>
            )}
            {problem && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                {problem}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {editing ? (
          <>
            <Button onClick={reset} disabled={save.isLoading}>
              Cancelar
            </Button>
            <Button
              variant='contained'
              disabled={save.isLoading}
              onClick={() => void submit()}
              sx={{ bgcolor: brand.main, '&:hover': { bgcolor: brand.hover } }}
            >
              Guardar
            </Button>
          </>
        ) : (
          <Button onClick={close}>Cerrar</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseSignatoriesDialog
