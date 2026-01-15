import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Compass } from 'lucide-react-native';

export default function ExploreScreen() {
  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 px-6 pt-4">
        <View className="mb-8">
          <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Discover</Text>
          <Text className="text-3xl font-bold text-white">Explore Bots</Text>
        </View>

        <View className="flex-1 items-center justify-center opacity-50">
          <Compass size={64} color="#3f3f46" />
          <Text className="text-zinc-600 mt-4 text-center">Coming soon...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
