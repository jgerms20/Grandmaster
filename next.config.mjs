/** @type {import('next').NextConfig} */
const nextConfig = {
  // The tournament logic is covered by unit tests; keep production builds resilient
  // by not blocking on lint. Type-checking still runs.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.chesscomfiles.com" },
      { protocol: "https", hostname: "www.chess.com" },
    ],
  },
};

export default nextConfig;
