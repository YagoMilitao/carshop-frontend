import { CONTACT_SECTION_ID } from "@/components/contact/contact-anchor"

/**
 * Ids estáveis das seções da Home single-page (CARSHOP-162), na ordem de
 * renderização. Fonte única para a navegação por âncoras (CARSHOP-174).
 * `contact` reaproveita a constante de CARSHOP-171.
 */
export const HOME_SECTION_IDS = {
  hero: "hero",
  ourWork: "our-work",
  services: "services",
  process: "process",
  about: "about",
  reviews: "reviews",
  contact: CONTACT_SECTION_ID,
} as const

export type HomeSectionId =
  (typeof HOME_SECTION_IDS)[keyof typeof HOME_SECTION_IDS]

/** Âncora da seção "Our Work" da Home (CARSHOP-165). */
export const OUR_WORK_SECTION_ID = HOME_SECTION_IDS.ourWork
