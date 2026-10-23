import React, { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Typography
} from '@mui/material'
import { Download, ExpandMore } from '@mui/icons-material'
import { getApiErrorMessage } from '@utils/apiError'
import { downloadPrivateFile } from '@utils/downloadBlob'
import {
  CustomerServiceDocument,
  CustomerServiceDocumentType
} from 'src/types/customerIndicators'
import { notify } from 'src/utils/notify'
import {
  formatShortDate,
  TEAL_TEXT
} from '../customerIndicators/indicatorFormat'

interface Props {
  customerId: number | string
  serviceId: number
  odsCode: string
  documents: CustomerServiceDocument[]
}

const ADJUSTMENT_TYPES: CustomerServiceDocumentType[] = [
  'adjustment_pdf',
  'adjustment_summary_pdf',
  'adjustment_customer_response_pdf'
]

interface Group {
  key: string
  label: string
  documents: CustomerServiceDocument[]
}

const buttonSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: TEAL_TEXT,
  borderColor: TEAL_TEXT
} as const

/** ODS (una), avances técnicos y novedades; con varios documentos del mismo tipo, un menú. */
const ServiceDocumentButtons: React.FC<Props> = ({
  customerId,
  serviceId,
  odsCode,
  documents
}) => {
  const [busyId, setBusyId] = useState<number | null>(null)
  const [menu, setMenu] = useState<{
    anchor: HTMLElement
    group: Group
  } | null>(null)

  const groups: Group[] = [
    {
      key: 'ods',
      label: 'ODS',
      documents: documents.filter((doc) => doc.type === 'ods_pdf')
    },
    {
      key: 'progress',
      label: 'Avances técnicos',
      documents: documents.filter(
        (doc) => doc.type === 'technical_progress_pdf'
      )
    },
    {
      key: 'adjustments',
      label: 'Novedades',
      documents: documents.filter((doc) => ADJUSTMENT_TYPES.includes(doc.type))
    }
  ]

  const download = async (doc: CustomerServiceDocument) => {
    setBusyId(doc.id)
    try {
      await downloadPrivateFile(
        `/customers/${customerId}/calibration-services/${serviceId}/documents/${doc.id}/download`,
        `${odsCode}-${doc.title}.pdf`
      )
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No se pudo descargar el documento.')
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {groups.every((group) => group.documents.length === 0) ? (
        <Typography variant='body2' color='text.secondary'>
          Aún no hay documentos
        </Typography>
      ) : null}
      {groups.map((group) => {
        const count = group.documents.length
        // Lo que no existe no se muestra: sin botones vacíos
        if (count === 0) return null
        if (count === 1) {
          const doc = group.documents[0]
          return (
            <Button
              key={group.key}
              size='small'
              variant='outlined'
              onClick={() => download(doc)}
              disabled={busyId === doc.id}
              startIcon={
                busyId === doc.id ? (
                  <CircularProgress size={14} />
                ) : (
                  <Download />
                )
              }
              sx={buttonSx}
            >
              {group.label}
            </Button>
          )
        }
        return (
          <Button
            key={group.key}
            size='small'
            variant='outlined'
            onClick={(event) => setMenu({ anchor: event.currentTarget, group })}
            endIcon={<ExpandMore />}
            aria-haspopup='menu'
            sx={buttonSx}
          >
            {group.label} ({count})
          </Button>
        )
      })}
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        {menu?.group.documents.map((doc) => (
          <MenuItem
            key={doc.id}
            disabled={busyId === doc.id}
            onClick={() => {
              setMenu(null)
              download(doc)
            }}
          >
            <Box>
              <Typography variant='body2' fontWeight={600}>
                {doc.title}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {formatShortDate(doc.uploadedAt)}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default ServiceDocumentButtons
