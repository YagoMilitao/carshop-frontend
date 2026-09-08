import type { Metadata } from "next";
import type { ReactNode } from "react";

// Defesa em profundidade, complementar a `app/robots.ts`: Admin nunca é
// tratado como conteúdo público indexável (inclui `/admin/login`).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Shell do grupo `/admin/*`: apenas metadata (`noindex`), sem checagem de
 * sessão. A checagem de sessão (camada 2 de proteção) vive em
 * `app/(admin)/admin/(protected)/layout.tsx`, que **não** engloba
 * `/admin/login` — evita o loop de redirect que ocorreria se a própria
 * rota de login também exigisse sessão válida para ser renderizada.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
