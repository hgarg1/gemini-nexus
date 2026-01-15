import { MetadataRoute } from "next";
import { prisma } from "@repo/database";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // During build time or if DB is not configured, return safe defaults immediately
  if (!process.env.DATABASE_URL) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/chat/[id]"],
      },
      sitemap: "https://nexus.gemini/sitemap.xml", // Placeholder
    };
  }

  let robotsSetting = null;
  try {
    robotsSetting = await prisma.systemSettings.findUnique({
      where: { key: "robots_txt" },
    });
  } catch (e) {
    console.warn("Could not fetch robots.txt settings from DB, using defaults.");
  }

  // Default if no setting found
  if (!robotsSetting) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/chat/[id]"],
      },
      sitemap: "https://localhost:3005/sitemap.xml",
    };
  }

  try {
    // We assume the value is stored as a JSON string representing the config
    // or we could support a raw text field.
    // For simplicity, let's allow a simple 'allow_all' or 'disallow_all' toggle or raw string.
    if (robotsSetting.value === "DISALLOW_ALL") {
        return {
            rules: { userAgent: "*", disallow: "/" }
        };
    }
    
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      sitemap: "https://localhost:3005/sitemap.xml",
    };
  } catch {
    return {
      rules: { userAgent: "*", allow: "/" },
    };
  }
}
