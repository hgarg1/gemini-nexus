import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { Search, Plus, Zap } from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

export default function ChatListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await api.chat.list();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      // Optional: Alert.alert("Error", "Could not load chats");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, []);

  const handleCreateChat = async () => {
    try {
        const data = await api.chat.create();
        if (data.chat?.id) {
            router.push(`/chat/${data.chat.id}`);
        }
    } catch (error) {
        Alert.alert("Error", "Failed to create new chat");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours
    if (diff < 86400000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If less than 7 days
    if (diff < 604800000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Workspace</Text>
            <Text className="text-3xl font-bold text-white">Chats</Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700 active:bg-zinc-700"
            onPress={handleCreateChat}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-6 mb-6">
          <Input 
            placeholder="Search messages..." 
            icon={<Search size={20} color="#a1a1aa" />}
            className="bg-zinc-900 border-zinc-800"
          />
        </View>

        {/* Stories / Quick Access */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8 max-h-24">
          <TouchableOpacity onPress={handleCreateChat} className="mr-6 items-center space-y-2">
            <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center border-2 border-blue-400 border-dashed">
              <Zap size={28} color="white" fill="white" />
            </View>
            <Text className="text-white text-xs font-medium">New</Text>
          </TouchableOpacity>
          {/* We could populate this with favorited bots or recent active contacts later */}
        </ScrollView>

        {/* Chat List */}
        {isLoading ? (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        ) : (
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 100 }} 
                className="px-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
              <Text className="text-white font-bold text-lg mb-4">Recent</Text>
              {chats.length === 0 ? (
                  <Text className="text-zinc-500 text-center mt-10">No chats yet. Start a new one!</Text>
              ) : (
                  chats.map((chat, index) => (
                    <MotiView
                      key={chat.id}
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ delay: index * 50 }}
                    >
                      <TouchableOpacity 
                        className="flex-row items-center py-4 border-b border-zinc-900/50 active:bg-zinc-900/30 -mx-2 px-2 rounded-xl"
                        onPress={() => router.push(`/chat/${chat.id}`)}
                      >
                        <Avatar fallback={(chat.name || "N")[0]} size="lg" />
                        
                        <View className="flex-1 ml-4">
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-white font-bold text-base" numberOfLines={1}>{chat.name}</Text>
                            <Text className="text-zinc-500 text-xs">{formatTime(chat.updatedAt)}</Text>
                          </View>
                          <Text className="text-zinc-400 text-sm" numberOfLines={1}>
                            {chat.message}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </MotiView>
                  ))
              )}
            </ScrollView>
        )}

      </SafeAreaView>
    </View>
  );
}
