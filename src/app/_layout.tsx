import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LockGate } from '../components/LockGate';
import { StoreProvider } from '../lib/store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <LockGate>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </LockGate>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
