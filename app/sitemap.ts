import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_ORIGIN}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/play/team-icebreaker`, changeFrequency: "monthly", priority: 0.9 },
  ];
}
