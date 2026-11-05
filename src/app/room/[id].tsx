import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Save, Trash2, Wifi } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    ADMIN_TEAM_ID,
    DATABASE_ID,
    ID,
    Permission,
    Query,
    Role,
    TABLES,
    tablesDB,
} from "../../lib/appwrite";

type Room = {
  $id: string;
  tournamentId: string;
  roomId: string;
  roomPassword: string;
};

const PURPLE = "#A78BFA";

export default function RoomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadRoom() {
    if (!id) return;

    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.rooms,
        queries: [Query.equal("tournamentId", id), Query.limit(1)],
      });

      const existingRoom = response.rows[0] as Room | undefined;

      if (existingRoom) {
        setRoom(existingRoom);
        setRoomId(existingRoom.roomId ?? "");
        setRoomPassword(existingRoom.roomPassword ?? "");
      } else {
        setRoom(null);
        setRoomId("");
        setRoomPassword("");
      }
    } catch (error) {
      console.log("Room loading error:", error);

      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unable to load room details.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
  }, [id]);

  async function handleSave() {
    if (!id) return;

    if (!roomId.trim() || !roomPassword.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both Room ID and Password.",
      );
      return;
    }

    try {
      setSaving(true);

      const data = {
        tournamentId: id,
        roomId: roomId.trim(),
        roomPassword: roomPassword.trim(),
      };

      if (room) {
        const updated = await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.rooms,
          rowId: room.$id,
          data,
        });

        setRoom(updated as Room);

        Alert.alert("Updated", "Room details updated successfully.");
      } else {
        const created = await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.rooms,
          rowId: ID.unique(),
          data,
          permissions: [
            Permission.read(Role.team(ADMIN_TEAM_ID)),
            Permission.update(Role.team(ADMIN_TEAM_ID)),
            Permission.delete(Role.team(ADMIN_TEAM_ID)),
          ],
        });

        setRoom(created as Room);

        Alert.alert("Saved", "Room details saved successfully.");
      }
    } catch (error) {
      console.log("Room save error:", error);

      Alert.alert(
        "Save Failed",
        error instanceof Error ? error.message : "Unable to save room details.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!room) return;

    Alert.alert(
      "Delete Room Details",
      "Are you sure you want to delete these room details?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: TABLES.rooms,
                rowId: room.$id,
              });

              setRoom(null);
              setRoomId("");
              setRoomPassword("");

              Alert.alert("Deleted", "Room details deleted successfully.");
            } catch (error) {
              Alert.alert(
                "Delete Failed",
                error instanceof Error
                  ? error.message
                  : "Unable to delete room details.",
              );
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator size="large" color={PURPLE} />
        <Text className="mt-3 text-sm text-[#AAA3C2]">
          Loading room details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8 mt-4 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-11 w-11 items-center justify-center rounded-xl border border-[#332A4B] bg-[#1D1833]"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View>
            <Text className="text-xs font-bold tracking-[2px] text-[#A78BFA]">
              BOOYAHX ADMIN
            </Text>

            <Text className="mt-1 text-2xl font-extrabold text-white">
              Room Details
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="mb-6 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-5">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#A78BFA]/10">
            <Wifi size={23} color={PURPLE} />
          </View>

          <Text className="mt-4 text-lg font-extrabold text-white">
            Manage Tournament Room
          </Text>

          <Text className="mt-2 text-xs leading-5 text-[#AAA3C2]">
            Add the room ID and password for this tournament. Only authorized
            users should be able to access these details.
          </Text>

          <Text className="mt-3 text-[10px] text-[#827B98]">
            Tournament ID: {id}
          </Text>
        </View>

        {/* Room ID */}
        <Text className="mb-2 text-sm font-semibold text-[#D6D0E5]">
          Room ID
        </Text>

        <View className="mb-5 flex-row items-center rounded-xl border border-[#332A4B] bg-[#1D1833] px-4">
          <Wifi size={18} color={PURPLE} />

          <TextInput
            className="flex-1 p-4 text-white"
            placeholder="Enter Room ID"
            placeholderTextColor="#817A96"
            value={roomId}
            onChangeText={setRoomId}
            autoCapitalize="none"
            editable={!saving}
          />
        </View>

        {/* Room Password */}
        <Text className="mb-2 text-sm font-semibold text-[#D6D0E5]">
          Room Password
        </Text>

        <View className="mb-6 flex-row items-center rounded-xl border border-[#332A4B] bg-[#1D1833] px-4">
          <Lock size={18} color={PURPLE} />

          <TextInput
            className="flex-1 p-4 text-white"
            placeholder="Enter Room Password"
            placeholderTextColor="#817A96"
            value={roomPassword}
            onChangeText={setRoomPassword}
            autoCapitalize="none"
            secureTextEntry
            editable={!saving}
          />
        </View>

        {/* Current Status */}
        <View className="mb-6 rounded-xl border border-[#332A4B] bg-[#1D1833] p-4">
          <Text className="text-xs font-semibold text-[#AAA3C2]">
            ROOM STATUS
          </Text>

          <Text className="mt-2 text-sm font-bold text-white">
            {room ? "Room details configured" : "No room details added"}
          </Text>
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`flex-row items-center justify-center gap-2 rounded-xl bg-[#7C3AED] p-4 ${
            saving ? "opacity-60" : "active:opacity-80"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Save size={18} color="#FFFFFF" />
          )}

          <Text className="font-bold text-white">
            {saving
              ? "Saving..."
              : room
                ? "Update Room Details"
                : "Save Room Details"}
          </Text>
        </Pressable>

        {/* Delete */}
        {room ? (
          <Pressable
            onPress={handleDelete}
            disabled={saving}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4"
          >
            <Trash2 size={17} color="#F87171" />

            <Text className="font-bold text-red-400">Delete Room Details</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
