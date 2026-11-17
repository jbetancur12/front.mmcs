import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import {
  CalculateOutlined,
  PictureAsPdfOutlined,
  TaskAltOutlined,
  VerifiedOutlined
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import FormSection from 'src/Components/Common/FormSection'
import FormDateField from 'src/Components/Common/FormDateField'
import EmptyState from 'src/Components/Common/EmptyState'
import SignalLoader from 'src/Components/Common/SignalLoader'
import { brand, intent, neutral } from 'src/theme/designTokens'
import { confirmDialog } from 'src/utils/confirm'
import { notify } from 'src/utils/notify'
import { getApiErrorMessage } from 'src/utils/apiError'
import {
  CalcData,
  CalcPreview,
  cleanCalcData,
  openIssuedPdf,
  useCalcDefaults,
  useCalcTemplates,
  useCalcPreview,
  useIssueCalcCertificate,
  useIssuedCertificates,
  useVerifyIssuedCertificate,
  VerifyResult
} from 'src/hooks/useCertificateCalc'

const A4_WIDTH_PX = 794

type TextKey = {
  [K in keyof CalcData]: CalcData[K] extends string | number ? K : never
}[keyof CalcData]

// Se guarda lo escrito tal cual (con «-» o «1,» a medias); cleanCalcData lo convierte al enviar.
const toNumber = (raw: string): string => raw

interface WorkspaceProps {
  template: string
  onTemplateChange: (template: string) => void
}

const CalcWorkspace: React.FC<WorkspaceProps> = ({
  template,
  onTemplateChange
}) => {
  const templatesQuery = useCalcTemplates()
  const defaultsQuery = useCalcDefaults(template)
  const [data, setData] = useState<CalcData | null>(null)
  const [preview, setPreview] = useState<CalcPreview | null>(null)
  const [verifications, setVerifications] = useState<
    Record<string, VerifyResult>
  >({})
  const frameRef = useRef<HTMLIFrameElement>(null)
  const previewMutation = useCalcPreview(template)
  const issueMutation = useIssueCalcCertificate(template)
  const verifyMutation = useVerifyIssuedCertificate()
  const issuedQuery = useIssuedCertificates()

  useEffect(() => {
    if (defaultsQuery.data && !data) setData(defaultsQuery.data.data)
  }, [defaultsQuery.data, data])

  // Vista previa en vivo: el cálculo tarda decenas de milisegundos; se espera un momento tras el último cambio.
  const { mutate: requestPreview } = previewMutation
  useEffect(() => {
    if (!data) return undefined
    const timer = window.setTimeout(
      () =>
        requestPreview(cleanCalcData(data), {
          onSuccess: setPreview,
          onError: (error) =>
            notify.error(
              getApiErrorMessage(error, 'No se pudo calcular el certificado')
            )
        }),
      300
    )
    return () => window.clearTimeout(timer)
  }, [data, requestPreview])

  const fitPreview = useCallback(() => {
    const frame = frameRef.current
    const body = frame?.contentDocument?.body
    if (frame && body) {
      body.style.setProperty(
        'zoom',
        String(Math.min(1, (frame.clientWidth - 24) / A4_WIDTH_PX))
      )
    }
  }, [])

  const setText = (key: TextKey, value: string) =>
    setData((d) => (d ? { ...d, [key]: value } : d))
  const setNum = (key: keyof CalcData, raw: string) =>
    setData((d) => (d ? { ...d, [key]: toNumber(raw) } : d))
  const setPoint = (
    index: number,
    field: 'nominal' | 'tolerancia',
    raw: string
  ) =>
    setData((d) =>
      d
        ? {
            ...d,
            puntos: d.puntos.map((p, i) =>
              i === index ? { ...p, [field]: toNumber(raw) } : p
            )
          }
        : d
    )
  const setReading = (index: number, reading: number, raw: string) =>
    setData((d) =>
      d
        ? {
            ...d,
            puntos: d.puntos.map((p, i) =>
              i === index
                ? {
                    ...p,
                    lecturas: p.lecturas.map((l, j) =>
                      j === reading ? toNumber(raw) : l
                    )
                  }
                : p
            )
          }
        : d
    )

  const textField = (label: string, key: TextKey) => (
    <TextField
      key={key}
      label={label}
      size='small'
      value={data ? String(data[key] ?? '') : ''}
      onChange={(event) => setText(key, event.target.value)}
      fullWidth
    />
  )
  const numberField = (label: string, key: keyof CalcData) => (
    <TextField
      key={key}
      label={label}
      size='small'
      value={data ? String(data[key] ?? '') : ''}
      onChange={(event) => setNum(key, event.target.value)}
      inputProps={{ inputMode: 'decimal' }}
      fullWidth
    />
  )

  const blocking = preview?.blocking ?? []
  const canIssue =
    !!data &&
    !!preview &&
    blocking.length === 0 &&
    preview.calcErrors.length === 0 &&
    !issueMutation.isLoading

  const handleIssue = async () => {
    if (!data) return
    const { isConfirmed } = await confirmDialog({
      title: 'Emitir certificado',
      text: `Se generará el PDF de ${data.numero} y quedará guardado con sus datos de entrada, la versión de la plantilla y la del motor de cálculo.`,
      confirmLabel: 'Emitir'
    })
    if (!isConfirmed) return
    issueMutation.mutate(cleanCalcData(data), {
      onSuccess: (issued) => {
        notify.success('Certificado emitido', issued.numero)
        void openIssuedPdf(issued.id)
      },
      onError: (error) =>
        notify.error(
          getApiErrorMessage(error, 'No se pudo emitir el certificado')
        )
    })
  }

  const handleVerify = (id: string) =>
    verifyMutation.mutate(id, {
      onSuccess: (result) => setVerifications((v) => ({ ...v, [id]: result })),
      onError: (error) =>
        notify.error(getApiErrorMessage(error, 'No se pudo verificar'))
    })

  const units = Array.from(
    new Set([
      ...(defaultsQuery.data?.units ?? []),
      ...(data?.unidad ? [data.unidad] : [])
    ])
  )
  const readingCount = data?.puntos[0]?.lecturas.length ?? 0
  const showEquipmentAccuracy =
    defaultsQuery.data?.data.exactitudEquipoPct !== '' ||
    defaultsQuery.data?.data.exactitudEquipoAbs !== ''
  const noticeCount =
    blocking.length +
    (preview?.warnings.length ?? 0) +
    (preview?.calcErrors.length ?? 0)

  if (defaultsQuery.isLoading || !data) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <SignalLoader message='Cargando la plantilla…' />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Certificados calculados'
        subtitle='Demo: llene los datos, la plataforma calcula con la plantilla oficial del laboratorio y emite el PDF'
        icon={<CalculateOutlined />}
        actions={
          <>
            <TextField
              select
              size='small'
              label='Tipo de equipo'
              value={template}
              onChange={(event) => onTemplateChange(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              {(templatesQuery.data ?? []).map((t) => (
                <MenuItem key={t.key} value={t.key}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <Chip label='Demo' size='small' variant='outlined' />
            <Button
              variant='contained'
              startIcon={<PictureAsPdfOutlined />}
              disabled={!canIssue}
              onClick={handleIssue}
              sx={{
                bgcolor: brand.main,
                '&:hover': { bgcolor: brand.hover },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Emitir certificado (PDF)
            </Button>
          </>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            lg: 'minmax(380px, 5fr) minmax(0, 7fr)'
          },
          alignItems: 'start',
          // En pantallas anchas el formulario se desplaza dentro de su columna y la vista previa queda quieta
          // (position: sticky no sirve: el contenedor del layout tiene overflow y lo anula).
          height: { lg: 'calc(100vh - 210px)' },
          minHeight: { lg: 520 }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            minWidth: 0,
            alignContent: 'start',
            height: { lg: '100%' },
            overflowY: { lg: 'auto' },
            pr: { lg: 1 }
          }}
        >
          {noticeCount > 0 && (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {blocking.map((message) => (
                <Alert key={message} severity='error' variant='outlined'>
                  {message}
                </Alert>
              ))}
              {preview?.calcErrors.length ? (
                <Alert severity='error' variant='outlined'>
                  El cálculo produjo errores ({preview.calcErrors.join(', ')}):
                  revise los datos.
                </Alert>
              ) : null}
              {(preview?.warnings ?? []).map((message) => (
                <Alert key={message} severity='warning' variant='outlined'>
                  {message}
                </Alert>
              ))}
            </Box>
          )}

          <FormSection title='Certificado y equipo'>
            {textField('Número de certificado', 'numero')}
            {textField('Verificado por (firma)', 'verificadoPor')}
            {textField('Instrumento', 'instrumento')}
            {textField('Fabricante', 'fabricante')}
            {textField('Modelo', 'modelo')}
            {textField('Serie', 'serie')}
            {textField('Código interno', 'codigo')}
            {textField('Ubicación', 'ubicacion')}
            {textField('Rango de medida', 'rangoMedida')}
            {textField('Sitio de verificación', 'sitio')}
          </FormSection>

          <FormSection title='Cliente'>
            {textField('Solicitante', 'cliente')}
            {textField('Dirección', 'direccion')}
            {textField('Ciudad', 'ciudad')}
            <FormDateField
              label='Fecha de recepción'
              name='recepcion'
              value={data.recepcion}
              onChange={(value) => setText('recepcion', value)}
            />
            <FormDateField
              label='Fecha de verificación'
              name='calibracion'
              value={data.calibracion}
              onChange={(value) => setText('calibracion', value)}
            />
          </FormSection>

          <FormSection
            title='Patrón'
            description='En la versión definitiva saldría de un catálogo de patrones vigentes.'
          >
            {textField('Patrón', 'patronNombre')}
            {textField('Código interno', 'patronCodigo')}
            {textField('Serie', 'patronSerie')}
            {textField('Calibrado por', 'patronCalibradoPor')}
          </FormSection>

          <FormSection title='Mediciones'>
            <TextField
              select
              label='Unidad'
              size='small'
              value={data.unidad}
              onChange={(event) => setText('unidad', event.target.value)}
              fullWidth
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
            {numberField('Resolución del equipo', 'resolucionEquipo')}
            {numberField('Resolución del patrón', 'resolucionPatron')}
            {numberField('Exactitud del patrón (%)', 'exactitudPatronPct')}
            {numberField('Exactitud del patrón (abs.)', 'exactitudPatronAbs')}
            {showEquipmentAccuracy &&
              numberField('Exactitud del equipo (%)', 'exactitudEquipoPct')}
            {showEquipmentAccuracy &&
              numberField('Exactitud del equipo (abs.)', 'exactitudEquipoAbs')}
            {numberField('Temperatura inicial (°C)', 'tempInicial')}
            {numberField('Temperatura final (°C)', 'tempFinal')}
            {numberField('Humedad inicial (%)', 'humInicial')}
            {numberField('Humedad final (%)', 'humFinal')}
            <Box sx={{ gridColumn: '1 / -1', overflowX: 'auto' }}>
              <Box
                component='table'
                sx={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  minWidth: Math.max(520, (readingCount + 2) * 92),
                  '& th': {
                    color: neutral.textMuted,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'left',
                    pb: 0.5
                  },
                  '& td': { p: 0.25 },
                  // Campos de la tabla: más anchos y con menos relleno para que quepan cifras como 2002,5 sin cortarse
                  '& .MuiTextField-root': { width: '100%', minWidth: 84 },
                  '& .MuiOutlinedInput-input': {
                    px: 1,
                    py: 0.75,
                    fontSize: 13,
                    textAlign: 'right'
                  }
                }}
              >
                <thead>
                  <tr>
                    <th>Referencia</th>
                    {Array.from({ length: readingCount }, (_, i) => i + 1).map(
                      (n) => (
                        <th key={n}>Lectura {n}</th>
                      )
                    )}
                    <th>Tol. %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.puntos.map((point, index) => (
                    <tr key={index}>
                      <td>
                        <TextField
                          size='small'
                          value={point.nominal}
                          onChange={(event) =>
                            setPoint(index, 'nominal', event.target.value)
                          }
                          inputProps={{
                            inputMode: 'decimal',
                            'aria-label': `Referencia del punto ${index + 1}`
                          }}
                        />
                      </td>
                      {point.lecturas.map((reading, j) => (
                        <td key={j}>
                          <TextField
                            size='small'
                            value={reading}
                            onChange={(event) =>
                              setReading(index, j, event.target.value)
                            }
                            inputProps={{
                              inputMode: 'decimal',
                              'aria-label': `Lectura ${j + 1} del punto ${index + 1}`
                            }}
                          />
                        </td>
                      ))}
                      <td>
                        <TextField
                          size='small'
                          value={point.tolerancia}
                          onChange={(event) =>
                            setPoint(index, 'tolerancia', event.target.value)
                          }
                          inputProps={{
                            inputMode: 'decimal',
                            'aria-label': `Tolerancia del punto ${index + 1}`
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          </FormSection>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            height: { lg: '100%' },
            display: { lg: 'flex' },
            flexDirection: { lg: 'column' }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              color: neutral.textMuted,
              fontSize: 13
            }}
          >
            <Typography
              component='span'
              sx={{ fontWeight: 700, color: neutral.text }}
            >
              Vista previa
            </Typography>
            {preview && (
              <>
                <span>· calculado en {preview.ms} ms</span>
                <span>· plantilla {preview.templateVersion}</span>
              </>
            )}
          </Box>
          <Box
            component='iframe'
            ref={frameRef}
            title='Vista previa del certificado'
            sandbox='allow-same-origin'
            srcDoc={preview?.html ?? ''}
            onLoad={fitPreview}
            sx={{
              width: '100%',
              height: { xs: '70vh', lg: 'auto' },
              flex: { lg: 1 },
              minHeight: { lg: 0 },
              border: `1px solid ${neutral.border}`,
              borderRadius: '12px',
              bgcolor: neutral.surfaceHead
            }}
          />
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: { xs: 2, md: 3 },
          borderRadius: '16px',
          border: `1px solid ${neutral.border}`
        }}
      >
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: neutral.text }}>
          Emisiones guardadas
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Cada emisión guarda sus datos de entrada, la versión de la plantilla y
          la del motor. «Verificar» recalcula y comprueba que sale lo mismo.
        </Typography>
        {issuedQuery.data && issuedQuery.data.length > 0 ? (
          issuedQuery.data.map((item) => {
            const check = verifications[item.id]
            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  py: 1,
                  borderTop: `1px solid ${neutral.border}`
                }}
              >
                <Typography sx={{ fontWeight: 600, flex: '1 1 220px' }}>
                  {item.numero}
                  <Typography
                    component='span'
                    variant='caption'
                    color='text.secondary'
                    sx={{ ml: 1 }}
                  >
                    {(templatesQuery.data ?? []).find(
                      (t) => t.key === item.template
                    )?.name ?? item.template}
                  </Typography>
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {new Date(item.emittedAt).toLocaleString('es-CO')}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {item.templateVersion} · {item.engine}
                </Typography>
                <Button
                  size='small'
                  startIcon={<PictureAsPdfOutlined />}
                  onClick={() => void openIssuedPdf(item.id)}
                >
                  PDF
                </Button>
                <Button
                  size='small'
                  startIcon={<VerifiedOutlined />}
                  disabled={
                    verifyMutation.isLoading &&
                    verifyMutation.variables === item.id
                  }
                  onClick={() => handleVerify(item.id)}
                >
                  Verificar
                </Button>
                {check && (
                  <Chip
                    size='small'
                    icon={<TaskAltOutlined />}
                    label={
                      check.identicalResults && check.pdfIntact
                        ? `Se recalcula idéntico${check.sameTemplate ? '' : ' (la plantilla cambió)'}`
                        : 'No coincide con lo emitido'
                    }
                    sx={{
                      color:
                        check.identicalResults && check.pdfIntact
                          ? intent.successInk
                          : intent.dangerInk,
                      bgcolor:
                        check.identicalResults && check.pdfIntact
                          ? intent.successSoft
                          : intent.dangerSoft
                    }}
                  />
                )}
              </Box>
            )
          })
        ) : (
          <EmptyState
            compact
            icon={<PictureAsPdfOutlined />}
            title='Todavía no hay certificados emitidos'
            hint='Llene el formulario y use «Emitir certificado».'
          />
        )}
      </Paper>
    </Container>
  )
}

// Al cambiar de tipo de equipo el espacio de trabajo se vuelve a montar: ningún dato del tipo anterior se arrastra.
const CertificateCalc: React.FC = () => {
  const [template, setTemplate] = useState('aspirador')
  return (
    <CalcWorkspace
      key={template}
      template={template}
      onTemplateChange={setTemplate}
    />
  )
}

export default CertificateCalc
