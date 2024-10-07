/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ondeply only
  assetPrefix: "https://dev-ielt.itk.ac.id",
  env: {
    GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_EMAIL: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
  },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 86400 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 100,
  },
}

module.exports = nextConfig
