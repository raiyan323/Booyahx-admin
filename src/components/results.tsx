import { useFocusEffect } from "expo-router";
import { Medal, Plus, Trash2, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createTournamentResult,
  deleteTournamentResult,
  getTournamentResults,
  type TournamentResult,
} from "../services/results";

const BG = "#100D20";
const CARD = "#1D1833";
const PURPLE = "#A78BFA";
const MUTED = "#AAA3C2";
const BORDER = "#332A4B";

type Props = {
  tournamentId: string;
};

export default function Results({ tournamentId }: Props) {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [inGameName, setInGameName] = useState("");
  const [freeFireUid, setFreeFireUid] = useState("");
  const [position, setPosition] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      const data = await getTournamentResults(tournamentId);
      setResults(data);
    } catch (error) {
      console.error("Load results error:", error);
      Alert.alert("Error", "Could not load tournament results.");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadResults();
    }, [loadResults]),
  );

  const handlePublish = async () => {
    const parsedPosition = Number(position.trim());

    if (
      !inGameName.trim() ||
      !freeFireUid.trim() ||
      !position.trim() ||
      !prizeAmount.trim()
    ) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }

    if (!Number.isInteger(parsedPosition) || parsedPosition < 1) {
      Alert.alert(
        "Invalid position",
        "Position must be a positive whole number.",
      );
      return;
    }

    try {
      setPublishing(true);

      await createTournamentResult({
        tournamentId,
        inGameName: inGameName.trim(),
        freeFireUid: freeFireUid.trim(),
        position: parsedPosition,
        prizeAmount: prizeAmount.trim(),
      });

      setInGameName("");
      setFreeFireUid("");
      setPosition("");
      setPrizeAmount("");

      await loadResults();

      Alert.alert("Published!", "Tournament result has been published.");
    } catch (error) {
      console.error("Publish result error:", error);
      Alert.alert("Error", "Failed to publish result. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = (resultId: string) => {
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this result?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTournamentResult(resultId);
              await loadResults();
              Alert.alert("Deleted", "Result deleted successfully.");
            } catch (error) {
              console.error("Delete result error:", error);
              Alert.alert("Error", "Could not delete this result.");
            }
          },
        },
      ],
    );
  };

  const renderResult = ({ item }: { item: TournamentResult }) => (
    <View
      className="mb-3 flex-row items-center rounded-2xl p-4"
      style={{
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
      }}
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#A78BFA1A]">
        <Medal color={PURPLE} size={22} />
      </View>

      <View className="flex-1">
        <Text className="font-bold text-white">{item.inGameName}</Text>
        <Text className="mt-1 text-xs" style={{ color: MUTED }}>
          UID: {item.freeFireUid}
        </Text>
        <Text className="mt-1 text-xs" style={{ color: PURPLE }}>
          Position #{item.position} · Prize: {item.prizeAmount}
        </Text>
      </View>

      <Pressable
        onPress={() => handleDelete(item.$id)}
        className="rounded-xl bg-red-500/10 p-3"
      >
        <Trash2 size={18} color="#F87171" />
      </Pressable>
    </View>
  );

  const inputClass = "mt-2 rounded-xl border px-4 py-3 text-white";

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.$id}
        renderItem={renderResult}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View className="mb-6 flex-row items-center">
              <View className="mr-3 rounded-2xl bg-[#A78BFA1A] p-3">
                <Trophy size={25} color={PURPLE} />
              </View>
              <View>
                <Text className="text-2xl font-bold text-white">
                  Tournament Results
                </Text>
                <Text className="mt-1 text-sm" style={{ color: MUTED }}>
                  Add and publish player results
                </Text>
              </View>
            </View>

            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: CARD,
                borderWidth: 1,
                borderColor: BORDER,
              }}
            >
              <Text className="mb-5 text-lg font-bold text-white">
                Add New Result
              </Text>

              <Text className="font-medium text-white">In-game Name</Text>
              <TextInput
                value={inGameName}
                onChangeText={setInGameName}
                placeholder="Enter player name"
                placeholderTextColor={MUTED}
                className={inputClass}
                style={{ borderColor: BORDER }}
              />

              <Text className="mt-4 font-medium text-white">Free Fire UID</Text>
              <TextInput
                value={freeFireUid}
                onChangeText={setFreeFireUid}
                placeholder="Enter Free Fire UID"
                placeholderTextColor={MUTED}
                keyboardType="number-pad"
                className={inputClass}
                style={{ borderColor: BORDER }}
              />

              <Text className="mt-4 font-medium text-white">Position</Text>
              <TextInput
                value={position}
                onChangeText={setPosition}
                placeholder="Example: 1"
                placeholderTextColor={MUTED}
                keyboardType="number-pad"
                className={inputClass}
                style={{ borderColor: BORDER }}
              />

              <Text className="mt-4 font-medium text-white">Prize Amount</Text>
              <TextInput
                value={prizeAmount}
                onChangeText={setPrizeAmount}
                placeholder="Example: ৳500"
                placeholderTextColor={MUTED}
                className={inputClass}
                style={{ borderColor: BORDER }}
              />

              <Pressable
                onPress={handlePublish}
                disabled={publishing}
                className="mt-6 flex-row items-center justify-center rounded-xl py-4"
                style={{
                  backgroundColor: PURPLE,
                  opacity: publishing ? 0.6 : 1,
                }}
              >
                {publishing ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <>
                    <Plus size={20} color={BG} />
                    <Text className="ml-2 font-bold text-[#100D20]">
                      Publish Result
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <View className="mb-4 mt-8 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                Published Results
              </Text>
              <Text className="text-sm" style={{ color: MUTED }}>
                {results.length} players
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={PURPLE} className="mt-8" />
          ) : (
            <Text className="py-8 text-center text-sm" style={{ color: MUTED }}>
              No results published yet.
            </Text>
          )
        }
      />
    </View>
  );
}
