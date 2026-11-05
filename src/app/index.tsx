import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { checkAdminAccess } from "../services/admin";

export default function Index() {
  const router = useRouter();

  const BG = "#100D20";
  const CARD = "#1D1833";
  const PURPLE = "#A78BFA";
  const MUTED = "#AAA3C2";
  const BORDER = "#332A4B";

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await checkAdminAccess();

        if (active) {
          router.replace("/(tabs)");
        }
      } catch {
        if (active) {
          router.replace("/(auth)/admin-login");
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-[#100D20]">
      <ActivityIndicator size="large" color="#A78BFA" />
    </View>
  );
}
