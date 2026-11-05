import { router, useFocusEffect, useRouter } from "expo-router";

import {
    CalendarDays,
    Clock,
    Edit3,
    MapPin,
    Plus,
    Shield,
    Trash2,
    Trophy,
    Users,
    Wifi,
    X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
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

import type { Tournament } from "../../types";

type Visibility = "public" | "private";
type TournamentStatus = "upcoming" | "live" | "completed" | "cancelled";

const PURPLE = "#A78BFA";
const MUTED = "#AAA3C2";

const MODES = ["Battle Royale", "Clash Squad"];
const MAPS = ["Bermuda", "Purgatory", "Kalahari", "Alpine", "NexTerra"];
const TEAM_TYPES = ["Solo", "Duo", "Squad"];

const STATUSES: TournamentStatus[] = [
  "upcoming",
  "live",
  "completed",
  "cancelled",
];

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  const styles: Record<string, { text: string; bg: string }> = {
    upcoming: {
      text: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    live: {
      text: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    completed: {
      text: "text-sky-400",
      bg: "bg-sky-400/10",
    },
    cancelled: {
      text: "text-red-400",
      bg: "bg-red-400/10",
    },
  };

  const style = styles[normalized] ?? styles.upcoming;

  return (
    <View className={`rounded-full px-3 py-1.5 ${style.bg}`}>
      <Text className={`text-[10px] font-extrabold uppercase ${style.text}`}>
        {normalized || "upcoming"}
      </Text>
    </View>
  );
}

function OptionSelector({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View className="mt-5">
      <Text className="mb-3 text-sm font-semibold text-[#D6D0E5]">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;

          return (
            <Pressable
              key={option}
              disabled={disabled}
              onPress={() => onChange(option)}
              className={`rounded-xl border px-4 py-3 ${
                active
                  ? "border-[#7C3AED] bg-[#7C3AED]/20"
                  : "border-[#332A4B] bg-[#1D1833]"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? "text-[#C4B5FD]" : "text-[#AAA3C2]"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TournamentCard({
  tournament,
  onEdit,
  onDelete,
}: {
  tournament: Tournament;
  onEdit: (item: Tournament) => void;
  onDelete: (item: Tournament) => void;
}) {
  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-[#332A4B] bg-[#1D1833]">
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-base font-extrabold text-white">
              {tournament.title}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">
              {tournament.description || "No description"}
            </Text>
          </View>

          <StatusBadge status={tournament.status} />
        </View>

        <View className="my-4 h-px bg-[#332A4B]" />

        <View className="flex-row flex-wrap gap-x-5 gap-y-3">
          <View className="flex-row items-center gap-2">
            <Trophy size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">{tournament.mode}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <MapPin size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">{tournament.map}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Users size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">
              {tournament.teamType}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Shield size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">
              {tournament.visibility}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Users size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">
              {tournament.maxSlots} slots
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <CalendarDays size={14} color={PURPLE} />
            <Text className="text-xs text-[#AAA3C2]">
              {tournament.startAt || "Date not set"}
            </Text>
          </View>
        </View>

        <View className="my-4 h-px bg-[#332A4B]" />

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => onEdit(tournament)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#A78BFA]/10 p-3 active:opacity-70"
          >
            <Edit3 size={15} color={PURPLE} />
            <Text className="text-xs font-bold text-[#C4B5FD]">Edit</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(tournament)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-red-400/10 p-3 active:opacity-70"
          >
            <Trash2 size={15} color="#F87171" />
            <Text className="text-xs font-bold text-red-400">Delete</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/room/${tournament.$id}`)}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-[#332A4B] bg-[#A78BFA]/10 p-3 active:opacity-70"
          >
            <Wifi size={15} color="#A78BFA" />
            <Text className="text-xs font-bold text-[#C4B5FD]">
              Manage Room
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("Battle Royale");
  const [map, setMap] = useState("Bermuda");
  const [teamType, setTeamType] = useState("Squad");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [startAt, setStartAt] = useState("");
  const [maxSlots, setMaxSlots] = useState("48");
  const [status, setStatus] = useState<TournamentStatus>("upcoming");

  // Load tournaments
  const loadTournaments = useCallback(
    async (isActive: () => boolean = () => true) => {
      try {
        setError("");

        const response = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: TABLES.tournaments,
          queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
        });

        if (isActive()) {
          setTournaments((response.rows ?? []) as Tournament[]);
        }
      } catch (err: unknown) {
        console.log("Tournament loading error:", err);

        if (isActive()) {
          setError(
            err instanceof Error ? err.message : "Unable to load tournaments.",
          );
        }
      } finally {
        if (isActive()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadTournaments(() => active);

      return () => {
        active = false;
      };
    }, [loadTournaments]),
  );

  // Reset form
  function resetForm() {
    setTitle("");
    setDescription("");
    setMode("Battle Royale");
    setMap("Bermuda");
    setTeamType("Squad");
    setVisibility("public");
    setStartAt("");
    setMaxSlots("48");
    setStatus("upcoming");
    setEditingTournament(null);
  }

  // Create modal
  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  // Edit modal
  function openEditModal(item: Tournament) {
    setEditingTournament(item);

    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setMode(item.mode ?? "Battle Royale");
    setMap(item.map ?? "Bermuda");
    setTeamType(item.teamType ?? "Squad");
    setVisibility(item.visibility ?? "public");
    setStartAt(item.startAt ?? "");
    setMaxSlots(String(item.maxSlots ?? 48));

    const allowedStatuses: TournamentStatus[] = [
      "upcoming",
      "live",
      "completed",
      "cancelled",
    ];

    setStatus(
      allowedStatuses.includes(item.status as TournamentStatus)
        ? (item.status as TournamentStatus)
        : "upcoming",
    );

    setModalVisible(true);
  }

  function closeModal() {
    if (saving) return;

    setModalVisible(false);
    resetForm();
  }

  // Save tournament
  async function handleSave() {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanStartAt = startAt.trim();
    const slots = Number(maxSlots);

    if (!cleanTitle || !cleanDescription) {
      Alert.alert(
        "Missing Information",
        "Please enter tournament title and description.",
      );
      return;
    }

    if (!cleanStartAt) {
      Alert.alert(
        "Missing Start Time",
        "Please enter the tournament start date and time.",
      );
      return;
    }

    if (!Number.isInteger(slots) || slots < 1) {
      Alert.alert(
        "Invalid Slots",
        "Maximum slots must be a positive whole number.",
      );
      return;
    }

    const parsedDate = new Date(cleanStartAt);

    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert(
        "Invalid Date",
        "Enter a valid date and time, for example: 2026-12-20 18:30",
      );
      return;
    }

    const data = {
      title: cleanTitle,
      description: cleanDescription,
      mode,
      map,
      teamType,
      visibility,
      startAt: cleanStartAt,
      maxSlots: slots,
      status,
    };

    try {
      setSaving(true);

      if (editingTournament) {
        const updated = await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.tournaments,
          rowId: editingTournament.$id,
          data,
        });

        setTournaments((previous) =>
          previous.map((item) =>
            item.$id === editingTournament.$id ? (updated as Tournament) : item,
          ),
        );

        Alert.alert("Updated", "Tournament has been updated successfully.");
      } else {
        const created = await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.tournaments,
          rowId: ID.unique(),
          data,
          permissions: [
            Permission.read(Role.any()),
            Permission.update(Role.team(ADMIN_TEAM_ID)),
            Permission.delete(Role.team(ADMIN_TEAM_ID)),
          ],
        });

        setTournaments((previous) => [created as Tournament, ...previous]);

        Alert.alert("Published", "Tournament has been created successfully.");
      }

      setModalVisible(false);
      resetForm();
    } catch (err: unknown) {
      console.log("Tournament save error:", err);

      Alert.alert(
        editingTournament ? "Update Failed" : "Create Failed",
        err instanceof Error ? err.message : "Unable to save tournament.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete tournament
  function handleDelete(item: Tournament) {
    Alert.alert(
      "Delete Tournament",
      `Are you sure you want to delete "${item.title}"?`,
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
                tableId: TABLES.tournaments,
                rowId: item.$id,
              });

              setTournaments((previous) =>
                previous.filter((tournament) => tournament.$id !== item.$id),
              );

              Alert.alert("Deleted", "Tournament has been deleted.");
            } catch (err: unknown) {
              console.log("Tournament delete error:", err);

              Alert.alert(
                "Delete Failed",
                err instanceof Error
                  ? err.message
                  : "Unable to delete tournament.",
              );
            }
          },
        },
      ],
    );
  }

  function handleRefresh() {
    setRefreshing(true);
    loadTournaments();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator size="large" color={PURPLE} />
        <Text className="mt-3 text-sm text-[#AAA3C2]">
          Loading tournaments...
        </Text>
      </SafeAreaView>
    );
  }

  const upcomingCount = tournaments.filter(
    (item) => item.status === "upcoming",
  ).length;

  const liveCount = tournaments.filter((item) => item.status === "live").length;

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
      >
        {/* Header */}
        <View className="mb-6 mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold tracking-[3px] text-[#A78BFA]">
              BOOYAHX ADMIN
            </Text>

            <Text className="mt-2 text-3xl font-extrabold text-white">
              Tournaments
            </Text>

            <Text className="mt-1 text-sm text-[#827B98]">
              Create and manage competitions.
            </Text>
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl border border-[#332A4B] bg-[#1D1833]">
            <Trophy size={21} color={PURPLE} />
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={openCreateModal}
          className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] p-4 active:opacity-80"
        >
          <Plus size={19} color="#FFFFFF" />
          <Text className="font-bold text-white">Create Tournament</Text>
        </Pressable>

        {/* Statistics */}
        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
            <Trophy size={18} color={PURPLE} />
            <Text className="mt-3 text-2xl font-extrabold text-white">
              {tournaments.length}
            </Text>
            <Text className="mt-1 text-xs text-[#AAA3C2]">Total</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
            <Clock size={18} color="#FBBF24" />
            <Text className="mt-3 text-2xl font-extrabold text-white">
              {upcomingCount}
            </Text>
            <Text className="mt-1 text-xs text-[#AAA3C2]">Upcoming</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
            <Users size={18} color="#4ADE80" />
            <Text className="mt-3 text-2xl font-extrabold text-white">
              {liveCount}
            </Text>
            <Text className="mt-1 text-xs text-[#AAA3C2]">Live</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-5 rounded-2xl border border-red-400/20 bg-[#291A2A] p-4">
            <Text className="font-bold text-red-300">
              Unable to load tournaments
            </Text>

            <Text className="mt-2 text-xs leading-5 text-[#D5A9B5]">
              {error}
            </Text>

            <Pressable
              onPress={handleRefresh}
              className="mt-4 self-start rounded-xl bg-[#452638] px-4 py-2.5"
            >
              <Text className="text-xs font-bold text-red-200">Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {/* List Heading */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-white">
            All Tournaments
          </Text>

          <Text className="text-xs text-[#827B98]">
            {tournaments.length} tournaments
          </Text>
        </View>

        {/* Tournament List */}
        {!error && tournaments.length > 0
          ? tournaments.map((item) => (
              <TournamentCard
                key={item.$id}
                tournament={item}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          : null}

        {/* Empty State */}
        {!error && tournaments.length === 0 ? (
          <View className="items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#A78BFA]/10">
              <Trophy size={27} color={PURPLE} />
            </View>

            <Text className="mt-4 text-base font-bold text-white">
              No tournaments yet
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-[#AAA3C2]">
              Create your first tournament to get started.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/70">
          <SafeAreaView
            className="max-h-[92%] rounded-t-3xl border border-[#49366C] bg-[#171329]"
            edges={["bottom"]}
          >
            <ScrollView
              className="px-5 pt-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View className="mb-6 flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-extrabold text-white">
                    {editingTournament
                      ? "Edit Tournament"
                      : "Create Tournament"}
                  </Text>

                  <Text className="mt-1 text-xs text-[#AAA3C2]">
                    Configure your tournament details.
                  </Text>
                </View>

                <Pressable
                  onPress={closeModal}
                  disabled={saving}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-[#29223E]"
                >
                  <X size={19} color={MUTED} />
                </Pressable>
              </View>

              {/* Title */}
              <Text className="mb-2 text-sm font-semibold text-[#D6D0E5]">
                Tournament Title
              </Text>

              <TextInput
                className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
                placeholder="Enter tournament title"
                placeholderTextColor="#817A96"
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                editable={!saving}
              />

              {/* Description */}
              <Text className="mb-2 mt-5 text-sm font-semibold text-[#D6D0E5]">
                Description
              </Text>

              <TextInput
                className="min-h-24 rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-sm leading-6 text-white"
                placeholder="Write tournament details..."
                placeholderTextColor="#817A96"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                editable={!saving}
              />

              {/* Mode */}
              <OptionSelector
                label="Game Mode"
                options={MODES}
                value={mode}
                onChange={setMode}
                disabled={saving}
              />

              {/* Map */}
              <OptionSelector
                label="Map"
                options={MAPS}
                value={map}
                onChange={setMap}
                disabled={saving}
              />

              {/* Team Type */}
              <OptionSelector
                label="Team Type"
                options={TEAM_TYPES}
                value={teamType}
                onChange={setTeamType}
                disabled={saving}
              />

              {/* Visibility */}
              <OptionSelector
                label="Visibility"
                options={["public", "private"]}
                value={visibility}
                onChange={(value) => setVisibility(value as Visibility)}
                disabled={saving}
              />

              {/* Start Date */}
              <Text className="mb-2 mt-5 text-sm font-semibold text-[#D6D0E5]">
                Start Date & Time
              </Text>

              <TextInput
                className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
                placeholder="2026-12-20 18:30"
                placeholderTextColor="#817A96"
                value={startAt}
                onChangeText={setStartAt}
                editable={!saving}
                autoCapitalize="none"
              />

              <Text className="mt-2 text-[11px] leading-5 text-[#827B98]">
                Use a date and time such as 2026-12-20 18:30.
              </Text>

              {/* Max Slots */}
              <Text className="mb-2 mt-5 text-sm font-semibold text-[#D6D0E5]">
                Maximum Slots
              </Text>

              <TextInput
                className="rounded-xl border border-[#332A4B] bg-[#1D1833] p-4 text-white"
                placeholder="48"
                placeholderTextColor="#817A96"
                value={maxSlots}
                onChangeText={(value) =>
                  setMaxSlots(value.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                editable={!saving}
              />

              {/* Status */}
              <OptionSelector
                label="Tournament Status"
                options={STATUSES}
                value={status}
                onChange={(value) => setStatus(value as TournamentStatus)}
                disabled={saving}
              />

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className={`mb-7 mt-7 flex-row items-center justify-center gap-2 rounded-xl bg-[#7C3AED] p-4 ${
                  saving ? "opacity-60" : "active:opacity-80"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : editingTournament ? (
                  <Edit3 size={17} color="#FFFFFF" />
                ) : (
                  <Plus size={18} color="#FFFFFF" />
                )}

                <Text className="font-bold text-white">
                  {saving
                    ? "Saving..."
                    : editingTournament
                      ? "Save Changes"
                      : "Publish Tournament"}
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
