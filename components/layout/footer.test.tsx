import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Footer } from "./footer";
import { navLinks } from "./nav-links";

/**
 * `footer.tsx` importa `serverEnv` (que importa o pacote `server-only`) em
 * escopo de módulo. Sob Vitest, `server-only` sempre lança (ver limitação
 * documentada em `lib/env/server.test.ts`), então precisamos do mesmo
 * mock no-op aqui para conseguir renderizar o Footer nos testes.
 */
vi.mock("server-only", () => ({}));

describe("Footer", () => {
  it("renderiza um elemento <footer> semântico", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renderiza o conteúdo de copyright com o ano atual", () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} CarShop. Todos os direitos reservados.`),
    ).toBeInTheDocument();
  });

  it("renderiza os links institucionais (navLinks) com hrefs corretos", () => {
    render(<Footer />);

    const institutionalNav = screen.getByRole("navigation", { name: "Links institucionais" });

    navLinks.forEach((link) => {
      const anchor = within(institutionalNav).getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.href);
    });
  });

  it("não renderiza dados de negócio inventados (telefone, endereço, horário)", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    const footerText = footer.textContent ?? "";

    expect(footerText).not.toMatch(/\(\d{3}\)\s?\d{3}-\d{4}/);
  });

  it("não renderiza o item legado 'Início' e usa os rótulos em inglês do redesign", () => {
    render(<Footer />);

    const institutionalNav = screen.getByRole("navigation", { name: "Links institucionais" });

    expect(within(institutionalNav).queryByRole("link", { name: "Início" })).not.toBeInTheDocument();
    ["Services", "Our Work", "About", "Contact"].forEach((label) => {
      expect(within(institutionalNav).getByRole("link", { name: label })).toBeInTheDocument();
    });
  });
});

describe("Footer - redes sociais (renderização condicional via env vars)", () => {
  const socialEnvVars = [
    "SOCIAL_INSTAGRAM_URL",
    "SOCIAL_FACEBOOK_URL",
    "SOCIAL_LINKEDIN_URL",
  ] as const;

  const originalValues = Object.fromEntries(
    socialEnvVars.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    socialEnvVars.forEach((key) => {
      const original = originalValues[key];
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    });
    vi.resetModules();
  });

  it("não renderiza a nav 'Redes sociais' quando nenhuma env var está definida", async () => {
    socialEnvVars.forEach((key) => {
      delete process.env[key];
    });
    vi.resetModules();

    const { Footer: FooterWithoutSocialEnv } = await import("./footer");
    render(<FooterWithoutSocialEnv />);

    expect(
      screen.queryByRole("navigation", { name: "Redes sociais" }),
    ).not.toBeInTheDocument();
  });

  it("renderiza os 3 links de redes sociais com atributos de acessibilidade corretos quando as env vars estão definidas", async () => {
    process.env.SOCIAL_INSTAGRAM_URL = "https://instagram.com/carshop";
    process.env.SOCIAL_FACEBOOK_URL = "https://facebook.com/carshop";
    process.env.SOCIAL_LINKEDIN_URL = "https://linkedin.com/company/carshop";
    vi.resetModules();

    const { Footer: FooterWithSocialEnv } = await import("./footer");
    render(<FooterWithSocialEnv />);

    const socialNav = screen.getByRole("navigation", { name: "Redes sociais" });

    const expectedLinks = [
      { label: "Instagram", href: "https://instagram.com/carshop" },
      { label: "Facebook", href: "https://facebook.com/carshop" },
      { label: "LinkedIn", href: "https://linkedin.com/company/carshop" },
    ];

    expectedLinks.forEach(({ label, href }) => {
      const anchor = within(socialNav).getByRole("link", { name: label });
      expect(anchor).toHaveAttribute("href", href);
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noreferrer");
    });
  });

  it("renderiza apenas o link correspondente quando só uma env var está definida", async () => {
    delete process.env.SOCIAL_INSTAGRAM_URL;
    delete process.env.SOCIAL_LINKEDIN_URL;
    process.env.SOCIAL_FACEBOOK_URL = "https://facebook.com/carshop";
    vi.resetModules();

    const { Footer: FooterWithFacebookOnly } = await import("./footer");
    render(<FooterWithFacebookOnly />);

    const socialNav = screen.getByRole("navigation", { name: "Redes sociais" });

    expect(within(socialNav).getByRole("link", { name: "Facebook" })).toBeInTheDocument();
    expect(within(socialNav).queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    expect(within(socialNav).queryByRole("link", { name: "LinkedIn" })).not.toBeInTheDocument();
  });
});
