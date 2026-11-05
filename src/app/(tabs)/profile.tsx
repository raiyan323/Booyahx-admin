import { useFocusEffect, useRouter } from "expo-router";
import {
    LogOut,
    Mail,
    RefreshCw,
    Shield,
    ShieldCheck,
    User,
    Users,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { checkAdminAccess } from "../../services/admin";
import { logout } from "../../services/auth";

type AdminUser = {
  $id: string;
  name: string;
  email: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const loadAdmin = useCallback(async () => {
    try {
      setError("");

      const user = await checkAdminAccess();
      setAdmin(user);
    } catch (err: unknown) {
      console.log("Admin profile error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load admin account.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchAdmin = async () => {
        try {
          setError("");

          const user = await checkAdminAccess();

          if (active) {
            setAdmin(user);
          }
        } catch (err: unknown) {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to load admin account.",
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      fetchAdmin();

      return () => {
        active = false;
      };
    }, []),
  );

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout from BooyahX Admin?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);

              await logout();

              router.replace("/(auth)/admin-login");
            } catch (err: unknown) {
              Alert.alert(
                "Logout Failed",
                err instanceof Error ? err.message : "Unable to logout.",
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator color="#A78BFA" size="large" />

        <Text className="mt-4 text-sm text-[#AAA3C2]">
          Loading admin profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-xs font-bold tracking-[3px] text-[#A78BFA]">
            BOOYAHX ADMIN
          </Text>

          <Text className="mt-2 text-3xl font-extrabold text-white">
            My Account
          </Text>

          <Text className="mt-1 text-sm text-[#827B98]">
            Admin account and security information.
          </Text>
        </View>

        {error ? (
          <View className="rounded-2xl border border-red-400/20 bg-[#291A2A] p-5">
            <Text className="font-bold text-red-300">
              Unable to verify admin account
            </Text>

            <Text className="mt-2 text-sm leading-6 text-[#D5A9B5]">
              {error}
            </Text>

            <Pressable
              onPress={loadAdmin}
              className="mt-4 flex-row items-center justify-center gap-2 self-start rounded-xl bg-[#452638] px-4 py-3"
            >
              <RefreshCw size={14} color="#FCA5A5" />

              <Text className="text-xs font-bold text-red-200">Try Again</Text>
            </Pressable>
          </View>
        ) : admin ? (
          <>
            {/* Admin Card */}
            <View className="items-center rounded-3xl border border-[#49366C] bg-[#211936] px-5 py-7">
              <View className="h-24 w-24 items-center justify-center rounded-full border border-[#A78BFA]/30 bg-[#A78BFA]/15">
                <Text className="text-4xl font-extrabold text-[#C4B5FD]">
                  {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                </Text>
              </View>

              <Text className="mt-4 text-xl font-extrabold text-white">
                {admin.name || "BooyahX Admin"}
              </Text>

              <View className="mt-3 flex-row items-center gap-2 rounded-full border border-[#A78BFA]/20 bg-[#A78BFA]/10 px-3 py-1.5">
                <ShieldCheck size={13} color="#C4B5FD" />

                <Text className="text-[10px] font-bold tracking-wider text-[#C4B5FD]">
                  VERIFIED ADMIN
                </Text>
              </View>

              <Text className="mt-4 text-center text-xs text-[#827B98]">
                BooyahX Administration Panel
              </Text>
            </View>

            {/* Account Information */}
            <Text className="mb-3 mt-8 text-base font-bold text-white">
              Account Information
            </Text>

            <View className="overflow-hidden rounded-2xl border border-[#332A4B] bg-[#1D1833]">
              <View className="flex-row items-center gap-3 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A78BFA]/10">
                  <User size={18} color="#A78BFA" />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] text-[#827B98]">Admin Name</Text>

                  <Text className="mt-1 font-semibold text-white">
                    {admin.name || "Not available"}
                  </Text>
                </View>
              </View>

              <View className="mx-4 h-px bg-[#332A4B]" />

              <View className="flex-row items-center gap-3 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A78BFA]/10">
                  <Mail size={18} color="#A78BFA" />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] text-[#827B98]">
                    Email Address
                  </Text>

                  <Text className="mt-1 font-semibold text-white">
                    {admin.email}
                  </Text>
                </View>
              </View>

              <View className="mx-4 h-px bg-[#332A4B]" />

              <View className="flex-row items-center gap-3 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A78BFA]/10">
                  <Shield size={18} color="#A78BFA" />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] text-[#827B98]">Account ID</Text>

                  <Text
                    className="mt-1 text-xs font-semibold text-white"
                    selectable
                  >
                    {admin.$id}
                  </Text>
                </View>
              </View>
            </View>

            {/* Admin Team */}
            <Text className="mb-3 mt-7 text-base font-bold text-white">
              Administration
            </Text>

            <View className="flex-row items-center gap-3 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#A78BFA]/10">
                <Users size={20} color="#A78BFA" />
              </View>

              <View className="flex-1">
                <Text className="font-bold text-white">BooyahX Admins</Text>

                <Text className="mt-1 text-xs text-[#AAA3C2]">
                  Admin team membership verified.
                </Text>
              </View>

              <ShieldCheck size={20} color="#4ADE80" />
            </View>

            {/* Logout */}
            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              className={`mt-8 flex-row items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 ${
                loggingOut ? "opacity-60" : "active:opacity-70"
              }`}
            >
              {loggingOut ? (
                <ActivityIndicator color="#FCA5A5" />
              ) : (
                <LogOut size={18} color="#FCA5A5" />
              )}

              <Text className="font-bold text-[#FCA5A5]">
                {loggingOut ? "Logging out..." : "Logout"}
              </Text>
            </Pressable>
          </>
        ) : null}

        <Text className="mt-8 text-center text-[10px] tracking-widest text-[#625B78]">
          BOOYAHX ADMIN PANEL
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
