function removeTrailingSlashes(value) {
  let endIndex = value.length;

  while (endIndex > 0 && value[endIndex - 1] === "/") {
    endIndex -= 1;
  }

  return value.slice(0, endIndex);
}

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
    // relativo à origem do frontend, para que os cookies host-bound do
    // backend remoto (refresh_token HttpOnly e csrf_token legível pelo JS)
    // sejam gravados sob o host do frontend — o navegador nunca envia esses
    // cookies de volta a outro domínio (RFC 6265). A única
    // condição para o rewrite existir é `NEXT_PUBLIC_API_URL` estar
    // definida (necessária para montar o destino do proxy).
    const configuredBackendUrl = process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = configuredBackendUrl
      ? removeTrailingSlashes(configuredBackendUrl)
      : configuredBackendUrl;

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
