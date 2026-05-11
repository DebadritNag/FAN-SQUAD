import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';

export default function AppLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
