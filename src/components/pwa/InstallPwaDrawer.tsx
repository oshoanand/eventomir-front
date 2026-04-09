"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "@/hooks/usePWAInstall";

export default function InstallPwaDrawer() {
  const { deferredPrompt, isIOS, isStandalone, installApp } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1. Prevent Hydration Mismatches
  // We must wait until the component mounts on the client before checking PWA status
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 2. Logic: If not installed AND (we have an android prompt OR we are on iOS)
    if (mounted && !isStandalone && (deferredPrompt || isIOS)) {
      // Delay the popup slightly so it doesn't interrupt the user's initial page load
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS, isStandalone, mounted]);

  // Do not render anything during SSR, or if the app is already installed
  if (!mounted || isStandalone) return null;

  // If nothing to show (no prompt captured and not iOS), hide.
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Z-Index 9998 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer - Z-Index 9999 (Highest Priority) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background z-[9999] p-6 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe border-t border-border/50"
            // CSS environment variable for iOS bottom bar padding
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            {/* Handle Bar (Visual cue for dragging/drawer) */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                {/* App Icon Placeholder */}
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    Установить приложение
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Быстрый доступ без браузера
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors shrink-0"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {isIOS ? (
              // iOS Instructions
              <div className="space-y-3 text-sm text-foreground/80 font-medium">
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <Share className="w-6 h-6 text-blue-500 shrink-0" />
                  <span>
                    1. Нажмите <b>«Поделиться»</b> в меню браузера
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <PlusSquare className="w-6 h-6 text-foreground shrink-0" />
                  <span>
                    2. Выберите <b>«На экран Домой»</b>
                  </span>
                </div>
              </div>
            ) : (
              // Android Install Button
              <button
                onClick={() => {
                  installApp();
                  setIsOpen(false); // Close the drawer automatically when prompt opens
                }}
                className="w-full h-14 bg-primary text-primary-foreground font-bold text-base rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
              >
                <Download className="w-5 h-5" />
                Установить сейчас
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
