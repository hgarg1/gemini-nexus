import { MetadataRoute } from "next";
import { prisma } from "@repo/database";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3005";

  // Build-time guard
  if (!process.env.DATABASE_URL) {
    return ["", "/chat", "/login", "/register"].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));
  }

  // Static routes
  const routes = ["", "/chat", "/login", "/register"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const sitemapEnabled = await prisma.systemSettings.findUnique({
      where: { key: "sitemap_enabled" },
    });

    if (sitemapEnabled?.value === "false") {
      return [];
    }

    // Add public chats if needed
    const publicChats = await prisma.chat.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
      take: 100,
    });

    const chatRoutes = publicChats.map((chat) => ({
      url: `${baseUrl}/chat/${chat.id}`,
      lastModified: chat.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [...routes, ...chatRoutes];
  } catch (error) {
    console.warn("Sitemap generation failed to connect to DB, returning static routes.");
    return routes;
  }
}
