/** @type {import('next').NextConfig} */

// For GitHub Pages project sites the app is served from https://<user>.github.io/<repo>/,
// so we need a base path. The deploy workflow sets NEXT_PUBLIC_BASE_PATH=/<repo>.
// Locally it's empty, so `npm run dev` serves from /.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export", // static HTML export → works on GitHub Pages
  trailingSlash: true, // emit /route/index.html so static hosts resolve folders
  images: { unoptimized: true }, // no server image optimizer on a static host
  eslint: { ignoreDuringBuilds: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
