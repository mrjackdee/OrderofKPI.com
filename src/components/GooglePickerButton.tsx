import React, { useState, useEffect } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { getAccessToken, googleSignIn } from '../lib/googleAuth';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GooglePickerButtonProps {
  className?: string;
  onFileSelect?: (file: any) => void;
}

export default function GooglePickerButton({ className, onFileSelect }: GooglePickerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    let active = true;
    
    const loadGapiScript = () => {
      if (window.gapi) {
        try {
          window.gapi.load('picker', {
            callback: () => {
              if (active) setIsApiReady(true);
            }
          });
        } catch (err) {
          console.warn('Error loading gapi picker:', err);
        }
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]');
      if (existingScript) {
        const check = () => {
          if (!active) return;
          if (window.gapi) {
            try {
              window.gapi.load('picker', {
                callback: () => {
                  if (active) setIsApiReady(true);
                }
              });
            } catch (err) {
              console.warn('Error loading gapi picker:', err);
            }
          } else {
            setTimeout(check, 100);
          }
        };
        check();
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (!active) return;
          if (window.gapi) {
            try {
              window.gapi.load('picker', {
                callback: () => {
                  if (active) setIsApiReady(true);
                }
              });
            } catch (err) {
              console.warn('Error loading gapi picker:', err);
            }
          }
        };
        script.onerror = (e) => {
          console.warn('Failed to load Google API script dynamically:', e);
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error('Failed to append Google API script tag:', err);
      }
    };

    loadGapiScript();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenPicker = async () => {
    if (!isApiReady) return;
    
    setIsLoading(true);
    try {
      let token = await getAccessToken();
      
      if (!token) {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
        } else {
          setIsLoading(false);
          return;
        }
      }

      if (token) {
        createPicker(token);
      }
    } catch (error) {
      console.error('Picker error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPicker = (accessToken: string) => {
    const pickerOrigin = window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          if (onFileSelect) onFileSelect(file);
        }
      })
      .setOrigin(pickerOrigin)
      .build();
    picker.setVisible(true);
  };

  return (
    <button
      onClick={handleOpenPicker}
      disabled={!isApiReady || isLoading}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer ${className}`}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <FolderOpen size={18} />
      )}
      <span className="text-[11px] font-black uppercase tracking-widest">
        {isLoading ? 'Connecting...' : 'Browse Drive'}
      </span>
    </button>
  );
}
