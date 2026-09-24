import { PageSection } from "@/components/layout/page-section"
import { HomeCtaActions } from "./home-cta-actions"

export function FinalCta() {
  return (
    <PageSection
      spacing="standard"
      className="border-t border-border"
      aria-labelledby="final-cta-heading"
    >
      <div className="flex max-w-4xl flex-col gap-8">
        <h2 id="final-cta-heading" className="text-display-lg text-foreground">
          Ready to transform your interior?
        </h2>
        <HomeCtaActions />
      </div>
    </PageSection>
  )
}
