import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Results from "../../components/results";

export default function ResultsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-[#100D20]">
        <Text className="text-white">Tournament ID missing.</Text>
      </View>
    );
  }

  return <Results tournamentId={id} />;
}
