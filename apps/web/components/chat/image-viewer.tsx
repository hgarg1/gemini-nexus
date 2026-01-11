"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X as CloseIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
}

export function ImageViewer({
  isOpen,
  onClose,
  images,
  index,
  onIndexChange,
}: ImageViewerProps) {
  const viewerCount = images.length;
  const viewerPrevIndex = viewerCount ? (index - 1 + viewerCount) % viewerCount : 0;
  const viewerNextIndex = viewerCount ? (index + 1) % viewerCount : 0;

  const shiftViewer = (direction: number) => {
    const nextIndex = (index + direction + viewerCount) % viewerCount;
    onIndexChange(nextIndex);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-20 pointer-events-none"
          >
            <div
              className="relative glass-panel rounded-[40px] border-white/10 overflow-hidden shadow-2xl pointer-events-auto w-full max-w-6xl max-h-full flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="scanline animate-scanline" />
              </div>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-secondary/20" />
              <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div>
                  <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">VISUAL_STREAM</div>
                  <div className="text-xs font-black tracking-[0.2em] text-primary/70 uppercase mt-1">
                    FRAME {index + 1} / {viewerCount}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="relative flex-1 flex items-center justify-center px-6 py-8">
                <div className="relative w-full max-w-5xl h-[62vh] flex items-center justify-center" style={{ perspective: "1400px" }}>
                  {viewerCount > 0 && (
                    <>
                      {viewerCount > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => shiftViewer(-1)}
                          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </motion.button>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {viewerCount > 1 && (
                          <motion.div
                            key={`prev-${images[viewerPrevIndex]}`}
                            className="absolute left-0 w-[40%] max-w-[340px] h-[55%] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/50"
                            initial={{ opacity: 0, x: -120, scale: 0.7, rotateY: 18 }}
                            animate={{ opacity: 0.35, x: -40, scale: 0.78, rotateY: 18 }}
                            exit={{ opacity: 0, x: -120, scale: 0.7, rotateY: 18 }}
                            transition={{ type: "spring", stiffness: 120, damping: 18 }}
                            style={{ transformStyle: "preserve-3d", filter: "blur(1.5px)" }}
                            onClick={() => shiftViewer(-1)}
                          >
                            <img src={images[viewerPrevIndex]} className="w-full h-full object-cover scale-105" alt="Previous frame" />
                          </motion.div>
                        )}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`center-${images[index]}`}
                            className="relative z-10 w-[72%] max-w-[760px] h-[72%] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.65)] bg-black/50"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                          >
                            <div
                              className="absolute inset-0 scale-110 bg-center bg-cover blur-2xl opacity-60"
                              style={{ backgroundImage: `url(${images[index]})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
                            <img
                              src={images[index]}
                              className="relative z-10 w-full h-full object-contain"
                              alt="High Resolution Neural Data"
                            />
                          </motion.div>
                        </AnimatePresence>
                        {viewerCount > 1 && (
                          <motion.div
                            key={`next-${images[viewerNextIndex]}`}
                            className="absolute right-0 w-[40%] max-w-[340px] h-[55%] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/50"
                            initial={{ opacity: 0, x: 120, scale: 0.7, rotateY: -18 }}
                            animate={{ opacity: 0.35, x: 40, scale: 0.78, rotateY: -18 }}
                            exit={{ opacity: 0, x: 120, scale: 0.7, rotateY: -18 }}
                            transition={{ type: "spring", stiffness: 120, damping: 18 }}
                            style={{ transformStyle: "preserve-3d", filter: "blur(1.5px)" }}
                            onClick={() => shiftViewer(1)}
                          >
                            <img src={images[viewerNextIndex]} className="w-full h-full object-cover scale-105" alt="Next frame" />
                          </motion.div>
                        )}
                      </div>
                      {viewerCount > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => shiftViewer(1)}
                          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                          <ChevronLeft className="w-6 h-6 rotate-180" />
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="relative z-10 p-5 md:p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">NEURAL_IMAGE_INSPECTOR</div>
                  <div className="flex items-center gap-3">
                    {viewerCount > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => shiftViewer(-1)}
                          className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-white/60 hover:text-white transition-all"
                        >
                          PREV
                        </button>
                        <button
                          type="button"
                          onClick={() => shiftViewer(1)}
                          className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-white/60 hover:text-white transition-all"
                        >
                          NEXT
                        </button>
                      </div>
                    )}
                    <a
                      href={images[index]}
                      download="nexus_asset.png"
                      className="text-[10px] font-black text-primary hover:text-white transition-colors"
                    >
                      DOWNLOAD_RAW_DATA
                    </a>
                  </div>
                </div>
                {viewerCount > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {images.map((src, idx) => (
                      <button
                        key={`viewer-thumb-${idx}`}
                        onClick={() => onIndexChange(idx)}
                        className={cn(
                          "relative w-16 h-16 rounded-xl overflow-hidden border transition-all",
                          idx === index
                            ? "border-primary shadow-[0_0_15px_rgba(0,242,255,0.35)]"
                            : "border-white/10 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={src} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
