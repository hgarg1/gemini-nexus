import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Database, GitBranch } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function VaultScreen() {
  const memories = [
    { id: 1, label: 'Project Context', date: '2h ago' },
    { id: 2, label: 'User Preferences', date: '5h ago' },
    { id: 3, label: 'Code Style', date: '1d ago' },
  ];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={["#f59e0b10", "transparent"]} style={{ position: "absolute", width: "100%", height: 300 }} />
      <SafeAreaView className="flex-1 p-6">
        <Text className="text-white text-3xl font-black tracking-tighter mb-2">VERSION VAULT</Text>
        <Text className="text-white/40 text-xs tracking-widest uppercase mb-8">Neural Memory & Snapshots</Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {memories.map((m, i) => (
            <Animated.View 
              key={m.id} 
              entering={FadeInRight.delay(i * 100).springify()}
              className="mb-4"
            >
              <View className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center border border-accent/20">
                  <Database color="#f59e0b" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{m.label}</Text>
                  <Text className="text-white/30 text-xs mt-1">Updated {m.date}</Text>
                </View>
                <GitBranch color="#666" size={16} />
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
