import { prisma } from "@repo/database";
import { SystemSettings } from "@/components/admin/system-settings";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSettings.findMany();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">SYSTEM_CORE_CONFIGURATION</h1>
        <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mt-2 font-mono">Manipulate root level parameters and security protocols</p>
      </div>

      <SystemSettings initialSettings={settings} />
    </div>
  );
}