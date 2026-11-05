import { atom } from 'nanostores'

interface CertificateTypeData {
  label: string
  value: string | number
}

export const certificateTypeStore = atom<CertificateTypeData[]>([])
