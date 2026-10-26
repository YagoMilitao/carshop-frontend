import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Comment, GetWorkCommentsOptions } from '@/lib/api/comments'
import { HttpError } from '@/lib/api/errors'
import { withRetryBackoff } from '@/lib/api/retry'
import type { Work } from '@/lib/api/works'

vi.mock('server-only', () => ({}))

// Retorno `unknown`: permite simular corpos fora do contrato sem casts.
const getWorkCommentsMock =
  vi.fn<(workId: string, options?: GetWorkCommentsOptions) => Promise<unknown>>()

vi.mock('@/lib/api/comments', () => ({
  getWorkComments: (workId: string, options?: GetWorkCommentsOptions) =>
    getWorkCommentsMock(workId, options),
}))

const {
  getHomeReviews,
  HOME_REVIEWS_REQUEST_TIMEOUT_MS,
  HOME_REVIEWS_RETRY_OPTIONS,
} = await import('./get-home-reviews')

function makeWork(id: string): Work {
  return {
    id,
    slug: `work-${id}`,
    title: `Work ${id}`,
    description: 'Descrição',
    category: 'bancos',
    tags: [],
    images: [],
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    deletedAt: null,
  }
}

function makeComment(id: string, workId: string, createdAt: string): Comment {
  return {
    id,
    workId,
    authorName: 'Maria Secreta Sobrenome',
    content: `Conteúdo privado ${id}`,
    status: 'APPROVED',
    createdAt,
    updatedAt: createdAt,
  }
}

const eightWorks = ['1', '2', '3', '4', '5', '6', '7', '8'].map(makeWork)

