/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { externals: { 'utf-8-validate': string; bufferutil: string }[] }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    })
    return config
  },
}

module.exports = nextConfig