/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark libsql as external for server builds
      config.externals = [...(config.externals || []), '@libsql/client', '@prisma/adapter-libsql', 'libsql'];
    }
    
    // Ignore README.md and LICENSE files
    config.module.rules.push({
      test: /node_modules\/@libsql.*\.(md|txt)$/,
      use: 'null-loader',
    });
    config.module.rules.push({
      test: /node_modules\/@libsql.*\/LICENSE$/,
      use: 'null-loader',
    });
    config.module.rules.push({
      test: /node_modules\/@prisma.*\.(md|txt)$/,
      use: 'null-loader',
    });
    
    return config;
  },
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', 'libsql'],
}

module.exports = nextConfig
