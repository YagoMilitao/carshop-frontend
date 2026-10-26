const LETTER_PATTERN = /\p{L}/u

/**
 * Nome público de quem comentou na Home (`#reviews`): "primeiro nome +
 * inicial do último sobrenome" (ex. `Yago M.`), decisão aprovada para não
 * expor o `authorName` completo (CARSHOP-170).
 *
 * - Normaliza em NFC e separa por qualquer espaço em branco.
 * - Sem tokens → `null` (o review é descartado; sem fallback "Anonymous").
 * - Um token → o próprio token.
 * - Dois ou mais → primeiro token (como digitado) + primeira letra do
 *   último token posterior que contenha letra, em maiúscula. Se nenhum
 *   token posterior tiver letra (`"Yago 123"`), apenas o primeiro token.
 */
export function formatReviewerName(authorName: string): string | null {
  const tokens = authorName
    .normalize("NFC")
    .split(/\s+/u)
    .filter((token) => token.length > 0)

  const [first, ...rest] = tokens

  if (first === undefined) {
    return null
  }

  for (let index = rest.length - 1; index >= 0; index -= 1) {
    const letter = rest[index]?.match(LETTER_PATTERN)?.[0]

    if (letter !== undefined) {
      return `${first} ${letter.toLocaleUpperCase("en-US")}.`
    }
  }

  return first
}
