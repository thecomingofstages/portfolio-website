import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const mediaBaseUrl = process.env.MEDIA_BASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Uploaded images come only from the R2 media bucket.
    remotePatterns: mediaBaseUrl ? [new URL(`${mediaBaseUrl.replace(/\/$/, "")}/**`)] : [],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
