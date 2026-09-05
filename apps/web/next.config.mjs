/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The API lives on a different domain; no rewrites/proxying needed
  // since the API client always talks to NEXT_PUBLIC_API_URL directly
  // with credentials: "include".
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
