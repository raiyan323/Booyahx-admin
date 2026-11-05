import { Link, useFocusEffect } from "expo-router";
import {
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Gamepad2,
    Newspaper,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trophy
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTournaments } from "../../services/tournaments";
import type { Tournament } from "../../types";

type TournamentWithPrize = Tournament & {
  prizePool?: string;
};

const PURPLE = "#A78BFA";
const MUTED = "#AAA3C2";

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
};

function StatCard({ label, value, icon, color = PURPLE }: StatCardProps) {
  return (
    <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-[#A78BFA]/10">
        {icon}
      </View>

      <Text className="text-2xl font-extrabold text-white">{value}</Text>

      <Text className="mt-1 text-xs text-[#AAA3C2]">{label}</Text>
    </View>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
};

function ActionCard({ title, description, icon, href }: ActionCardProps) {
  return (
    <Link href={href as never} asChild>
      <Pressable className="mb-3 flex-row items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4 active:opacity-70">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#A78BFA]/10">
          {icon}
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold text-white">{title}</Text>

          <Text className="mt-1 text-xs text-[#AAA3C2]">{description}</Text>
        </View>

        <ChevronRight size={18} color={MUTED} />
      </Pressable>
    </Link>
  );
}

function formatDate(date?: string) {
  if (!date) return "Not announced";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not announced";
  }

  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RecentTournament({ item }: { item: TournamentWithPrize }) {
  const status = item.status?.toLowerCase() || "unknown";

  return (
    <Link
      href={{
        pathname: "/tournament/[id]",
        params: { id: item.$id },
      }}
      asChild
    >
      <Pressable className="mb-3 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4 active:opacity-70">
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 pr-3 text-sm font-bold text-white"
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <View
            className={`rounded-full px-3 py-1 ${
              status === "upcoming"
                ? "bg-emerald-400/10"
                : status === "ongoing"
                  ? "bg-sky-400/10"
                  : status === "ended"
                    ? "bg-[#827B98]/15"
                    : "bg-amber-400/10"
            }`}
          >
            <Text
              className={`text-[10px] font-bold capitalize ${
                status === "upcoming"
                  ? "text-emerald-400"
                  : status === "ongoing"
                    ? "text-sky-400"
                    : status === "ended"
                      ? "text-[#AAA3C2]"
                      : "text-amber-400"
              }`}
            >
              {status}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <CalendarDays size={13} color={MUTED} />

          <Text className="text-xs text-[#AAA3C2]">
            {formatDate(item.startAt)}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-[#827B98]">
            {item.mode || "Battle"} · {item.map || "Map"}
          </Text>

          <ChevronRight size={16} color={PURPLE} />
        </View>
      </Pressable>
    </Link>
  );
}

export default function DashboardScreen() {
  const [tournaments, setTournaments] = useState<TournamentWithPrize[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await getTournaments();
      const rows = Array.isArray(response.rows) ? response.rows : [];

      setTournaments(rows as TournamentWithPrize[]);
    } catch (err: unknown) {
      console.log("Admin dashboard error:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const upcomingCount = tournaments.filter(
    (item) => item.status?.toLowerCase() === "upcoming",
  ).length;

  const ongoingCount = tournaments.filter(
    (item) => item.status?.toLowerCase() === "ongoing",
  ).length;

  const endedCount = tournaments.filter(
    (item) => item.status?.toLowerCase() === "ended",
  ).length;

  const recentTournaments = [...tournaments]
    .sort(
      (a, b) =>
        new Date(b.$createdAt || 0).getTime() -
        new Date(a.$createdAt || 0).getTime(),
    )
    .slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator size="large" color={PURPLE} />

        <Text className="mt-4 text-sm text-[#AAA3C2]">
          Loading Admin Dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top"]}>
      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => "dashboard"}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className="mb-7 mt-4 flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center">
                  <Text className="text-2xl font-black tracking-tight text-white">
                    BOOYAH
                  </Text>

                  <Text className="text-2xl font-black text-[#A78BFA]">X</Text>

                  <View className="ml-2 rounded-md bg-[#A78BFA]/15 px-2 py-1">
                    <Text className="text-[9px] font-extrabold text-[#C4B5FD]">
                      ADMIN
                    </Text>
                  </View>
                </View>

                <Text className="mt-1 text-xs text-[#827B98]">
                  Tournament management panel
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-2xl border border-[#332A4B] bg-[#1D1833]">
                <ShieldCheck size={21} color={PURPLE} />
              </View>
            </View>

            {/* Welcome */}
            <View className="mb-6 overflow-hidden rounded-3xl border border-[#49366C] bg-[#211936] p-5">
              <View className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#A78BFA]/10" />

              <View className="flex-row items-center gap-2">
                <Gamepad2 size={15} color={PURPLE} />

                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-[#C4B5FD]">
                  Admin Control Center
                </Text>
              </View>

              <Text className="mt-4 text-2xl font-extrabold leading-8 text-white">
                Manage your{"\n"}
                <Text className="text-[#A78BFA]">gaming arena.</Text>
              </Text>

              <Text className="mt-3 text-sm leading-6 text-[#AAA3C2]">
                Manage tournaments, review player requests, configure rooms and
                publish results.
              </Text>

              <Link href="/(tabs)/tournaments" asChild>
                <Pressable className="mt-5 flex-row items-center justify-center gap-2 self-start rounded-xl bg-[#7C3AED] px-4 py-3 active:opacity-80">
                  <Plus size={16} color="#FFFFFF" />

                  <Text className="text-xs font-bold text-white">
                    Create Tournament
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* Statistics */}
            <View className="mb-3">
              <Text className="text-lg font-extrabold text-white">
                Overview
              </Text>

              <Text className="mt-1 text-xs text-[#827B98]">
                Your tournament statistics
              </Text>
            </View>

            <View className="mb-3 flex-row gap-3">
              <StatCard
                label="Total Tournaments"
                value={tournaments.length}
                icon={<Trophy size={19} color={PURPLE} />}
              />

              <StatCard
                label="Upcoming"
                value={upcomingCount}
                icon={<CalendarDays size={19} color="#4ADE80" />}
              />
            </View>

            <View className="mb-7 flex-row gap-3">
              <StatCard
                label="Ongoing"
                value={ongoingCount}
                icon={<Gamepad2 size={19} color="#38BDF8" />}
              />

              <StatCard
                label="Completed"
                value={endedCount}
                icon={<Trophy size={19} color="#FBBF24" />}
              />
            </View>

            {/* Management */}
            <View className="mb-4">
              <Text className="text-lg font-extrabold text-white">
                Management
              </Text>

              <Text className="mt-1 text-xs text-[#827B98]">
                Manage every part of BooyahX
              </Text>
            </View>

            <ActionCard
              title="Tournaments"
              description="Create, edit and manage tournaments"
              icon={<Trophy size={21} color={PURPLE} />}
              href="/(tabs)/tournaments"
            />

            <ActionCard
              title="Player Requests"
              description="Review and approve join requests"
              icon={<ClipboardList size={21} color="#38BDF8" />}
              href="/(tabs)/requests"
            />

            <ActionCard
              title="Room Management"
              description="Configure room IDs and passwords"
              icon={<Gamepad2 size={21} color="#4ADE80" />}
              href="/(tabs)/rooms"
            />

            <ActionCard
              title="Tournament Results"
              description="Add winners and publish results"
              icon={<Trophy size={21} color="#FBBF24" />}
              href="/(tabs)/results"
            />

            <ActionCard
              title="News & Announcements"
              description="Publish and manage news updates"
              icon={<Newspaper size={21} color="#F472B6" />}
              href="/(tabs)/news"
            />

            {/* Recent Tournaments */}
            <View className="mb-4 mt-5 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-extrabold text-white">
                  Recent Tournaments
                </Text>

                <Text className="mt-1 text-xs text-[#827B98]">
                  Latest tournament activity
                </Text>
              </View>

              <Link href="/(tabs)/tournaments" asChild>
                <Pressable className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-[#C4B5FD]">
                    View All
                  </Text>

                  <ChevronRight size={15} color={PURPLE} />
                </Pressable>
              </Link>
            </View>

            {/* Error */}
            {error ? (
              <View className="mb-4 rounded-2xl border border-red-400/20 bg-[#291A2A] p-4">
                <Text className="font-bold text-red-300">Dashboard Error</Text>

                <Text className="mt-2 text-xs leading-5 text-[#D5A9B5]">
                  {error}
                </Text>

                <Pressable
                  onPress={loadDashboard}
                  className="mt-4 flex-row items-center gap-2 self-start rounded-xl bg-[#452638] px-4 py-2.5"
                >
                  <RefreshCw size={13} color="#FCA5A5" />

                  <Text className="text-xs font-bold text-red-200">
                    Try Again
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Recent list */}
            {!error && recentTournaments.length === 0 ? (
              <View className="items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] px-6 py-8">
                <Trophy size={27} color={PURPLE} />

                <Text className="mt-3 text-sm font-bold text-white">
                  No tournaments yet
                </Text>

                <Text className="mt-2 text-center text-xs leading-5 text-[#827B98]">
                  Create your first tournament to get started.
                </Text>
              </View>
            ) : (
              !error &&
              recentTournaments.map((item) => (
                <RecentTournament key={item.$id} item={item} />
              ))
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
