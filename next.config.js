/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GCP_PRIVATE_KEY: process.env.NEXT_PUBLIC_GCP_PRIVATE_KEY,
    GCP_PROJECT_ID: process.env.NEXT_PUBLIC_GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_EMAIL: process.env.NEXT_PUBLIC_GCP_SERVICE_ACCOUNT_EMAIL,
  }
}

module.exports = nextConfig
