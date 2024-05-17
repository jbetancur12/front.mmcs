import { atom } from 'nanostores'

interface CertificateTypeData {
  label: string
  value: string
}

export const certificateTypeStore = atom<CertificateTypeData[]>([])
