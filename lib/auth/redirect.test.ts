import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_PATH,
  LOGIN_PATH,
  REDIRECT_QUERY_PARAM,
  buildLoginRedirectTarget,
  buildLoginUrlWithRedirect,
  isSafeInternalRedirectPath,
} from "./redirect";

describe("isSafeInternalRedirectPath", () => {
  it("aceita rota interna válida", () => {
    expect(isSafeInternalRedirectPath("/admin/trabalhos/123")).toBe(true);
  });

  it("aceita rota interna com query string", () => {
    expect(
      isSafeInternalRedirectPath("/admin/trabalhos/123?tab=fotos"),
    ).toBe(true);
  });

  it.each(["https://evil.com", "http://evil.com"])(
    "rejeita URL absoluta: %s",
    (value) => {
      expect(isSafeInternalRedirectPath(value)).toBe(false);
    },
  );

  it("rejeita protocol-relative (//evil.com)", () => {
    expect(isSafeInternalRedirectPath("//evil.com")).toBe(false);
  });

  it.each(["/\\evil.com", "/\\/evil.com"])(
    "rejeita backslash escape: %s",
    (value) => {
      expect(isSafeInternalRedirectPath(value)).toBe(false);
    },
  );

  it("rejeita string vazia", () => {
    expect(isSafeInternalRedirectPath("")).toBe(false);
  });

  it.each([undefined, null, 42, {}, []])(
    "rejeita valor não-string: %p",
    (value) => {
      expect(isSafeInternalRedirectPath(value)).toBe(false);
    },
  );

  it("rejeita javascript:", () => {
    expect(isSafeInternalRedirectPath("javascript:alert(1)")).toBe(false);
  });

  it.each(["/admin \n/evil", "/admin\t/evil", "/admin\u0000/evil"])(
    "rejeita string com whitespace/caracteres de controle: %p",
    (value) => {
      expect(isSafeInternalRedirectPath(value)).toBe(false);
    },
  );

  it("rejeita rota que não começa com /", () => {
    expect(isSafeInternalRedirectPath("admin/trabalhos/123")).toBe(false);
  });
});

describe("buildLoginRedirectTarget", () => {
  it("retorna null quando pathname é /admin, mesmo com search", () => {
    expect(buildLoginRedirectTarget(DEFAULT_ADMIN_PATH, "?tab=fotos")).toBeNull();
  });

  it("retorna null quando pathname é inseguro", () => {
    expect(buildLoginRedirectTarget("//evil.com")).toBeNull();
  });

  it("retorna o pathname quando seguro e sem search", () => {
    expect(buildLoginRedirectTarget("/admin/trabalhos/123")).toBe(
      "/admin/trabalhos/123",
    );
  });

  it("retorna pathname + search quando ambos seguros", () => {
    expect(
      buildLoginRedirectTarget("/admin/trabalhos/123", "?tab=fotos"),
    ).toBe("/admin/trabalhos/123?tab=fotos");
  });
});

describe("buildLoginUrlWithRedirect", () => {
  it("retorna exatamente LOGIN_PATH quando o target é null", () => {
    expect(buildLoginUrlWithRedirect(DEFAULT_ADMIN_PATH)).toBe(LOGIN_PATH);
  });

  it("retorna LOGIN_PATH?redirect=<encoded> quando o target é válido", () => {
    const result = buildLoginUrlWithRedirect("/admin/trabalhos/123");

    expect(result).toBe(
      `${LOGIN_PATH}?${REDIRECT_QUERY_PARAM}=%2Fadmin%2Ftrabalhos%2F123`,
    );
  });

  it("faz encode correto de caracteres especiais na query (ex.: &)", () => {
    const result = buildLoginUrlWithRedirect(
      "/admin/trabalhos/123",
      "?tab=fotos&page=2",
    );

    const url = new URL(result, "http://internal.local");
    const redirectParam = url.searchParams.get(REDIRECT_QUERY_PARAM);

    expect(redirectParam).toBe("/admin/trabalhos/123?tab=fotos&page=2");
  });
});
