import { PageSection } from "@/components/layout/page-section"

export type HomeProcessStep = { title: string; description?: string }

export type HomeProcessContent = {
  heading: string
  steps: readonly [HomeProcessStep, ...HomeProcessStep[]]
}

/** Sem conteúdo aprovado (CARSHOP-168): a seção não renderiza. */
export const HOME_PROCESS_CONTENT: HomeProcessContent | null = null

type HomeProcessProps = {
  /** Permite testar a estrutura sem publicar copy não aprovada. */
  content?: HomeProcessContent | null
}

/**
 * `#process` (CARSHOP-168): só estrutura. Enquanto não houver etapas reais
 * aprovadas, `content` é `null` e nem a seção nem a âncora existem (mesmo
 * padrão condicional de `#reviews`).
 *
 * Heading em bloco próprio e lista em largura total abaixo: 1 coluna no
 * mobile, 2 no `md` e uma linha com colunas iguais no `lg` (uma por etapa).
 */
export function HomeProcess({
  content = HOME_PROCESS_CONTENT,
}: Readonly<HomeProcessProps>) {
  if (!content) return null

  return (
    <PageSection
      spacing="standard"
      id="process"
      aria-labelledby="home-process-heading"
      className="border-t border-border"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-8">
        <h2
          id="home-process-heading"
          className="text-heading-2 text-foreground lg:col-span-5"
        >
          {content.heading}
        </h2>

        <ol className="grid grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-x-8 lg:col-span-12 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-fr">
          {content.steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-4 border-t border-border pt-6"
            >
              <span aria-hidden="true" className="text-label tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-heading-3 text-foreground">{step.title}</p>
              {step.description && (
                <p className="text-body text-secondary-foreground">{step.description}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </PageSection>
  )
}
