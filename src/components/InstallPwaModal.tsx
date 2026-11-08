import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, X, Copy, Check, AlertTriangle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isGoogleApp, setIsGoogleApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    // Check if running inside Google Search App or third-party webview on iOS
    const googleApp = /GSA|GoogleApp/i.test(ua) || (/CriOS/i.test(ua) === false && /Safari/i.test(ua) === false && ios);
    setIsIOS(ios);
    setIsGoogleApp(googleApp);
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Install KE Payment Tracker</h3>
              <p className="text-xs text-amber-400 font-medium">Add to Home Screen for 1-Tap App Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* In-App Browser Warning (Google App / WebView) */}
        {isGoogleApp && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2 text-amber-200">
            <div className="flex items-center space-x-2 font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Viewing in Google App</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-100/90">
              Apple restricts Home Screen installation from inside the Google App. You must open this site in <strong>Safari</strong> first:
            </p>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-amber-500/20 space-y-1 text-slate-300">
              <p>1. Tap the <strong>Share</strong> or <strong>...</strong> menu in top-right.</p>
              <p>2. Tap <strong>"Open in Safari"</strong> or <strong>"Default Browser"</strong>.</p>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions for iPhone / iOS */}
        {isIOS ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-medium">Follow these steps in <strong>Safari</strong> on your iPhone:</p>

            <div className="space-y-2.5">
              <div className="flex items-start space-x-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg flex-shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 1: Tap Share Button</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Tap the Share icon <span className="text-blue-400 font-bold">[⎋]</span> at the bottom of Safari (or top right on iPad).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg flex-shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 2: Add to Home Screen</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Scroll down in the Share sheet and tap <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Step 3: Confirm "Add"</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Tap <strong>"Add"</strong> in the top-right corner. The app icon will now appear on your iPhone screen!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-medium">To install on your Android phone or Chrome desktop:</p>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
              <p>1. Tap the browser menu <strong>(Three vertical dots ⋮)</strong> in the top-right.</p>
              <p>2. Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
              <p>3. Confirm install to access the app anytime from your home screen.</p>
            </div>
          </div>
        )}

        {/* Copy Link Helper */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Site Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    window.addEventListener('resize', checkStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('resize', checkStandalone);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  return {
    isInstallable,
    isStandalone,
    showModal,
    setShowModal,
    triggerInstall,
  };
};

export const InstallPwaBanner: React.FC = () => {
  const { isStandalone, showModal, setShowModal, triggerInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('ke_install_banner_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  if (isStandalone || dismissed) {
    return <InstallPwaModal isOpen={showModal} onClose={() => setShowModal(false)} />;
  }

  const handleDismiss = () => {
    sessionStorage.setItem('ke_install_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md border-b border-amber-600/40">
        <div className="flex items-center space-x-2 truncate">
          <Smartphone className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Install KE Payment Tracker on your phone for quick 1-tap access</span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <button
            onClick={triggerInstall}
            className="px-2.5 py-1 bg-slate-950 text-amber-400 hover:text-white rounded-md text-[11px] font-bold shadow-sm transition"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            title="Dismiss"
            className="p-1 hover:bg-amber-600/50 rounded text-slate-950/70 hover:text-slate-950 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <InstallPwaModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
