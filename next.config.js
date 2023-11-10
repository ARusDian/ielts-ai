/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GCP_SERVICE_ACCOUNT_EMAIL: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  }
}

module.exports = nextConfig
