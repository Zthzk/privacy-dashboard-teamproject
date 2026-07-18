import { describe, expect, test } from 'vitest'

import { applyProjectStyleOverrides } from '../project-display'


describe('applyProjectStyleOverrides', () => {
  test('keeps persisted backend styles ahead of stale browser cache values', () => {
    const [project] = applyProjectStyleOverrides(
      [{ id: 1, icon_key: 'health', color: 'error' }],
      { 1: { icon_key: 'message', color: 'primary' } },
    )

    expect(project).toMatchObject({ icon_key: 'health', color: 'error' })
  })

  test('uses browser cache as a fallback for responses from older APIs', () => {
    const [project] = applyProjectStyleOverrides(
      [{ id: 1 }],
      { 1: { icon_key: 'traffic', color: 'warning' } },
    )

    expect(project).toMatchObject({ icon_key: 'traffic', color: 'warning' })
  })
})
