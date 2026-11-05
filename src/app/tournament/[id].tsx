import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyProfile } from "../../services/profile";
import { getTournamentResults } from "../../services/results";
import {
    getMyRequests,
    getTournament,
    joinTournament,
} from "../../services/tournaments";

import type { TournamentResult } from "../../services/results";
import type { Tournament, TournamentRequest } from "../../types";

type TournamentWithPrize = Tournament & {
  prizePool?: string;
  prizeDescription?: string;
};

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tournament, setTournament] = useState<TournamentWithPrize | null>(
    null,
  );

  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [myRequest, setMyRequest] = useState<TournamentRequest | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setTournament(null);
        setMyRequest(null);
        setResults([]);

        const result = await getTournament(id);

        if (!active) return;

        const tournamentData = result as unknown as TournamentWithPrize;

        setTournament(tournamentData);

        // Load player's tournament request
        try {
          const requestData = await getMyRequests();
          const requests = requestData.rows ?? [];

          const existing = requests.find(
            (request) => request.tournamentId === id,
          );

          if (active && existing) {
            setMyRequest(existing as TournamentRequest);
          }
        } catch (error) {
          console.log("Request load error:", error);
        }

        // Load results only after tournament has ended
        if (tournamentData.status?.toLowerCase() === "ended") {
          try {
            const tournamentResults = await getTournamentResults(id);

            if (active) {
              setResults(tournamentResults);
            }
          } catch (error) {
            console.log("Tournament results error:", error);
          }
        }
      } catch (error) {
        console.log("Tournament load error:", error);

        if (active) {
          Alert.alert("Error", "Unable to load tournament details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleJoin() {
    const currentStatus = tournament?.status?.toLowerCase();

    // Prevent joining if tournament is not upcoming
    if (currentStatus !== "upcoming") {
      Alert.alert(
        "Registration Closed",
        "This tournament is no longer accepting join requests.",
      );
      return;
    }

    // Prevent duplicate requests
    if (myRequest) {
      Alert.alert(
        "Already Requested",
        "You have already submitted a request for this tournament.",
      );
      return;
    }

    try {
      setJoining(true);

      const profile = await getMyProfile();

      const result = await joinTournament(
        id,
        profile.inGameName,
        profile.freeFireUid,
      );

      setMyRequest(result as unknown as TournamentRequest);

      Alert.alert(
        "Request Sent",
        "Your request has been submitted. You can track it in the My Room tab.",
      );
    } catch (error: any) {
      console.log("Join tournament error:", error);

      Alert.alert(
        "Unable to Join",
        error?.message || "Please complete your player profile first.",
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-[#100D20]"
        edges={["top", "bottom"]}
      >
        <ActivityIndicator color="#A78BFA" size="large" />
        <Text className="mt-3 text-[#AAA3C2]">Loading tournament...</Text>
      </SafeAreaView>
    );
  }

  if (!tournament) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-[#100D20] p-5"
        edges={["top", "bottom"]}
      >
        <Text className="text-base text-[#AAA3C2]">Tournament not found.</Text>

        <Pressable onPress={() => router.back()}>
          <Text className="mt-5 text-[#A78BFA]">← Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Tournament status
  const status = tournament.status?.toLowerCase();

  const isUpcoming = status === "upcoming";
  const isOngoing = status === "ongoing";
  const isEnded = status === "ended";

  const isPublic = tournament.visibility?.toLowerCase() === "public";

  const canJoin = isUpcoming && !myRequest && !joining;

  const statusLabel = isUpcoming
    ? "Upcoming"
    : isOngoing
      ? "Ongoing"
      : isEnded
        ? "Ended"
        : tournament.status || "Unknown";

  const statusColor = isUpcoming
    ? "text-blue-400"
    : isOngoing
      ? "text-green-400"
      : isEnded
        ? "text-red-400"
        : "text-[#AAA3C2]";

  // Prize Pool
  const prizePool = tournament.prizePool?.trim();
  const prizeDescription = tournament.prizeDescription?.trim();

  const formattedPrize = prizePool
    ? /^\d+(\.\d+)?$/.test(prizePool)
      ? `৳${Number(prizePool).toLocaleString("en-US")}`
      : prizePool
    : "";

  const prizeEntries = prizeDescription
    ? prizeDescription
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const separatorIndex = item.indexOf(":");

          if (separatorIndex === -1) {
            return { label: item, amount: "" };
          }

          return {
            label: item.slice(0, separatorIndex).trim(),
            amount: item.slice(separatorIndex + 1).trim(),
          };
        })
    : [];

  return (
    <SafeAreaView className="flex-1 bg-[#100D20]" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[22px] py-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="mb-7 self-start flex-row items-center"
        >
          <Text className="text-base font-semibold text-[#A78BFA]">← Back</Text>
        </Pressable>

        {/* Tournament Header */}
        <View>
          <View className="mb-3 self-start rounded-full border border-[#332A4B] bg-[#1D1833] px-3 py-1.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
              {tournament.visibility} Tournament
            </Text>
          </View>

          <Text className="text-[28px] font-bold leading-9 text-white">
            {tournament.title}
          </Text>

          <Text className="mt-3 text-sm leading-6 text-[#AAA3C2]">
            {tournament.description}
          </Text>

          {/* Status */}
          <View className="mt-4 flex-row items-center">
            <View
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                isUpcoming
                  ? "bg-blue-400"
                  : isOngoing
                    ? "bg-green-400"
                    : isEnded
                      ? "bg-red-400"
                      : "bg-gray-400"
              }`}
            />

            <Text className={`text-sm font-bold uppercase ${statusColor}`}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Prize Pool */}
        {(prizePool || prizeDescription) && (
          <View className="mt-7 overflow-hidden rounded-2xl border border-[#594184] bg-[#1D1833] p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-[#AAA3C2]">
                  Total Prize Pool
                </Text>

                <Text className="mt-2 text-3xl font-extrabold text-[#C4A7FF]">
                  {formattedPrize || "Prize Details"}
                </Text>
              </View>

              <View className="ml-3 h-14 w-14 items-center justify-center rounded-2xl bg-[#332451]">
                <Text className="text-3xl">🏆</Text>
              </View>
            </View>

            {prizeEntries.length > 0 && (
              <>
                <View className="my-5 h-px bg-[#332A4B]" />

                <Text className="mb-4 text-sm font-bold text-white">
                  Prize Distribution
                </Text>

                <View className="gap-3">
                  {prizeEntries.map((entry, index) => (
                    <View
                      key={`${entry.label}-${index}`}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-1 flex-row items-center">
                        <Text className="mr-3 text-base">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : "🏅"}
                        </Text>

                        <Text className="flex-1 text-sm font-medium text-[#DDD6F0]">
                          {entry.label}
                        </Text>
                      </View>

                      {entry.amount ? (
                        <Text className="ml-3 text-sm font-bold text-white">
                          {entry.amount}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Tournament Information */}
        <View className="mt-7">
          <Text className="mb-3 text-lg font-bold text-white">
            Tournament Information
          </Text>

          <View className="rounded-2xl border border-[#332A4B] bg-[#1D1833] px-4">
            <Info label="Game Mode" value={tournament.mode} />
            <Info label="Map" value={tournament.map} />
            <Info label="Team Type" value={tournament.teamType} />
            <Info label="Room Type" value={isPublic ? "Public" : "Private"} />
            <Info label="Maximum Slots" value={String(tournament.maxSlots)} />
            <Info
              label="Start Time"
              value={
                tournament.startAt
                  ? new Date(tournament.startAt).toLocaleString()
                  : "Not specified"
              }
            />
            <Info label="Status" value={statusLabel} last />
          </View>
        </View>

        {/* Tournament Results: only after ended */}
        {isEnded && (
          <View className="mt-7">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-white">
                  Tournament Results
                </Text>

                <Text className="mt-1 text-xs text-[#AAA3C2]">
                  Official tournament winners
                </Text>
              </View>

              <Text className="text-2xl">🏆</Text>
            </View>

            {results.length > 0 ? (
              <View className="gap-3">
                {results.map((winner) => {
                  const isFirst = winner.position === 1;
                  const isSecond = winner.position === 2;
                  const isThird = winner.position === 3;

                  const medal = isFirst
                    ? "🥇"
                    : isSecond
                      ? "🥈"
                      : isThird
                        ? "🥉"
                        : "🏅";

                  const positionLabel =
                    winner.position === 1
                      ? "1st Place"
                      : winner.position === 2
                        ? "2nd Place"
                        : winner.position === 3
                          ? "3rd Place"
                          : `${winner.position}th Place`;

                  return (
                    <View
                      key={winner.$id}
                      className={`flex-row items-center rounded-2xl border p-4 ${
                        isFirst
                          ? "border-[#8B6B36] bg-[#302416]"
                          : "border-[#332A4B] bg-[#1D1833]"
                      }`}
                    >
                      <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-[#302451]">
                        <Text className="text-2xl">{medal}</Text>
                      </View>

                      <View className="flex-1">
                        <Text className="font-bold text-white">
                          {winner.inGameName}
                        </Text>

                        <Text className="mt-1 text-xs text-[#AAA3C2]">
                          {positionLabel}
                        </Text>

                        <Text className="mt-1 text-[11px] text-[#817A96]">
                          UID: {winner.freeFireUid}
                        </Text>
                      </View>

                      <View className="ml-2 items-end">
                        <Text className="text-xs text-[#AAA3C2]">Prize</Text>

                        <Text className="mt-1 font-bold text-[#C4A7FF]">
                          {winner.prizeAmount || "—"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="items-center rounded-2xl border border-[#332A4B] bg-[#1D1833] p-6">
                <Text className="text-3xl">🏆</Text>

                <Text className="mt-3 text-center font-bold text-white">
                  Results Not Published Yet
                </Text>

                <Text className="mt-2 text-center text-xs leading-5 text-[#AAA3C2]">
                  Tournament has ended. Winners will appear here once the
                  results are published by the admin.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Existing Request */}
        {myRequest ? (
          <View className="mt-6 rounded-2xl border border-[#332A4B] bg-[#1D1833] p-5">
            <Text className="text-lg font-bold text-white">Your Request</Text>

            <Text
              className={`mt-3 font-bold ${
                myRequest.status?.toLowerCase() === "approved"
                  ? "text-green-400"
                  : myRequest.status?.toLowerCase() === "rejected"
                    ? "text-red-400"
                    : "text-yellow-400"
              }`}
            >
              {myRequest.status?.toUpperCase() ?? "PENDING"}
            </Text>

            <Text className="mt-3 text-center text-xs leading-5 text-[#AAA3C2]">
              Track your tournament request in the My Room tab.
            </Text>

            <Pressable
              className="mt-5 items-center rounded-xl bg-[#7C3AED] p-4 active:opacity-80"
              onPress={() => router.push("/(tabs)/my-tournaments")}
            >
              <Text className="font-bold text-white">Go to My Room</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            className={`mt-6 items-center rounded-xl p-4 ${
              canJoin
                ? "bg-[#7C3AED] active:opacity-80"
                : "bg-[#332A4B] opacity-70"
            }`}
            onPress={handleJoin}
            disabled={!canJoin}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">
                {isUpcoming
                  ? "Request to Join"
                  : isOngoing
                    ? "Tournament Ongoing"
                    : isEnded
                      ? "Tournament Ended"
                      : "Registration Closed"}
              </Text>
            )}
          </Pressable>
        )}

        {/* Public Room Button */}
        {isPublic && !isEnded && (
          <Pressable
            className="mt-4 items-center rounded-xl bg-green-800 p-4 active:opacity-80"
            onPress={() =>
              router.push({
                pathname: "/room/[id]",
                params: { id },
              })
            }
          >
            <Text className="font-bold text-white">View Public Room</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({
  label,
  value,
  last = false,
}: {
  label: string;
  value?: string | number | null;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        last ? "" : "border-b border-[#332A4B]"
      }`}
    >
      <Text className="text-sm text-[#AAA3C2]">{label}</Text>

      <Text className="ml-4 flex-1 text-right text-sm font-semibold text-white">
        {value || "Not specified"}
      </Text>
    </View>
  );
}
