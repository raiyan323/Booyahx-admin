import "@/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { checkAdminAccess } from "../services/admin";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments.join("/");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const inAuth = segments[0] === "(auth)";

      try {
        // Existing session + Admin Team membership check
        await checkAdminAccess();

        if (!active) return;

        // Already logged in: don't show login again
        if (inAuth) {
          router.replace("./(tabs)/index");
        }
      } catch (error) {
        if (!active) return;

        // No valid Admin session
        if (!inAuth) {
          router.replace("/(auth)/admin-login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [currentRoute, router]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-[#100D20]">
          <ActivityIndicator size="large" color="#A78BFA" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tournament/[id]" />
        <Stack.Screen name="room/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
