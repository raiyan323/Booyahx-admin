import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { account } from "../../lib/appwrite";
import { checkAdminAccess } from "../../services/admin";

export default function AdminLoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      // Check existing session first
      let user;

      try {
        user = await account.get();
      } catch {
        // No active session, create a new one
        await account.createEmailPasswordSession({
          email: email.trim(),
          password,
        });

        user = await account.get();
      }

      // Verify Admin Team membership
      await checkAdminAccess();

      // Go directly to Admin Dashboard
      router.replace("../(tabs)/index");
    } catch (error: any) {
      console.log("Admin login error:", error);

      setError(error?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center bg-[#100D20] px-6">
      <View className="mb-10 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-[#30204F]">
          <Text className="text-3xl font-black text-[#C4B5FD]">BX</Text>
        </View>

        <Text className="mt-5 text-3xl font-bold text-white">
          BooyahX Admin
        </Text>

        <Text className="mt-2 text-sm text-[#AAA3C2]">
          Sign in to manage your tournaments
        </Text>
      </View>

      <Text className="mb-2 text-sm font-medium text-[#D6D0E5]">Email</Text>

      <TextInput
        className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
        placeholder="Admin email"
        placeholderTextColor="#817A96"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <Text className="mb-2 mt-5 text-sm font-medium text-[#D6D0E5]">
        Password
      </Text>

      <TextInput
        className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
        placeholder="Enter password"
        placeholderTextColor="#817A96"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
        onSubmitEditing={handleLogin}
        returnKeyType="done"
      />

      <Pressable
        className={`mt-7 items-center rounded-xl bg-[#7C3AED] p-4 ${
          loading ? "opacity-60" : "active:opacity-80"
        }`}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-bold text-white">Admin Login</Text>
        )}
      </Pressable>

      <Text className="mt-6 text-center text-xs text-[#817A96]">
        Authorized administrators only
      </Text>
    </SafeAreaView>
  );
}
