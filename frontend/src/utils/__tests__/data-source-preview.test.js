import { describe, expect, test } from 'vitest'

import { getDataSourcePreviewText } from '../data-source-preview'

describe('getDataSourcePreviewText', () => {
  test('uses manual data input from metadata instead of backend preview text', () => {
    const source = {
      preview_text: 'Backend-generated preview',
      metadata: {
        manual_data: 'Manual Data Input sample',
      },
    }

    expect(getDataSourcePreviewText(source)).toBe('Manual Data Input sample')
  })
})
