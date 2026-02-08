import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mkt-vehicleimages-prd.autotradercdn.ca" },
      { protocol: "https", hostname: "images.hgmsites.net" },
      { protocol: "https", hostname: "cars.usnews.com" },
      { protocol: "https", hostname: "service.secureoffersites.com" },
      { protocol: "https", hostname: "www.dealerfireblog.com" },
      { protocol: "https", hostname: "img.autobytel.com" },
      { protocol: "https", hostname: "mediapool.bmwgroup.com" },
      { protocol: "https", hostname: "carvato.com" },
      { protocol: "https", hostname: "preview.thenewsmarket.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "image.made-in-china.com" },
      { protocol: "https", hostname: "sicily-evs.com" },
      { protocol: "https", hostname: "global.discourse-cdn.com" },
      { protocol: "https", hostname: "cdn.euroncap.com" },
      { protocol: "https", hostname: "cache1.arabwheels.ae" },
      { protocol: "https", hostname: "ichelabamotor.com" },
      { protocol: "https", hostname: "file.infoservision.com" },
      { protocol: "https", hostname: "avatars.mds.yandex.net" },
    ],
  },
};

module.exports = nextConfig;

export default nextConfig;
