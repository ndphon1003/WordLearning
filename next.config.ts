import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // Piper includes conditional Node-only require("fs") and require("path").
  // Resolve them only in the browser; server code keeps real Node modules.
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/lib/empty-node-module.ts" },
      path: { browser: "./src/lib/empty-node-module.ts" },
    },
  },
  async headers() {
    return [{source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"no-referrer"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
    ]}];
  }
};
export default config;
