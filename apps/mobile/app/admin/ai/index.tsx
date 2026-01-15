import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, Bot, Trash2 } from 'lucide-react-native';
import { api } from '../../../lib/api';

export default function AdminAIListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const loadChats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.ai.chats.list();
      setChats(data.chats || []);
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((chat) => (chat.title || '').toLowerCase().includes(term));
  }, [chats, search]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await api.admin.ai.chats.create('New Session');
      if (created?.id) {
        router.push(`/admin/ai/${created.id}`);
      } else {
        await loadChats();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (chatId: string) => {
    Alert.alert('Delete Chat', 'Remove this AI session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.ai.chats.remove(chatId);
            setChats((prev) => prev.filter((chat) => chat.id !== chatId));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete chat');
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
          <Text className="text-white text-xl font-bold">Admin AI</Text>
          <TouchableOpacity onPress={handleCreate} className="p-2 bg-zinc-900 rounded-full" disabled={creating}>
            <Plus size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 mb-6">
          <Search size={16} color="#71717a" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search AI sessions"
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
        ) : filtered.length === 0 ? (
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 items-center">
            <Bot size={28} color="#60a5fa" />
            <Text className="text-white text-sm font-bold mt-3">No AI sessions</Text>
            <Text className="text-zinc-500 text-xs mt-2 text-center">
              Start a new admin AI session to analyze system data.
            </Text>
          </View>
        ) : (
          filtered.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              onPress={() => router.push(`/admin/ai/${chat.id}`)}
              className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 items-center justify-center">
                    <Bot size={16} color="#60a5fa" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {chat.title || 'AI Session'}
                    </Text>
                    <Text className="text-zinc-500 text-xs">
                      Updated {chat.updatedAt ? new Date(chat.updatedAt).toLocaleString() : 'Unknown'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(chat.id)}>
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
