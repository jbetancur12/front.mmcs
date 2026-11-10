import { describe, expect, it } from 'vitest'
import { MaintenanceStatus } from '../../../types/maintenance'
import { getNextStep, NextStepInput } from './ticketNextStep'

const base: NextStepInput = {
  status: MaintenanceStatus.PENDING,
  hasTechnician: false,
  scheduledDate: null,
  canAssign: true,
  canOperate: true,
  canInvoice: true,
  signaturesEnabled: true,
  hasCustomerSignature: false,
  reportSaved: false,
  reportPercent: 0,
  isInvoiced: false
}

const step = (over: Partial<NextStepInput>) => getNextStep({ ...base, ...over })

describe('getNextStep', () => {
  it('pendiente: coordinación asigna; sin permiso solo se informa', () => {
    expect(step({})?.primary?.action).toBe('assign')
    const sin = step({ canAssign: false })
    expect(sin?.primary).toBeUndefined()
    expect(sin?.blockedReason).toMatch(/Coordinación/)
  })

  it('asignado sin fecha: programar y permite iniciar sin programar', () => {
    const r = step({ status: MaintenanceStatus.ASSIGNED, hasTechnician: true })
    expect(r?.primary?.action).toBe('schedule')
    expect(r?.secondary?.action).toBe('start')
  })

  it('asignado con fecha: iniciar; el técnico no programa', () => {
    expect(
      step({
        status: MaintenanceStatus.ASSIGNED,
        hasTechnician: true,
        scheduledDate: '2026-11-10'
      })?.primary?.action
    ).toBe('start')
    expect(
      step({
        status: MaintenanceStatus.ASSIGNED,
        hasTechnician: true,
        canAssign: false
      })?.primary?.action
    ).toBe('start')
  })

  it('en progreso: completar y se puede pausar', () => {
    const r = step({
      status: MaintenanceStatus.IN_PROGRESS,
      hasTechnician: true
    })
    expect(r?.primary?.action).toBe('complete')
    expect(r?.canPause).toBe(true)
  })

  it('pausado o esperando: reanudar', () => {
    for (const status of [
      MaintenanceStatus.ON_HOLD,
      MaintenanceStatus.WAITING_PARTS,
      MaintenanceStatus.WAITING_CUSTOMER
    ]) {
      expect(step({ status, hasTechnician: true })?.primary?.action).toBe(
        'resume'
      )
    }
  })

  it('completado: reporte, luego firma, luego facturar, luego al día', () => {
    const done = { status: MaintenanceStatus.COMPLETED, hasTechnician: true }
    expect(step(done)?.primary?.action).toBe('report')
    expect(step({ ...done, reportSaved: true })?.primary?.action).toBe('sign')
    expect(
      step({ ...done, reportSaved: true, hasCustomerSignature: true })?.primary
        ?.action
    ).toBe('invoice')
    const fin = step({
      ...done,
      reportSaved: true,
      hasCustomerSignature: true,
      isInvoiced: true
    })
    expect(fin?.primary).toBeUndefined()
    expect(fin?.blockedReason).toBeUndefined()
    expect(fin?.currentIndex).toBe(fin?.stages.length)
  })

  it('sin firmas activas no hay etapa de firma', () => {
    const r = step({
      status: MaintenanceStatus.COMPLETED,
      reportSaved: true,
      signaturesEnabled: false
    })
    expect(r?.stages.map((s) => s.label)).not.toContain('Firma')
    expect(r?.primary?.action).toBe('invoice')
  })

  it('facturar sin permiso de facturación no da botón', () => {
    const r = step({
      status: MaintenanceStatus.COMPLETED,
      reportSaved: true,
      hasCustomerSignature: true,
      canInvoice: false
    })
    expect(r?.primary).toBeUndefined()
    expect(r?.blockedReason).toMatch(/Facturación/)
  })

  it('cancelado no tiene barra', () => {
    expect(step({ status: MaintenanceStatus.CANCELLED })).toBeNull()
  })
})
