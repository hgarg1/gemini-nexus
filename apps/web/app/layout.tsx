import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemini Nexus | Advanced AI Hub",
  description: "The ultimate Google Gemini wrapper for professionals.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-primary/30`} suppressHydrationWarning>
        <div className="fixed inset-0 bg-cyber-grid bg-[size:40px_40px] pointer-events-none opacity-20" />
        <div className="relative z-10 min-h-screen">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}