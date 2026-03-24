const config = {
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001",
};

export default config;
