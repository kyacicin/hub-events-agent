const projectRoot = __dirname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

module.exports = nextConfig;
