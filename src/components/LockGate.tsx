import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { biometricAvailable, biometricUnlock, checkPin } from '../lib/pin';
import { useStore } from '../lib/store';
import { PinPad } from './PinPad';
import { Btn } from './ui';

/** Re-lock if the app was in the background for longer than this (photo picker etc. stays unlocked). */
const GRACE_MS = 60_000;

export function LockGate({ children }: { children: React.ReactNode }) {
  const { data } = useStore();
  const enabled = data.settings.pinEnabled;
  const [locked, setLocked] = useState(enabled);
  const [canBio, setCanBio] = useState(false);
  const leftAt = useRef<number | null>(null);

  useEffect(() => {
    biometricAvailable().then(setCanBio);
  }, []);


  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background') leftAt.current = Date.now();
      if (st === 'active' && leftAt.current && enabled && Date.now() - leftAt.current > GRACE_MS) setLocked(true);
      if (st === 'active') leftAt.current = null;
    });
    return () => sub.remove();
  }, [enabled]);

  const tryBio = useCallback(async () => {
    if (await biometricUnlock()) setLocked(false);
  }, []);

  const showLock = enabled && locked;
  useEffect(() => {
    if (!showLock || !data.settings.biometric || !canBio) return;
    biometricUnlock().then((ok) => {
      if (ok) setLocked(false);
    });
  }, [showLock, canBio, data.settings.biometric]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showLock && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} testID="lock-screen">
          <PinPad
            title="Welcome back"
            subtitle="Enter your PIN"
            onComplete={async (p) => {
              const ok = await checkPin(p);
              if (ok) setLocked(false);
              return ok;
            }}
            extra={
              data.settings.biometric && canBio ? (
                <View style={{ marginTop: 22 }}>
                  <Btn label="Use Face ID / fingerprint" kind="ghost" onPress={tryBio} />
                </View>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}
