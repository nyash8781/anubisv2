const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Explicit allowlist — do not use wildcard hostnames. Each entry
    // below must correspond to a real origin you control or trust.
    // Add new hosts here as integrations are added (R2 public, custom CDN, etc.).
    remotePatterns: [
      // Supabase Storage public URLs (<project-ref>.supabase.co)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Supabase Storage transform URLs (<project-ref>.supabase.in) — used by some regions
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
});
