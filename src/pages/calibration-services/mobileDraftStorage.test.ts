import { beforeEach, describe, expect, it } from 'vitest'
import {
  DRAFT_MAX_AGE_MS,
  clearMobileDraft,
  loadMobileDraft,
  saveMobileDraft
} from './mobileDraftStorage'

const draft = {
  items: { 1: 'completed' as const },
  notes: { 1: 'ok' },
  executed: { 1: 2 }
}

describe('mobileDraftStorage', () => {
  beforeEach(() => localStorage.clear())

  it('recupera el borrador si lo guardado en el servidor no cambió', () => {
    saveMobileDraft(7, 'k1', draft, 1000)
    expect(loadMobileDraft(7, 'k1', 2000)).toEqual(draft)
  })

  it('descarta el borrador si el servidor guardó algo distinto', () => {
    saveMobileDraft(7, 'k1', draft, 1000)
    expect(loadMobileDraft(7, 'k2', 2000)).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('descarta el borrador vencido', () => {
    saveMobileDraft(7, 'k1', draft, 1000)
    expect(loadMobileDraft(7, 'k1', 1000 + DRAFT_MAX_AGE_MS + 1)).toBeNull()
  })

  it('no mezcla servicios y tolera datos dañados', () => {
    saveMobileDraft(7, 'k1', draft, 1000)
    expect(loadMobileDraft(8, 'k1', 2000)).toBeNull()
    localStorage.setItem('mm:calibration-mobile-draft:9', '{no es json')
    expect(loadMobileDraft(9, 'k1')).toBeNull()
  })

  it('clearMobileDraft lo borra', () => {
    saveMobileDraft(7, 'k1', draft)
    clearMobileDraft(7)
    expect(loadMobileDraft(7, 'k1')).toBeNull()
  })
})
