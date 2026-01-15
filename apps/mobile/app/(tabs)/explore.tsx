import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Compass, Bot, MessageSquarePlus } from 'lucide-react-native';
import { Avatar } from '../../components/ui/Avatar';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

export default function ExploreScreen() {
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBots = async () => {
    try {
      const data = await api.bots.list();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBots();
  }, []);

  const handleStartChat = async (bot: any) => {
    try {
        const data = await api.chat.create(bot.id);
        if (data.chat?.id) {
            router.push(`/chat/${data.chat.id}`);
        }
    } catch (error) {
        Alert.alert("Error", "Failed to start chat with bot");
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 px-6 pt-4">
        <View className="mb-8">
          <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Discover</Text>
          <Text className="text-3xl font-bold text-white">Explore Bots</Text>
        </View>

        {isLoading ? (
             <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        ) : (
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {bots.length === 0 ? (
                    <View className="flex-1 items-center justify-center opacity-50 mt-20">
                        <Compass size={64} color="#3f3f46" />
                        <Text className="text-zinc-600 mt-4 text-center">No bots found in your library.</Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between">
                        {bots.map((bot, index) => (
                             <MotiView
                                key={bot.id}
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 50 }}
                                className="w-[48%] mb-4"
                             >
                                <TouchableOpacity 
                                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 items-center space-y-3 active:border-blue-500/50"
                                    onPress={() => handleStartChat(bot)}
                                >
                                    <Avatar uri={bot.avatar} fallback={bot.name[0]} size="lg" className="mb-2" />
                                    <View>
                                        <Text className="text-white font-bold text-center mb-1" numberOfLines={1}>{bot.name}</Text>
                                        <Text className="text-zinc-500 text-xs text-center leading-4" numberOfLines={2}>{bot.description || "No description"}</Text>
                                    </View>
                                    <View className="w-full h-px bg-zinc-800 my-2" />
                                    <View className="flex-row items-center space-x-2">
                                        <MessageSquarePlus size={16} color="#3b82f6" />
                                        <Text className="text-blue-500 text-xs font-bold">Chat</Text>
                                    </View>
                                </TouchableOpacity>
                             </MotiView>
                        ))}
                    </View>
                )}
            </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
