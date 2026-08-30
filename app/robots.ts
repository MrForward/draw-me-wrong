import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "./site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/api/", "/c/", "/live/"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/", "/c/", "/live/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: "/api/" },
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
