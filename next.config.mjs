/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async redirects() {
    return [
      {
        source: "/trabalhos",
        destination: "/portfolio",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Proxy dev-only: existe só para permitir rodar o frontend em localhost
    // autenticando contra um backend remoto já deployado (ex.: Render) sem
    // quebrar cookies HttpOnly host-bound (refresh_token/csrf_token), que o
    // navegador nunca envia de volta a um domínio de frontend diferente do
    // domínio que os emitiu (RFC 6265). Nunca ativo em produção: `next build`
    // / `next start` rodam com NODE_ENV === "production", então este bloco
    // sempre retorna [] nesse caso.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      return [];
    }

    return [
      {
        source: "/api-proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
