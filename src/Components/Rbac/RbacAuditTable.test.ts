import { describe, expect, it } from 'vitest'
import { describeAuditChange } from './RbacAuditTable'
import type { RbacAuditItem } from 'src/types/rbac'

const item = (over: Partial<RbacAuditItem>): RbacAuditItem =>
  ({
    id: 1,
    createdAt: '2026-11-12T10:00:00.000Z',
    action: 'impersonation_start',
    before: null,
    after: null,
    ...over
  }) as RbacAuditItem

describe('describeAuditChange: suplantaciones', () => {
  it('muestra a quién se suplantó y con qué roles', () => {
    const text = describeAuditChange(
      item({ after: { userId: 9, email: 'luis@x.co', roles: ['cliente'] } })
    )
    expect(text).toContain('luis@x.co')
  })

  it('sin roles lo dice, y el fin se describe igual', () => {
    const text = describeAuditChange(
      item({
        action: 'impersonation_end',
        after: { userId: 9, email: 'luis@x.co', roles: [] }
      })
    )
    expect(text).toBe('luis@x.co (sin roles)')
  })
})
