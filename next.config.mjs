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
};

export default nextConfig;
