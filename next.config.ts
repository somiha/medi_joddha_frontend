// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   images: {
//     domains: [
//       "api.t-coin.code-studio4.com",
//       "api.backend.t-coin.code-studio4.com",
//       "localhost:5002",
//     ],
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "medijoddha.save71.net",
        port: "",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**", // optional but recommended
      },
    ],
  },
};

export default nextConfig;
