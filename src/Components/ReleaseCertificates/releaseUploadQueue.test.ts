import { describe, expect, it } from 'vitest'
import {
  UNREADABLE_MESSAGE,
  UploadRow,
  classifyResult,
  runPool,
  summarize
} from './releaseUploadQueue'
import {
  ReleaseCertificate,
  ReleaseUploadResult
} from './ReleaseCertificates.types'

const certificate = (overrides: Partial<ReleaseCertificate> = {}) =>
  ({
    id: 4,
    documentNumber: 'CC-1',
    anomalies: [],
    readStatus: 'ok',
    ...overrides
  }) as unknown as ReleaseCertificate

const ok = (c: ReleaseCertificate): ReleaseUploadResult => ({
  fileName: 'a.pdf',
  ok: true,
  certificate: c
})

describe('classifyResult', () => {
  it('un PDF bueno queda en verde con su número', () => {
    expect(classifyResult(ok(certificate()))).toEqual({
      status: 'done',
      detail: 'CC-1',
      certificateId: 4
    })
  })

  it('un PDF ilegible sale en ámbar con el motivo', () => {
    const result = classifyResult(ok(certificate({ readStatus: 'fallida' })))
    expect(result.status).toBe('warning')
    expect(result.detail).toBe(UNREADABLE_MESSAGE)
    expect(result.certificateId).toBe(4)
  })

  it('un PDF con rarezas queda en ámbar con la primera', () => {
    const result = classifyResult(
      ok(
        certificate({
          anomalies: [
            {
              code: 'SIN_CLIENTE',
              field: 'customerName',
              message: 'Sin cliente'
            }
          ] as never
        })
      )
    )
    expect(result.status).toBe('warning')
    expect(result.detail).toContain('Sin cliente')
  })

  it('un rechazo conserva el motivo del API', () => {
    expect(
      classifyResult({ fileName: 'x.pdf', ok: false, error: 'No es un PDF' })
    ).toEqual({ status: 'failed', detail: 'No es un PDF' })
  })
})

describe('summarize', () => {
  it('separa bien, con rarezas, rechazados y cancelados', () => {
    const row = (status: UploadRow['status']) =>
      ({ id: status, status }) as unknown as UploadRow
    expect(
      summarize([
        row('done'),
        row('done'),
        row('warning'),
        row('failed'),
        row('cancelled'),
        row('queued')
      ])
    ).toEqual({
      total: 6,
      good: 2,
      warnings: 1,
      rejected: 1,
      cancelled: 1,
      finished: 5
    })
  })
})

describe('runPool', () => {
  it('nunca corre más de N a la vez y respeta el orden de salida', async () => {
    let active = 0
    let peak = 0
    const started: number[] = []
    await runPool(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async (item) => {
        started.push(item)
        active++
        peak = Math.max(peak, active)
        await new Promise((resolve) => setTimeout(resolve, 5))
        active--
      }
    )
    expect(peak).toBe(3)
    expect(started).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('al parar devuelve lo que no arrancó', async () => {
    let stop = false
    const skipped = await runPool(
      [1, 2, 3, 4, 5],
      1,
      async (item) => {
        if (item === 2) stop = true
      },
      () => stop
    )
    expect(skipped).toEqual([3, 4, 5])
  })
})
