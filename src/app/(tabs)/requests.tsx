import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Check,
  Clock,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react-native";

import {
  approveRequest,
  getAllRequests,
  getTournaments,
  rejectRequest,
} from "../../services/tournaments";

import type { Tournament, TournamentRequest } from "../../types";

type FilterType = "all" | "pending" | "approved" | "rejected";

type RequestItemProps = {
  request: TournamentRequest;
  tournament?: Tournament;
  processing: boolean;
  onApprove: (request: TournamentRequest) => void;
  onReject: (request: TournamentRequest) => void;
};

const PURPLE = "#A78BFA";
const MUTED = "#AAA3C2";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const color =
    normalized === "approved"
      ? "text-emerald-400"
      : normalized === "rejected"
        ? "text-red-400"
        : "text-amber-400";

  const background =
    normalized === "approved"
      ? "bg-emerald-400/10"
      : normalized === "rejected"
        ? "bg-red-400/10"
        : "bg-amber-400/10";

  return (
    <View className={`rounded-full px-3 py-1.5 ${background}`}>
      <Text className={`text-[10px] font-extrabold uppercase ${color}`}>
        {status}
      </Text>
    </View>
  );
}

function RequestCard({
  request,
  tournament,
  processing,
  onApprove,
  onReject,
}: RequestItemProps) {
  const status = request.status?.toLowerCase() || "pending";
  const isPending = status === "pending";

  return (
    <View className="mb-4 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-4">
      {/* Player Information */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#30234F]">
            <Users size={21} color={PURPLE} />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-white">
              {request.inGameName || "Unknown Player"}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">
              UID: {request.freeFireUid || "Not available"}
            </Text>
          </View>
        </View>

        <StatusBadge status={status} />
      </View>

      <View className="my-4 h-px bg-[#332A4B]" />

      {/* Tournament Information */}
      <View>
        <Text className="text-[10px] font-bold uppercase tracking-wider text-[#827B98]">
          Tournament
        </Text>

        <Text className="mt-1 text-sm font-bold text-white">
          {tournament?.title || "Tournament not found"}
        </Text>

        <Text className="mt-1 text-xs text-[#AAA3C2]">
          {tournament
            ? `${tournament.mode || "Battle"} · ${tournament.map || "Map"} · ${tournament.teamType || "Team"}`
            : `Tournament ID: ${request.tournamentId}`}
        </Text>
      </View>

      <View className="mt-4 rounded-xl bg-[#29223E] p-3">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-[#827B98]">
          Player User ID
        </Text>

        <Text className="mt-1 text-xs text-[#D6D0E5]">{request.userId}</Text>
      </View>

      {/* Actions */}
      {isPending ? (
        <View className="mt-4 flex-row gap-3">
          <Pressable
            disabled={processing}
            onPress={() => onReject(request)}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 ${
              processing ? "opacity-50" : "active:opacity-70"
            }`}
          >
            <X size={16} color="#F87171" />

            <Text className="text-xs font-bold text-red-400">Reject</Text>
          </Pressable>

          <Pressable
            disabled={processing}
            onPress={() => onApprove(request)}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-[#7C3AED] p-3 ${
              processing ? "opacity-50" : "active:opacity-70"
            }`}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}

            <Text className="text-xs font-bold text-white">
              {processing ? "Processing..." : "Approve"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-4 flex-row items-center gap-2">
          {status === "approved" ? (
            <Check size={15} color="#4ADE80" />
          ) : (
            <X size={15} color="#F87171" />
          )}

          <Text className="text-xs text-[#AAA3C2]">
            This request has already been processed.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RequestsScreen() {
  const [requests, setRequests] = useState<TournamentRequest[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load all requests and tournaments
  const loadRequests = useCallback(
    async (isActive: () => boolean = () => true) => {
      try {
        setError("");

        const [requestData, tournamentData] = await Promise.all([
          getAllRequests(),
          getTournaments(),
        ]);

        if (!isActive()) return;

        setRequests((requestData.rows ?? []) as TournamentRequest[]);
        setTournaments((tournamentData.rows ?? []) as Tournament[]);
      } catch (err: unknown) {
        console.log("Admin requests loading error:", err);

        if (isActive()) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load player requests.",
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

  // Reload when screen gets focus
  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadRequests(() => active);

      return () => {
        active = false;
      };
    }, [loadRequests]),
  );

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;

    return requests.filter(
      (request) => request.status?.toLowerCase() === filter,
    );
  }, [requests, filter]);

  // Statistics
  const pendingCount = requests.filter(
    (item) => item.status === "pending",
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "approved",
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "rejected",
  ).length;

  // Find tournament by ID
  const findTournament = (tournamentId: string) => {
    return tournaments.find((item) => item.$id === tournamentId);
  };

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // Approve
  const handleApprove = (request: TournamentRequest) => {
    Alert.alert(
      "Approve Request",
      `Approve ${request.inGameName}'s tournament request?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setProcessingId(request.$id);

              await approveRequest(request.$id);

              setRequests((previous) =>
                previous.map((item) =>
                  item.$id === request.$id
                    ? { ...item, status: "approved" }
                    : item,
                ),
              );

              Alert.alert(
                "Approved",
                `${request.inGameName}'s request has been approved.`,
              );
            } catch (err: unknown) {
              Alert.alert(
                "Approval Failed",
                err instanceof Error
                  ? err.message
                  : "Unable to approve this request.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  // Reject
  const handleReject = (request: TournamentRequest) => {
    Alert.alert(
      "Reject Request",
      `Reject ${request.inGameName}'s tournament request?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(request.$id);

              await rejectRequest(request.$id);

              setRequests((previous) =>
                previous.map((item) =>
                  item.$id === request.$id
                    ? { ...item, status: "rejected" }
                    : item,
                ),
              );

              Alert.alert(
                "Rejected",
                `${request.inGameName}'s request has been rejected.`,
              );
            } catch (err: unknown) {
              Alert.alert(
                "Rejection Failed",
                err instanceof Error
                  ? err.message
                  : "Unable to reject this request.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#100D20]">
        <ActivityIndicator size="large" color={PURPLE} />

        <Text className="mt-3 text-sm text-[#AAA3C2]">
          Loading player requests...
        </Text>
      </SafeAreaView>
    );
  }

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
        <View className="mb-6 mt-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={21} color={PURPLE} />

            <Text className="text-2xl font-extrabold text-white">
              Player Requests
            </Text>
          </View>

          <Text className="mt-2 text-sm leading-6 text-[#AAA3C2]">
            Review player applications and manage tournament access.
          </Text>
        </View>

        {/* Overview */}
        <View className="mb-6 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-3">
            <Clock size={18} color="#FBBF24" />

            <Text className="mt-3 text-2xl font-extrabold text-white">
              {pendingCount}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">Pending</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-3">
            <Check size={18} color="#4ADE80" />

            <Text className="mt-3 text-2xl font-extrabold text-white">
              {approvedCount}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">Approved</Text>
          </View>

          <View className="flex-1 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-3">
            <X size={18} color="#F87171" />

            <Text className="mt-3 text-2xl font-extrabold text-white">
              {rejectedCount}
            </Text>

            <Text className="mt-1 text-xs text-[#AAA3C2]">Rejected</Text>
          </View>
        </View>

        {/* Filters */}
        <View className="mb-5">
          <Text className="mb-3 text-sm font-bold text-white">
            Filter Requests
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {FILTERS.map((item) => {
              const active = filter === item.value;

              const count =
                item.value === "all"
                  ? requests.length
                  : requests.filter((request) => request.status === item.value)
                      .length;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setFilter(item.value)}
                  className={`flex-row items-center gap-2 rounded-xl border px-4 py-3 ${
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
                    {item.label}
                  </Text>

                  <Text
                    className={`text-[10px] font-bold ${
                      active ? "text-white" : "text-[#827B98]"
                    }`}
                  >
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Heading */}
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-extrabold text-white">
              {filter === "all"
                ? "All Requests"
                : `${filter.charAt(0).toUpperCase()}${filter.slice(1)} Requests`}
            </Text>

            <Text className="mt-1 text-xs text-[#827B98]">
              {filteredRequests.length} request(s) found
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            className="h-10 w-10 items-center justify-center rounded-xl border border-[#332A4B] bg-[#1D1833]"
          >
            <RefreshCw size={16} color={PURPLE} />
          </Pressable>
        </View>

        {/* Error */}
        {error ? (
          <View className="mb-5 rounded-2xl border border-red-400/20 bg-[#291A2A] p-4">
            <Text className="font-bold text-red-300">
              Unable to load requests
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

        {/* Request List */}
        {!error && filteredRequests.length > 0
          ? filteredRequests.map((request) => (
              <RequestCard
                key={request.$id}
                request={request}
                tournament={findTournament(request.tournamentId)}
                processing={processingId === request.$id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          : null}

        {/* Empty State */}
        {!error && filteredRequests.length === 0 ? (
          <View className="mt-4 items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#A78BFA]/10">
              <Users size={28} color={PURPLE} />
            </View>

            <Text className="mt-4 text-base font-bold text-white">
              No {filter === "all" ? "" : filter} requests
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-[#AAA3C2]">
              Player requests will appear here when they join a tournament.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
