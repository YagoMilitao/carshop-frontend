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
    // Proxy same-origin obrigatório em qualquer ambiente (dev e produção):
    // faz o Axios client-side (lib/api/http.ts) chamar sempre um caminho
    // relativo à origem do frontend, para que cookies HttpOnly host-bound
    // (refresh_token/csrf_token) do backend remoto sejam gravados sob o
    // host do frontend — o navegador nunca envia esses cookies de volta a
    // um domínio diferente do domínio que os emitiu (RFC 6265). A única
    // condição para o rewrite existir é `NEXT_PUBLIC_API_URL` estar
    // definida (necessária para montar o destino do proxy).
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
