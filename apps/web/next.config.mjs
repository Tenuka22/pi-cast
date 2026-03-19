import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin"

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
}

export default varlockNextConfigPlugin()(nextConfig)
