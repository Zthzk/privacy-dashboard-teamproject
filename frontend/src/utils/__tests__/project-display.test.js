import { describe, expect, test } from 'vitest'

import { applyProjectStyleOverrides, sortProjectsNewestFirst } from '../project-display'


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

describe('sortProjectsNewestFirst', () => {
  test('puts a recently edited project ahead of a newer but unedited project', () => {
    const projects = [
      { id: 1, created_at: '2026-07-18T10:00:00Z', updated_at: '2026-07-18T10:00:00Z' },
      { id: 2, created_at: '2026-07-17T10:00:00Z', updated_at: '2026-07-18T11:00:00Z' },
    ]

    expect(sortProjectsNewestFirst(projects).map((project) => project.id)).toEqual([2, 1])
  })
})
