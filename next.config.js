/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib'],
    // Don't fail the build on ESLint errors (warnings only)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TS errors during production
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
