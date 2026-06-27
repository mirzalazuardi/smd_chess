import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.ENABLE_PWA !== "true",
  runtimeCaching: [
    {
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "CacheFirst",
    },
    {
      urlPattern: /^\/icons\/.*/i,
      handler: "CacheFirst",
    },
    {
      urlPattern: /^\/(jadwal|klasemen|pairing)\/.*/i,
      handler: "NetworkFirst",
      options: {
        expiration: {
          maxAgeSeconds: 300,
        },
      },
    },
  ],
})(nextConfig);
