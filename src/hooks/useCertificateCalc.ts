import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { axiosPrivate as axiosPrivateRaw } from '@utils/api'

/** Un punto de medición: valor de referencia, seis lecturas y tolerancia (%). Vacío = ''. */
export interface CalcPoint {
  nominal: number | string
  lecturas: Array<number | string>
  tolerancia: number | string
}

export interface CalcData {
  numero: string
  verificadoPor: string
  instrumento: string
  fabricante: string
  modelo: string
  serie: string | number
  codigo: string
  ubicacion: string
  rangoMedida: string
  sitio: string
  cliente: string
  direccion: string
  ciudad: string
  recepcion: string
  calibracion: string
  patronNombre: string
  patronCodigo: string
  patronSerie: string | number
  patronCalibradoPor: string
  unidad: string
  resolucionEquipo: number | string
  resolucionPatron: number | string
  exactitudPatronPct: number | string
  exactitudPatronAbs: number | string
  exactitudEquipoPct: number | string
  exactitudEquipoAbs: number | string
  tempInicial: number | string
  tempFinal: number | string
  humInicial: number | string
  humFinal: number | string
  puntos: CalcPoint[]
}

export interface CalcTemplate {
  key: string
  name: string
}

/**
 * Convierte lo que el usuario tiene escrito en lo que entiende el API: «-76,5» → -76.5; un texto a medias («-», «1,»)
 * o vacío → vacío. En pantalla se conserva lo escrito tal cual para poder teclear el signo menos o la coma.
 */
const cleanNumber = (value: number | string): number | '' => {
  if (typeof value === 'number') return value
  const text = value.trim().replace(',', '.')
  if (text === '') return ''
  const n = Number(text)
  return Number.isFinite(n) ? n : ''
}

export const cleanCalcData = (data: CalcData): CalcData => ({
  ...data,
  resolucionEquipo: cleanNumber(data.resolucionEquipo),
  resolucionPatron: cleanNumber(data.resolucionPatron),
  exactitudPatronPct: cleanNumber(data.exactitudPatronPct),
  exactitudPatronAbs: cleanNumber(data.exactitudPatronAbs),
  exactitudEquipoPct: cleanNumber(data.exactitudEquipoPct),
  exactitudEquipoAbs: cleanNumber(data.exactitudEquipoAbs),
  tempInicial: cleanNumber(data.tempInicial),
  tempFinal: cleanNumber(data.tempFinal),
  humInicial: cleanNumber(data.humInicial),
  humFinal: cleanNumber(data.humFinal),
  puntos: data.puntos.map((p) => ({
    nominal: cleanNumber(p.nominal),
    lecturas: p.lecturas.map(cleanNumber),
    tolerancia: cleanNumber(p.tolerancia)
  }))
})

export interface CalcDefaults {
  template: { key: string; name: string }
  units: string[]
  data: CalcData
}

export interface CalcPreview {
  html: string
  warnings: string[]
  blocking: string[]
  calcErrors: string[]
  templateVersion: string
  ms: number
}

export interface IssuedCertificate {
  id: string
  template: string
  numero: string
  emittedAt: string
  userId: number | null
  templateVersion: string
  engine: string
}

export interface VerifyResult {
  id: string
  sameTemplate: boolean
  savedTemplate: string
  currentTemplate: string
  identicalResults: boolean
  pdfIntact: boolean
}

export const CALC_QUERY_KEYS = {
  templates: ['certificateCalc', 'templates'],
  defaults: (template: string) => ['certificateCalc', 'defaults', template],
  issued: ['certificateCalc', 'issued']
}

export const useCalcTemplates = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<CalcTemplate[]>(
    CALC_QUERY_KEYS.templates,
    () =>
      axiosPrivate
        .get('/certificate-calc/templates')
        .then((response) => response.data.data),
    { staleTime: Infinity, refetchOnWindowFocus: false }
  )
}

export const useCalcDefaults = (template: string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<CalcDefaults>(
    CALC_QUERY_KEYS.defaults(template),
    () =>
      axiosPrivate
        .get(`/certificate-calc/${template}/defaults`)
        .then((response) => response.data.data),
    { staleTime: Infinity, refetchOnWindowFocus: false }
  )
}

export const useCalcPreview = (template: string) => {
  const axiosPrivate = useAxiosPrivate()
  return useMutation<CalcPreview, unknown, CalcData>((data) =>
    axiosPrivate
      .post(`/certificate-calc/${template}/preview`, { data })
      .then((response) => response.data.data)
  )
}

export const useIssueCalcCertificate = (template: string) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<IssuedCertificate, unknown, CalcData>(
    (data) =>
      axiosPrivate
        .post(`/certificate-calc/${template}/issue`, { data })
        .then((response) => response.data.data),
    {
      onSuccess: () => queryClient.invalidateQueries(CALC_QUERY_KEYS.issued)
    }
  )
}

export const useIssuedCertificates = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<IssuedCertificate[]>(CALC_QUERY_KEYS.issued, () =>
    axiosPrivate
      .get('/certificate-calc/issued')
      .then((response) => response.data.data)
  )
}

export const useVerifyIssuedCertificate = () => {
  const axiosPrivate = useAxiosPrivate()
  return useMutation<VerifyResult, unknown, string>((id) =>
    axiosPrivate
      .post(`/certificate-calc/issued/${encodeURIComponent(id)}/verify`)
      .then((response) => response.data.data)
  )
}

export const issuedPdfUrl = (id: string) =>
  `/certificate-calc/issued/${encodeURIComponent(id)}/pdf`

/** Abre el PDF emitido en una pestaña nueva (el archivo pide sesión, por eso se baja como blob). */
export const openIssuedPdf = async (id: string): Promise<void> => {
  const response = await axiosPrivateRaw.get(issuedPdfUrl(id), {
    responseType: 'blob'
  })
  const objectUrl = window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  )
  window.open(objectUrl, '_blank', 'noopener')
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000)
}
