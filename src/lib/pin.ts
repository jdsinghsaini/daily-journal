import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { secureGet, secureSet } from './storage';

const PIN_KEY = 'journal_pin_hash';

export const hashPin = (pin: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'daily-journal:' + pin);

export async function setPin(pin: string | null) {
  await secureSet(PIN_KEY, pin === null ? null : await hashPin(pin));
}

export async function checkPin(pin: string) {
  const stored = await secureGet(PIN_KEY);
  return !!stored && stored === (await hashPin(pin));
}

export async function biometricAvailable() {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function biometricUnlock() {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your journal',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return r.success;
  } catch {
    return false;
  }
}
