/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `pnpm build` runs Next route type generation plus `tsc --noEmit` first.
  // Skip Next's duplicate worker pass, which can hang after compilation.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      // The platform copies pre-Next.js pages into public/legacy while a team
      // migrates. Real App Router pages win before these fallback rewrites.
      fallback: [
        {
          source: '/dashboards/:slug',
          destination: '/legacy/dashboards/:slug.html',
        },
        {
          source: '/:slug',
          destination: '/legacy/:slug.html',
        },
      ],
    };
  },
};

export default nextConfig;
