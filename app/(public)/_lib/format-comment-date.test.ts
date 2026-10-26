import { describe, expect, it } from 'vitest'
import { formatCommentDate } from './format-comment-date'

describe('formatCommentDate', () => {
  it('formata como data longa en-US', () => {
    expect(formatCommentDate('2026-06-05T12:00:00.000Z')).toBe('June 5, 2026')
  })

  it('usa UTC (não desloca o dia pelo fuso local)', () => {
    expect(formatCommentDate('2026-06-05T23:59:59.000Z')).toBe('June 5, 2026')
    expect(formatCommentDate('2026-06-05T00:00:00.000Z')).toBe('June 5, 2026')
  })
})
