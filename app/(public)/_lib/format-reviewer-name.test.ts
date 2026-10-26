import { describe, expect, it } from 'vitest'
import { formatReviewerName } from './format-reviewer-name'

describe('formatReviewerName', () => {
  it('um único token: retorna o próprio token', () => {
    expect(formatReviewerName('Yago')).toBe('Yago')
  })

  it('dois tokens: primeiro nome + inicial do sobrenome', () => {
    expect(formatReviewerName('Yago Militão')).toBe('Yago M.')
  })

  it('3+ tokens: usa a inicial do último token, mantendo o primeiro como digitado', () => {
    expect(formatReviewerName('  yago   de  militão ')).toBe('yago M.')
  })

  it('separa por tabs, quebras de linha e espaços não separáveis', () => {
    expect(formatReviewerName('Ana\tMaria\nSouza')).toBe('Ana S.')
    expect(formatReviewerName('Ana Souza')).toBe('Ana S.')
  })

  it('apenas espaços em branco ou vazio → null', () => {
    expect(formatReviewerName('')).toBeNull()
    expect(formatReviewerName('   \t\n ')).toBeNull()
  })

  it('tokens posteriores sem letra: apenas o primeiro nome', () => {
    expect(formatReviewerName('Yago 123')).toBe('Yago')
    expect(formatReviewerName('Yago -')).toBe('Yago')
  })

  it('ignora tokens finais sem letra e usa o último token com letra', () => {
    expect(formatReviewerName('Yago Militão 2')).toBe('Yago M.')
  })

  it('usa a primeira letra do token (ignorando pontuação/números iniciais)', () => {
    expect(formatReviewerName('Ana Silva-Santos')).toBe('Ana S.')
    expect(formatReviewerName("John (o'brien)")).toBe('John O.')
  })

  it('preserva acentos e normaliza em NFC', () => {
    expect(formatReviewerName('Élise Ødegård')).toBe('Élise Ø.')
    // "É" decomposto (E + U+0301) vira o caractere composto.
    expect(formatReviewerName('Élise étienne')).toBe('Élise É.')
  })

  it('capitaliza a inicial', () => {
    expect(formatReviewerName('maria silva')).toBe('maria S.')
  })
})
