/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  transpilePackages: ["@backpack-fux/pylon-sdk"],
};

module.exports = nextConfig;
