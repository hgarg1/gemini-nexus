import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bot, Search, Trash2 } from 'lucide-react-native';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';

export default function AdminBotsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadBots = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.bots.list();
      setBots(data.bots || []);
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bots;
    return bots.filter((bot) =>
      `${bot.name} ${bot.creator?.email || ''} ${bot.creator?.name || ''}`.toLowerCase().includes(term)
    );
  }, [bots, search]);

  const handleDelete = (botId: string) => {
    Alert.alert('Delete Bot', 'Force delete this bot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.bots.remove(botId);
            setBots((prev) => prev.filter((b) => b.id !== botId));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete bot');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView className="px-6 pt-8" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Bots Registry</Text>
          <View className="w-8 h-8" />
        </View>

        <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 mb-6">
          <Search size={16} color="#71717a" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search bots or creators"
            placeholderTextColor="#52525b"
            className="flex-1 text-white ml-3"
          />
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : error ? (
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 items-center">
            <Text className="text-white text-lg font-bold">Access Denied</Text>
            <Text className="text-zinc-500 text-sm mt-2 text-center">{error}</Text>
          </View>
        ) : (
          filtered.map((bot) => (
            <View key={bot.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 items-center justify-center">
                    <Bot size={16} color="#60a5fa" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold" numberOfLines={1}>{bot.name}</Text>
                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                      {bot.description || 'No description'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(bot.id)}>
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mt-4">
                <View className="flex-row items-center">
                  <Avatar uri={bot.creator?.image} fallback={(bot.creator?.name || 'U')[0]} size="sm" />
                  <View className="ml-2">
                    <Text className="text-white text-xs" numberOfLines={1}>
                      {bot.creator?.name || bot.creator?.email || 'Unknown'}
                    </Text>
                    <Text className="text-zinc-500 text-[10px]" numberOfLines={1}>
                      {bot.creator?.email || 'No email'}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-zinc-500 text-[10px] uppercase tracking-widest">Tokens</Text>
                  <Text className="text-white text-xs font-bold text-right">
                    {bot.usage?.tokenCount ? bot.usage.tokenCount.toLocaleString() : '0'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-widest">Status</Text>
                <View className={`px-2 py-1 rounded-full ${bot.status === 'PUBLISHED' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  <Text className={`text-[10px] font-bold ${bot.status === 'PUBLISHED' ? 'text-green-300' : 'text-yellow-300'}`}>
                    {bot.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
