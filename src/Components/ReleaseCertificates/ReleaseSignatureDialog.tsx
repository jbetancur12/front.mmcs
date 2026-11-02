import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  useMySignature,
  useSaveMySignature
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

const MAX_SIZE = 1024 * 1024

interface ReleaseSignatureDialogProps {
  open: boolean
  onClose: () => void
}

/** Imagen de la firma de quien firma: se estampa en los certificados que firma. Es personal. */
const ReleaseSignatureDialog: React.FC<ReleaseSignatureDialogProps> = ({
  open,
  onClose
}) => {
  const axiosPrivate = useAxiosPrivate()
  const { data: status } = useMySignature(open)
  const save = useSaveMySignature()
  const inputRef = useRef<HTMLInputElement>(null)
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
    onClose()
  }

  const submit = () =>
    picked &&
    save.mutate(picked, {
      onSuccess: () => {
        notify.success('Firma guardada')
        setPicked(null)
      },
      onError: (error) =>
        notify.error(
          'No se pudo guardar la firma',
          getApiErrorReason(error) ?? undefined
        )
    })

  const preview = pickedUrl ?? current

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth='xs'>
      <DialogTitle>Mi firma</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Esta imagen se estampa en los certificados que firmas, junto a tu
          nombre y la fecha. Usa tu firma sobre fondo blanco o transparente (PNG
          o JPG, hasta 1 MB). Solo tú la ves.
        </Typography>
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
          {preview ? (
            <Box
              component='img'
              src={preview}
              alt='Vista previa de tu firma'
              sx={{ maxWidth: '90%', maxHeight: 120 }}
            />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Aún no has cargado tu firma
            </Typography>
          )}
        </Box>
        {problem && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            {problem}
          </Alert>
        )}
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
          {status?.configured || picked
            ? 'Elegir otra imagen'
            : 'Elegir imagen'}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cerrar</Button>
        <Button
          variant='contained'
          disabled={!picked || save.isLoading}
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
