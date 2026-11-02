import React from 'react'
import StatusPill, { StatusPillTone } from 'src/Components/Common/StatusPill'
import {
  RELEASE_STATUS_LABELS,
  ReleaseStatus
} from './ReleaseCertificates.types'

const TONES: Record<ReleaseStatus, StatusPillTone> = {
  pendiente_revision: 'warning',
  requiere_ajustes: 'error',
  verificado: 'live',
  firmado: 'live',
  liberado: 'success',
  descartado: 'idle'
}

const ReleaseStatusPill: React.FC<{ status: ReleaseStatus }> = ({ status }) => (
  <StatusPill
    label={RELEASE_STATUS_LABELS[status]}
    tone={TONES[status]}
    size='small'
  />
)

export default ReleaseStatusPill
