/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useEffect, useState } from 'react';

// Define the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import { Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWAInstallPrompt = () => {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && !isStandalone) {
      setTimeout(() => setShowIOSPrompt(true), 1000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showIOSPrompt && !showInstallPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {showIOSPrompt && (
        <div className="mx-4 mb-4 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Install SnapNutrient</h3>
            <button onClick={() => setShowIOSPrompt(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">Install our app for the best experience:</p>
            <div className="flex items-center gap-2 text-sm">
              <span>1. Tap</span>
              <Share2 className="w-4 h-4" />
              <span>below</span>
            </div>
            <p className="text-sm">2. Select &quot;Add to Home Screen&quot;</p>
            <p className="text-sm">3. Tap &quot;Add&quot; to install</p>
          </div>
          <Button 
            onClick={() => setShowIOSPrompt(false)}
            className="w-full"
          >
            Got it
          </Button>
        </div>
      )}

      {showInstallPrompt && (
        <div className="mx-4 mb-4 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Add to home screen for easy access</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowInstallPrompt(false)}
              >
                Later
              </Button>
              <Button onClick={handleInstallClick}>
                Install
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt;