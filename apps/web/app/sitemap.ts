import { MetadataRoute } from "next";
import { prisma } from "@repo/database";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEnabled = await prisma.systemSettings.findUnique({
    where: { key: "sitemap_enabled" },
  });

  if (sitemapEnabled?.value === "false") {
    return [];
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3005";

  // Static routes
  const routes = ["", "/chat", "/login", "/register"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Add public chats if needed
  try {
    const publicChats = await prisma.chat.findMany({
        where: { isPublic: true },
        select: { id: true, updatedAt: true },
        take: 100,
    });

    const chatRoutes = publicChats.map(chat => ({
        url: `${baseUrl}/chat/${chat.id}`,
        lastModified: chat.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
    }));

    return [...routes, ...chatRoutes];
  } catch {
    return routes;
  }
}
