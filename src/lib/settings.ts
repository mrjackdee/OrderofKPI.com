import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface SystemFeatures {
  committee_enabled: boolean;
}

const DEFAULT_FEATURES: SystemFeatures = {
  committee_enabled: false
};

export function useSystemFeatures() {
  const [features, setFeatures] = useState<SystemFeatures>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'system_settings', 'features');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFeatures({ ...DEFAULT_FEATURES, ...docSnap.data() } as SystemFeatures);
      } else {
        // If doc doesn't exist, we can assume defaults
        setFeatures(DEFAULT_FEATURES);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching system features:", error);
      setFeatures(DEFAULT_FEATURES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { features, loading };
}

export async function updateSystemFeature(featureKey: keyof SystemFeatures, value: boolean) {
  const docRef = doc(db, 'system_settings', 'features');
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { ...DEFAULT_FEATURES, [featureKey]: value });
    } else {
      await setDoc(docRef, { [featureKey]: value }, { merge: true });
    }
    return true;
  } catch (error) {
    console.error("Error updating system feature:", error);
    return false;
  }
}
