/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_EMAIL: process.env.GCP_SERVICE_ACCOUNT_EMAIL,  }
}

module.exports = nextConfig
