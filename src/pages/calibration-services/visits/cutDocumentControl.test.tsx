import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CalibrationServiceCutDocumentControlDialog from '../CalibrationServiceCutDocumentControlDialog'

vi.mock('react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}))
vi.mock('src/hooks/useFeatureFlags', () => ({ useFeature: () => true }))
vi.mock('../../../utils/functions', () => ({ useCan: () => true }))
vi.mock('../CalibrationServiceCertificateRows', () => ({ default: () => null }))
vi.mock('../../../Components/ReleaseCertificates/ReleaseUploadDialog', () => ({
  default: () => null
}))
vi.mock('../../../hooks/useCalibrationServices', () => ({
  CALIBRATION_SERVICE_QUERY_KEYS: { detail: ['detail'] }
}))

const certificate = (id: number, deliveredAt: string | null) => ({
  id,
  documentNumber: `C-${id}`,
  instrument: null,
  serie: null,
  status: 'liberado',
  cutId: 7,
  deliveredAt,
  deliveryMethod: deliveredAt ? ('plataforma' as const) : null,
  deliveryRecipient: deliveredAt ? 'Cliente de prueba' : null
})

const open = (items: ReturnType<typeof certificate>[]) => {
  const onSubmit = vi.fn()
  render(
    <MemoryRouter>
      <CalibrationServiceCutDocumentControlDialog
        open
        cut={
          {
            id: 7,
            cutCode: 'C01',
            items: [{ quantity: 2 }],
            otherFields: {}
          } as never
        }
        service={
          {
            id: 1,
            cuts: [{}],
            releaseCertificates: { total: items.length, released: 2, items }
          } as never
        }
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    </MemoryRouter>
  )
  return onSubmit
}

describe('Control documental con entrega por certificado', () => {
  it('no vuelve a pedir los datos de envío y los toma de las entregas', () => {
    const onSubmit = open([
      certificate(1, '2026-11-27T15:00:00Z'),
      certificate(2, '2026-11-27T15:00:00Z')
    ])

    expect(
      screen.getByText('Los 2 certificados están entregados al cliente.')
    ).toBeTruthy()
    expect(screen.queryByLabelText('Canal de envío')).toBeNull()
    expect(screen.queryByLabelText('Enviados')).toBeNull()
    expect(screen.queryByText(/Todos enviados/)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar control' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        sentCertificates: 2,
        sendChannel: 'Plataforma',
        sentTo: 'Cliente de prueba',
        sentAt: '2026-11-27T15:00:00Z'
      })
    )
  })

  it('con algo por entregar lo dice y enlaza a Entregas', () => {
    open([certificate(1, '2026-11-27T15:00:00Z'), certificate(2, null)])

    expect(screen.getByText(/1 entregados, de 2 esperados/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Registrar en Pendientes › Entregas' })
    ).toBeTruthy()
  })

  it('«Editar a mano» recupera los campos', () => {
    open([certificate(1, null), certificate(2, null)])

    fireEvent.click(screen.getByRole('button', { name: 'Editar a mano' }))
    expect(screen.getByLabelText('Canal de envío')).toBeTruthy()
    expect(screen.getByLabelText('Enviados')).toBeTruthy()
  })
})
