import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@repo/database";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminAIChatbot } from "@/components/admin/ai-chatbot";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexus Admin | Security Portal",
  manifest: "/manifest-admin.json",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Double check DB role
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { role: true }
  });

  if (user?.role !== "admin") {
    redirect("/chat");
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-mono selection:bg-primary/30">
       <AdminSidebar />

       <main className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
            {children}
          </div>
       </main>
       <AdminAIChatbot />
    </div>
  );
}