describe('getHomeReviews', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('usa o orçamento reduzido de retry e timeout documentados', () => {
    expect(HOME_REVIEWS_RETRY_OPTIONS).toEqual({
      retries: 1,
      baseDelayMs: 500,
      shouldRetry: expect.any(Function),
    })
    expect(HOME_REVIEWS_REQUEST_TIMEOUT_MS).toBe(5_000)
  })

  it('consulta no máximo os 6 primeiros works (ordem da API) com retry/timeout da Home', async () => {
    getWorkCommentsMock.mockResolvedValue([])

    await getHomeReviews(eightWorks)

    expect(getWorkCommentsMock).toHaveBeenCalledTimes(6)
    expect(getWorkCommentsMock.mock.calls.map(([workId]) => workId)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ])
    for (const [, options] of getWorkCommentsMock.mock.calls) {
      expect(options).toEqual({
        retry: HOME_REVIEWS_RETRY_OPTIONS,
        timeoutMs: HOME_REVIEWS_REQUEST_TIMEOUT_MS,
      })
    }
  })

  it('shouldRetry: não repete 429 nem outros 4xx; repete 5xx e erro de rede/timeout', () => {
    const { shouldRetry } = HOME_REVIEWS_RETRY_OPTIONS

    expect(shouldRetry(new HttpError('rate limit', 429))).toBe(false)
    expect(shouldRetry(new HttpError('not found', 404))).toBe(false)
    expect(shouldRetry(new HttpError('server', 500))).toBe(true)
    expect(shouldRetry(new HttpError('unavailable', 503))).toBe(true)
    expect(shouldRetry(new TypeError('fetch failed'))).toBe(true)
    expect(shouldRetry(new DOMException('timeout', 'TimeoutError'))).toBe(true)
  })

  describe('com o retry real (withRetryBackoff) aplicado às opções da Home', () => {
    // Simula a requisição de cada tentativa; o mock de `getWorkComments`
    // delega ao `withRetryBackoff` real com as opções recebidas, então o
    // número de chamadas reflete o orçamento efetivo de retry por work.
    const attemptMock = vi.fn<(workId: string) => Promise<Comment[]>>()

    afterEach(() => {
      vi.useRealTimers()
    })

    async function runWithRealRetry(works: readonly Work[]) {
      vi.useFakeTimers()
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getWorkCommentsMock.mockImplementation((workId, options) =>
        withRetryBackoff(() => attemptMock(workId), options?.retry),
      )

      const pending = getHomeReviews(works)
      await vi.runAllTimersAsync()
      return pending
    }

    function attemptsFor(workId: string): number {
      return attemptMock.mock.calls.filter(([id]) => id === workId).length
    }

    it('429: exatamente 1 chamada para aquele work (sem retry) e só ele é omitido', async () => {
      attemptMock.mockImplementation(async (workId) => {
        if (workId === '1') throw new HttpError('Falha ao buscar comentários: 429', 429)
        return [makeComment(`${workId}-a`, workId, '2026-06-01T00:00:00.000Z')]
      })

      const reviews = await runWithRealRetry(eightWorks.slice(0, 2))

      expect(attemptsFor('1')).toBe(1)
      expect(attemptsFor('2')).toBe(1)
      expect(reviews.map((review) => review.id)).toEqual(['2-a'])
    })

    it('5xx: repetido uma vez e recupera na segunda tentativa', async () => {
      attemptMock
        .mockRejectedValueOnce(new HttpError('Falha ao buscar comentários: 503', 503))
        .mockImplementation(async (workId) => [
          makeComment(`${workId}-a`, workId, '2026-06-01T00:00:00.000Z'),
        ])

      const reviews = await runWithRealRetry(eightWorks.slice(0, 1))

      expect(attemptsFor('1')).toBe(2)
      expect(reviews.map((review) => review.id)).toEqual(['1-a'])
    })

    it('5xx persistente: no máximo 2 chamadas (1 retry) e o work é omitido', async () => {
      attemptMock.mockRejectedValue(new HttpError('Falha ao buscar comentários: 500', 500))

      await expect(runWithRealRetry(eightWorks.slice(0, 1))).resolves.toEqual([])
      expect(attemptsFor('1')).toBe(2)
    })

    it('erro de rede/timeout: repetido uma vez', async () => {
      attemptMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))

      await expect(runWithRealRetry(eightWorks.slice(0, 1))).resolves.toEqual([])
      expect(attemptsFor('1')).toBe(2)
    })
  })

  it('works vazio: nenhuma chamada e lista vazia', async () => {
    await expect(getHomeReviews([])).resolves.toEqual([])
    expect(getWorkCommentsMock).not.toHaveBeenCalled()
  })

  it('mescla, ordena e limita a 3 reviews entre os works amostrados', async () => {
    getWorkCommentsMock.mockImplementation(async (workId) => [
      makeComment(`${workId}-a`, workId, `2026-0${workId}-01T00:00:00.000Z`),
    ])

    const reviews = await getHomeReviews(eightWorks)

    expect(reviews.map((review) => review.id)).toEqual(['6-a', '5-a', '4-a'])
    expect(reviews[0]?.work).toEqual({ title: 'Work 6', slug: 'work-6' })
  })

  it('falha parcial (429/404/rede): continua com os demais e registra só o workId + erro', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorkCommentsMock.mockImplementation(async (workId) => {
      if (workId === '1') throw new HttpError('Falha ao buscar comentários: 429', 429)
      if (workId === '2') throw new HttpError('Falha ao buscar comentários: 404', 404)
      if (workId === '3') throw new TypeError('fetch failed')
      return [makeComment(`${workId}-a`, workId, '2026-06-01T00:00:00.000Z')]
    })

    const reviews = await getHomeReviews(eightWorks.slice(0, 4))

    expect(reviews.map((review) => review.id)).toEqual(['4-a'])
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.any(String),
      '1',
      expect.any(HttpError),
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), '3', expect.any(TypeError))

    const logged = JSON.stringify(consoleErrorSpy.mock.calls.map((call) => call.map(String)))
    expect(logged).not.toMatch(/Maria|Secreta|Conteúdo privado/)
  })

  it('falha total: resolve [] (nunca rejeita)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorkCommentsMock.mockRejectedValue(new Error('backend off'))

    await expect(getHomeReviews(eightWorks)).resolves.toEqual([])
    expect(getWorkCommentsMock).toHaveBeenCalledTimes(6)
  })

  it('sem comentários aprovados: []', async () => {
    getWorkCommentsMock.mockResolvedValue([])

    await expect(getHomeReviews(eightWorks)).resolves.toEqual([])
  })

  it('corpo fora do contrato não rejeita', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getWorkCommentsMock
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce([null])

    await expect(getHomeReviews(eightWorks.slice(0, 2))).resolves.toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })
})
