import { MetadataRoute } from "next";

const PRIVATE_PATHS = [
  "/admin",
  "/dashboard",
  "/access",
  "/private-reel",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS.flatMap((path) => [path, `${path}/`]),
    },
    sitemap: "https://kachnamedia.com/sitemap.xml",
  };
}
