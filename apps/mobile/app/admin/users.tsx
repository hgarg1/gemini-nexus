import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.users.list();
        setUsers(data.users || []);
      } catch (e: any) {
        setError(e?.message || 'Access denied');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView className="px-6 pt-8">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Users</Text>
          <View className="w-8 h-8" />
        </View>

        <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 mb-6">
          <Search size={16} color="#71717a" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search users"
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
          filtered.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => router.push(`/admin/users/${user.id}`)}
              className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl mb-4"
            >
              <Avatar uri={user.image} fallback={user.name?.[0] || 'U'} size="md" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {user.name || 'Unknown'}
                </Text>
                <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                  {user.email}
                </Text>
                {user.isBanned && (
                  <Text className="text-red-400 text-[10px] font-bold mt-1">BANNED</Text>
                )}
              </View>
              <Text className="text-zinc-400 text-[10px] uppercase tracking-widest">
                {user.role || 'user'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
