import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HubScreen() {
  const agents = ['Research', 'Coding', 'Creative', 'Analyst', 'Security', 'Support'];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={["#7000ff10", "transparent"]} style={{ position: "absolute", width: "100%", height: 300 }} />
      <SafeAreaView className="flex-1 p-6">
        <Text className="text-white text-3xl font-black tracking-tighter mb-2">NEXUS HUB</Text>
        <Text className="text-white/40 text-xs tracking-widest uppercase mb-8">Deploy Specialized Intelligence</Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-4">
            {agents.map((agent, i) => (
              <Animated.View 
                key={agent}
                entering={FadeInDown.delay(i * 100).springify()}
                className="w-[47%] aspect-square"
              >
                <TouchableOpacity className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 justify-between active:bg-white/10 active:scale-95 transition-transform">
                  <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
                    <Bot color="#00f2ff" size={20} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">{agent}</Text>
                    <Text className="text-white/30 text-[10px] uppercase mt-1">Ready</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
