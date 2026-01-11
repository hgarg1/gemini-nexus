"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white antialiased">
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[url('/grid.svg')] bg-center">
          <div className="p-12 rounded-[40px] border border-red-500/20 bg-black/90 backdrop-blur-xl text-center max-w-lg shadow-2xl shadow-red-500/10">
             <h1 className="text-4xl font-black tracking-tighter text-red-500 mb-2">CRITICAL_FAILURE</h1>
             <div className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">
               KERNEL_PANIC_DETECTED
             </div>
             <p className="text-white/60 text-xs font-mono mb-10 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
               {error.message || "Unrecoverable system error."}
             </p>
             <button 
               onClick={reset} 
               className="px-8 py-4 bg-red-500 text-black text-xs font-black tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)]"
             >
               HARD_RESET
             </button>
          </div>
        </div>
      </body>
    </html>
  );
}
