import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pulselane/assets', '@pulselane/contracts']
}

export default nextConfig
