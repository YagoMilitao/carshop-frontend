import { describe, expect, it } from 'vitest'
import { CONTACT_SECTION_ID } from '@/components/contact/contact-anchor'
import { HOME_SECTION_IDS, OUR_WORK_SECTION_ID, type HomeSectionId } from './home-anchors'

describe('home-anchors (CARSHOP-162)', () => {
  it('expõe os ids estáveis das seções da Home, na ordem de renderização', () => {
    expect(HOME_SECTION_IDS).toEqual({
      hero: 'hero',
      ourWork: 'our-work',
      services: 'services',
      process: 'process',
      about: 'about',
      reviews: 'reviews',
      contact: 'contact',
    })
    expect(Object.keys(HOME_SECTION_IDS)).toEqual([
      'hero',
      'ourWork',
      'services',
      'process',
      'about',
      'reviews',
      'contact',
    ])
  })

  it('não tem ids duplicados', () => {
    const ids: readonly HomeSectionId[] = Object.values(HOME_SECTION_IDS)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reaproveita CONTACT_SECTION_ID e mantém o alias OUR_WORK_SECTION_ID', () => {
    expect(HOME_SECTION_IDS.contact).toBe(CONTACT_SECTION_ID)
    expect(OUR_WORK_SECTION_ID).toBe(HOME_SECTION_IDS.ourWork)
    expect(OUR_WORK_SECTION_ID).toBe('our-work')
  })
})
