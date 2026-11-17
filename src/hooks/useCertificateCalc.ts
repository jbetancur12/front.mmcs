import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { axiosPrivate as axiosPrivateRaw } from '@utils/api'

/** Un punto de medición: valor de referencia, seis lecturas y tolerancia (%). Vacío = ''. */
export interface CalcPoint {
  nominal: number | ''
  lecturas: Array<number | ''>
  tolerancia: number | ''
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
  resolucionEquipo: number | ''
  resolucionPatron: number | ''
  exactitudPatronPct: number | ''
  exactitudPatronAbs: number | ''
  tempInicial: number | ''
  tempFinal: number | ''
  humInicial: number | ''
  humFinal: number | ''
  puntos: CalcPoint[]
}

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
  defaults: (template: string) => ['certificateCalc', 'defaults', template],
  issued: ['certificateCalc', 'issued']
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
