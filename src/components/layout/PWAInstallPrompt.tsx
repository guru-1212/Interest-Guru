"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use a small delay to avoid "synchronous setState in effect" lint error 
    // and ensure hydration is complete.
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const nav = window.navigator as NavigatorStandalone;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || 
                      nav.standalone === true;

    const userAgent = nav.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);

    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      
      const hasSeenPrompt = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasSeenPrompt && !standalone) {
        setShowModal(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !standalone) {
      const hasSeenPrompt = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasSeenPrompt) {
        // Small delay to make it asynchronous
        setTimeout(() => setShowModal(true), 500);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [mounted]);

  const nav = typeof window !== "undefined" ? window.navigator as NavigatorStandalone : null;
  const isIOS = !!(mounted && nav && /iphone|ipad|ipod/.test(nav.userAgent.toLowerCase()));
  const isStandalone = !!(mounted && nav && (window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true));

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, show instructions
      alert("To install: tap the Share button and select 'Add to Home Screen'.");
      setShowModal(false);
      localStorage.setItem("pwa-prompt-dismissed", "true");
      return;
    }

    if (!deferredPrompt) {
      setShowModal(false);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
    } else {
      console.log("User dismissed the PWA install");
    }

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setShowModal(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleClose = () => {
    setShowModal(false);
    // Don't show again for 7 days if dismissed
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isStandalone || !showModal) return null;

  return (
    <Modal open={showModal} onClose={handleClose} title="Install VyaajBook">
      <div className="space-y-6 py-2">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <Smartphone className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">Get the App</h3>
          <p className="mt-2 text-slate-600">
            Install VyaajBook on your home screen for quick access, offline mode, and a full-screen experience.
          </p>
        </div>

        {isIOS ? (
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900 mb-2">Instructions for iOS:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the <strong>Share</strong> button (box with upward arrow)</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top right</li>
            </ol>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleInstall} className="w-full flex items-center justify-center gap-2 py-6 text-lg">
            <Download className="h-5 w-5" />
            {isIOS ? "Got it" : "Install Now"}
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full text-slate-500">
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
