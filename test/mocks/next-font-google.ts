/**
 * Stub de `next/font/google` para o ambiente de testes (Vitest/jsdom).
 * O carregamento real de fontes do Next depende do loader do webpack do
 * Next.js em build/dev, que não está disponível fora dele; o stub replica
 * apenas o shape usado pela aplicação (função de fonte retornando um
 * objeto com `variable`/`className`).
 */
type FontOptions = {
  subsets?: string[];
  variable?: string;
};

type FontResult = {
  className: string;
  variable: string;
  style: { fontFamily: string };
};

function createFontStub(name: string) {
  return (options: FontOptions = {}): FontResult => ({
    className: `${name}-className`,
    variable: options.variable ?? `--font-${name}`,
    style: { fontFamily: name },
  });
}

export const Geist = createFontStub("geist");
