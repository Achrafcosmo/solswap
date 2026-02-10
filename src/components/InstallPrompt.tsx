"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed before (24h cooldown)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after 2s
    if (isiOS) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-brand-card border border-brand-border rounded-2xl p-5 shadow-2xl animate-slideUp">
        {/* App icon + info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-dark flex items-center justify-center shrink-0 border border-brand-border">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <text x="3" y="24" fontSize="22" fontWeight="bold" fill="#F0B90B" fontFamily="system-ui">S</text>
              <path d="M22 8l-4 16h-2l4-16h2z" fill="#F0B90B" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Install SolSwap</h3>
            <p className="text-brand-muted text-xs mt-0.5">
              Add to your home screen for the best experience
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-5">
          {[
            { icon: "⚡", text: "Instant access from home screen" },
            { icon: "📱", text: "Full-screen native app experience" },
            { icon: "🔄", text: "Faster loads with offline caching" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {isIOS ? (
          /* iOS manual instructions */
          <div className="bg-brand-dark/80 rounded-xl p-3.5 mb-4 border border-brand-border">
            <p className="text-xs text-brand-muted mb-2 font-medium">To install on iOS:</p>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-300 flex items-center gap-2">
                <span>1.</span> Tap the <span className="inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-white font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12l7-7 7 7"/>
                  </svg>
                  Share
                </span> button
              </p>
              <p className="text-xs text-gray-300 flex items-center gap-2">
                <span>2.</span> Scroll down and tap <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-medium">Add to Home Screen</span>
              </p>
              <p className="text-xs text-gray-300 flex items-center gap-2">
                <span>3.</span> Tap <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-medium">Add</span>
              </p>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-brand-muted bg-brand-dark border border-brand-border hover:bg-white/5 transition-all min-h-[44px]"
          >
            Not now
          </button>
          {!isIOS && deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex-1 py-3 rounded-xl btn-gold text-sm min-h-[44px]"
            >
              Install App
            </button>
          ) : isIOS ? (
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl btn-gold text-sm min-h-[44px]"
            >
              Got it!
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
