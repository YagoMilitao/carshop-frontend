import type { Metadata } from 'next'
import { clientEnv } from '@/lib/env/client'
import { getSocialLinks } from '@/lib/social-links'
import { PageSection } from '@/components/layout/page-section'
import { cn } from '@/lib/utils'
import { HomeCtaActions } from '../_components/home-cta-actions'
import { ContactFollowLinks } from './_components/contact-follow-links'

const description =
  'Contact CarShop about automotive upholstery, restoration and custom interior work.'

export const metadata: Metadata = {
  title: 'Contact',
  description,
  alternates: {
    canonical: new URL('/contact', clientEnv.NEXT_PUBLIC_SITE_URL).toString(),
  },
  openGraph: {
    title: 'Contact',
    description,
  },
}

// Página estática (Server Component). O formulário de contato futuro deve
// ser um Client Component isolado na menor boundary possível, e um bloco
// `BusinessInfo` (telefone, endereço, horário) só entra quando houver
// dados confirmados pelo negócio — nada disso existe hoje.
export default function ContactPage() {
  const socialLinks = getSocialLinks()
  const hasSocialLinks = socialLinks.length > 0

  return (
    <PageSection spacing="editorial" aria-labelledby="contact-heading">
      <div
        className={cn(
          'grid grid-cols-1 gap-12',
          hasSocialLinks && 'lg:grid-cols-12 lg:items-start lg:gap-8',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-6',
            hasSocialLinks ? 'lg:col-span-7' : 'max-w-4xl',
          )}
        >
          <span className="text-label text-muted-foreground">Contact</span>
          <h1 id="contact-heading" className="text-display-lg text-foreground">
            Ready to transform your interior?
          </h1>
          <p className="text-body-lg text-secondary-foreground">
            Quote requests are coming soon. In the meantime, see our completed
            work.
          </p>
          <div className="pt-2">
            <HomeCtaActions />
          </div>
        </div>

        {hasSocialLinks && (
          <div className="lg:col-span-4 lg:col-start-9">
            <ContactFollowLinks links={socialLinks} />
          </div>
        )}
      </div>
    </PageSection>
  )
}
