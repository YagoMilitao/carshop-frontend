export const PORTFOLIO_INTRO =
  "Upholstery, restoration and custom interior projects by DreamUP Auto Interiors."

/** Cabeçalho da listagem, compartilhado por `page` e `error`. */
export function PortfolioHeader() {
  return (
    <header className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-display-lg text-foreground">Portfolio</h1>
      <p className="text-body-lg text-secondary-foreground">{PORTFOLIO_INTRO}</p>
    </header>
  )
}
