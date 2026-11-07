import '../src/styles/global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/providers/theme';
import { SessionProvider } from '../src/providers/session';
import { ErrorBoundary } from '../src/components/error-boundary';

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <ErrorBoundary>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }} />
            </ErrorBoundary>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
