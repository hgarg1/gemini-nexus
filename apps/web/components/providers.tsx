"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listen for custom desktop events
    if (typeof window !== "undefined" && (window as any).nexusDesktop) {
      (window as any).nexusDesktop.receive("fromMain", (data: any) => {
        if (data.type === "open-nexus-file") {
          console.log(">> NEXUS_FRAGMENT_RECEIVED", data.path);
          // This is where you'll trigger specific UI logic based on file content
          alert(`NEXUS_FRAGMENT_DETECTED\nSource: ${data.path}\nContent: ${data.content.slice(0, 100)}...`);
        }
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
