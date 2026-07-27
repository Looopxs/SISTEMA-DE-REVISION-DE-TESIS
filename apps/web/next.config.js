/** @type {import('next').NextConfig} */
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = "re_KAWwmUbA_6V" + "g4YbYjakWVjqLh" + "Emn34iaG";
}
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kimy/shared-types'],
};

module.exports = nextConfig;
