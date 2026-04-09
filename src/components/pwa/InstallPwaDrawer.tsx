"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "@/hooks/usePWAInstall";

export default function InstallPwaDrawer() {
  const { deferredPrompt, isIOS, isStandalone, installApp } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 🚨 DEBUG MODE: Change to 'true' to force the drawer to open so you can test the UI!
  const FORCE_SHOW_DEBUG = false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 1. Check if the user already clicked "X" in the past
    const hasDismissed = localStorage.getItem("pwa_drawer_dismissed");
    if (hasDismissed === "true" && !FORCE_SHOW_DEBUG) {
      return;
    }

    // 2. Logic: If debug mode is ON, or (not installed AND (android prompt exists OR iOS))
    const isEligible =
      FORCE_SHOW_DEBUG || (!isStandalone && (deferredPrompt || isIOS));

    if (isEligible) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS, isStandalone, mounted]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Remember that the user closed this so it doesn't pop up on every page load
    localStorage.setItem("pwa_drawer_dismissed", "true");
  };

  // Do not render anything during SSR
  if (!mounted) return null;

  // Hide if already installed (unless debugging)
  if (isStandalone && !FORCE_SHOW_DEBUG) return null;

  // Hide if the browser isn't allowing installation (unless debugging)
  if (!deferredPrompt && !isIOS && !FORCE_SHOW_DEBUG) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background z-[9999] p-6 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-border/50"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
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
                onClick={handleDismiss}
                className="p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors shrink-0"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {isIOS ? (
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
              <button
                onClick={() => {
                  installApp();
                  setIsOpen(false);
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
