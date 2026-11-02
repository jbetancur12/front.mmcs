import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  useMySignature,
  useSaveMySignature
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import SignaturePad, { SignaturePadHandle } from './SignaturePad'

const MAX_SIZE = 1024 * 1024

type Mode = 'draw' | 'upload'

interface ReleaseSignatureDialogProps {
  open: boolean
  onClose: () => void
}

/** Firma de quien firma: se dibuja o se sube como imagen, y se estampa en los certificados que firma. Es personal. */
const ReleaseSignatureDialog: React.FC<ReleaseSignatureDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const axiosPrivate = useAxiosPrivate()
  const { data: status } = useMySignature(open)
  const save = useSaveMySignature()
  const inputRef = useRef<HTMLInputElement>(null)
  const padRef = useRef<SignaturePadHandle>(null)
  const [mode, setMode] = useState<Mode>('draw')
  const [hasStroke, setHasStroke] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [picked, setPicked] = useState<File | null>(null)
  const [pickedUrl, setPickedUrl] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !status?.configured) return
    let url: string | null = null
    let cancelled = false
    axiosPrivate
      .get('/release-certificates/signature/image', { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return
        url = window.URL.createObjectURL(response.data)
        setCurrent(url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (url) window.URL.revokeObjectURL(url)
    }
    // Se vuelve a pedir cuando se abre o cuando se guarda una nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status?.configured, save.isSuccess])

  useEffect(() => {
    if (!picked) {
      setPickedUrl(null)
      return
    }
    const url = window.URL.createObjectURL(picked)
    setPickedUrl(url)
    return () => window.URL.revokeObjectURL(url)
  }, [picked])

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

  const close = () => {
    setPicked(null)
    setProblem(null)
    setHasStroke(false)
    onClose()
  }

  const send = (file: File) =>
    save.mutate(file, {
      onSuccess: () => {
        notify.success('Firma guardada')
        setPicked(null)
        padRef.current?.clear()
        setHasStroke(false)
      },
      onError: (error) =>
        notify.error(
          'No se pudo guardar la firma',
          getApiErrorReason(error) ?? undefined
        )
    })

  const submit = async () => {
    if (mode === 'upload') {
      if (picked) send(picked)
      return
    }
    const blob = await padRef.current?.toBlob()
    if (!blob) {
      setProblem('Dibuja tu firma antes de guardar.')
      return
    }
    if (blob.size > MAX_SIZE) {
      setProblem('El dibujo es demasiado pesado; hazlo más pequeño.')
      return
    }
    send(new File([blob], 'firma.png', { type: 'image/png' }))
  }

  const canSave = mode === 'draw' ? hasStroke : Boolean(picked)
  const preview = pickedUrl ?? current

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
      fullScreen={fullScreen}
    >
      <DialogTitle>Mi firma</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Esta firma se estampa en los certificados que firmas, junto a tu
          nombre y la fecha. Solo tú la ves.
        </Typography>

        {status?.configured && current && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='caption' color='text.secondary'>
              Firma guardada
            </Typography>
            <Box
              sx={{
                height: 80,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff'
              }}
            >
              <Box
                component='img'
                src={current}
                alt='Tu firma guardada'
                sx={{ maxWidth: '90%', maxHeight: 68 }}
              />
            </Box>
          </Box>
        )}

        <Tabs
          value={mode}
          onChange={(_event, value: Mode) => {
            setMode(value)
            setProblem(null)
          }}
          sx={{
            mb: 2,
            '& .MuiTabs-indicator': { backgroundColor: '#00BFA5' },
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
            <Box
              sx={{
                height: 140,
                border: '1px dashed #d1d5db',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff'
              }}
            >
              {pickedUrl || preview ? (
                <Box
                  component='img'
                  src={(pickedUrl ?? preview) as string}
                  alt='Vista previa de tu firma'
                  sx={{ maxWidth: '90%', maxHeight: 120 }}
                />
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  PNG o JPG, fondo blanco o transparente, hasta 1 MB
                </Typography>
              )}
            </Box>
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
              sx={{ mt: 2 }}
              variant='outlined'
              onClick={() => inputRef.current?.click()}
            >
              {picked ? 'Elegir otra imagen' : 'Elegir imagen'}
            </Button>
          </>
        )}
        {problem && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            {problem}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cerrar</Button>
        <Button
          variant='contained'
          disabled={!canSave || save.isLoading}
          onClick={submit}
          sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
        >
          Guardar firma
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseSignatureDialog
