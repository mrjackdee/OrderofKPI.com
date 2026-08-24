import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UrgentBannerConfig {
  enabled: boolean;
  message: string;
  linkUrl?: string;
  linkText?: string;
  severity?: 'urgent' | 'important' | 'info';
  speed?: 'normal' | 'slow' | 'fast';
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_URGENT_BANNER: UrgentBannerConfig = {
  enabled: false,
  message: "Intake Voting will begin on Wednesday for eligible members",
  linkUrl: "/candidate-voting",
  linkText: "Click Here to Review & Vote",
  severity: "urgent",
  speed: "normal"
};

export interface SystemFeatures {
  committee_enabled: boolean;
  urgent_banner?: UrgentBannerConfig;
}

export const DEFAULT_FEATURES: SystemFeatures = {
  committee_enabled: false,
  urgent_banner: DEFAULT_URGENT_BANNER
};

const STORAGE_KEY = 'kpi_system_features';
const EVENT_NAME = 'kpi_system_features_changed';

function getStoredFeatures(): SystemFeatures {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FEATURES, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_FEATURES;
}

function persistFeaturesLocally(features: SystemFeatures) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: features }));
  } catch (e) {}
}

export function isCommitteeFeatureActive(user: any, features: SystemFeatures): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  const isUserAdmin = role === 'admin' || 
                      email === 'admin@orderofkpi.org' || 
                      email === 'qa.admin@orderofkpi.org' || 
                      email === 'info@kpi2012.org';
  if (isUserAdmin) return true;
  return features.committee_enabled === true;
}

export function useSystemFeatures() {
  const [features, setFeatures] = useState<SystemFeatures>(getStoredFeatures);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Listen for local state changes across components
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent<SystemFeatures>;
      if (customEvent.detail) {
        setFeatures(customEvent.detail);
      }
    };
    window.addEventListener(EVENT_NAME, handleLocalChange);

    // 2. Fetch from Express Backend API (Fast local server cache)
    fetch('/api/system-settings')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.features) {
          const merged: SystemFeatures = {
            ...DEFAULT_FEATURES,
            ...data.features,
            urgent_banner: {
              ...DEFAULT_URGENT_BANNER,
              ...(data.features.urgent_banner || {})
            }
          };
          setFeatures(merged);
          persistFeaturesLocally(merged);
        }
      })
      .catch(() => {});

    // 3. Real-time Firestore sync (Cloud authority)
    let unsubscribe = () => {};
    try {
      const docRef = doc(db, 'system_settings', 'features');
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const cloudFeatures: SystemFeatures = {
            ...DEFAULT_FEATURES,
            ...data,
            urgent_banner: {
              ...DEFAULT_URGENT_BANNER,
              ...(data.urgent_banner || {})
            }
          };
          setFeatures(cloudFeatures);
          persistFeaturesLocally(cloudFeatures);
        }
        setLoading(false);
      }, (error) => {
        console.warn("Firestore settings sync listener notice:", error.message || error);
        setLoading(false);
      });
    } catch (err) {
      console.warn("Firestore settings init notice:", err);
      setLoading(false);
    }

    return () => {
      window.removeEventListener(EVENT_NAME, handleLocalChange);
      unsubscribe();
    };
  }, []);

  return { features, loading };
}

export async function updateSystemFeature(featureKey: keyof SystemFeatures, value: boolean): Promise<boolean> {
  const current = getStoredFeatures();
  const nextFeatures: SystemFeatures = {
    ...current,
    [featureKey]: value
  };

  // Immediate optimistic update
  persistFeaturesLocally(nextFeatures);

  let cloudSuccess = false;
  let backendSuccess = false;

  // 1. Dual-Write to Cloud Firestore
  try {
    const docRef = doc(db, 'system_settings', 'features');
    await setDoc(docRef, nextFeatures, { merge: true });
    cloudSuccess = true;
  } catch (error) {
    console.warn("Firestore update system feature notice:", error);
  }

  // 2. Dual-Write to Express Backend API
  try {
    const res = await fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: nextFeatures })
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (backendError) {
    console.warn("Backend update system feature notice:", backendError);
  }

  // Considered successful if at least one target accepted the write
  return cloudSuccess || backendSuccess;
}

export async function updateUrgentBannerConfig(bannerConfig: Partial<UrgentBannerConfig>): Promise<boolean> {
  const current = getStoredFeatures();
  const mergedBanner: UrgentBannerConfig = {
    ...DEFAULT_URGENT_BANNER,
    ...(current.urgent_banner || {}),
    ...bannerConfig,
    updatedAt: new Date().toISOString()
  };

  const nextFeatures: SystemFeatures = {
    ...current,
    urgent_banner: mergedBanner
  };

  persistFeaturesLocally(nextFeatures);

  let cloudSuccess = false;
  let backendSuccess = false;

  try {
    const docRef = doc(db, 'system_settings', 'features');
    await setDoc(docRef, nextFeatures, { merge: true });
    cloudSuccess = true;
  } catch (error) {
    console.warn("Firestore update banner notice:", error);
  }

  try {
    const res = await fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: nextFeatures })
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (backendError) {
    console.warn("Backend update banner notice:", backendError);
  }

  return cloudSuccess || backendSuccess;
}
