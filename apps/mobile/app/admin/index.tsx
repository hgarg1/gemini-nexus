import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ShieldCheck, Users, Activity, ArrowLeft, Layers, Building2, Settings, Bot, MessageSquare } from 'lucide-react-native';
import { api } from '../../lib/api';

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.overview();
        setStats(data.stats);
      } catch (e: any) {
        setError(e?.message || 'Access denied');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView className="px-6 pt-8">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Admin Console</Text>
          <View className="w-8 h-8" />
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : error ? (
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 items-center">
            <ShieldCheck size={32} color="#ef4444" />
            <Text className="text-white text-lg font-bold mt-4">Access Denied</Text>
            <Text className="text-zinc-500 text-sm mt-2 text-center">{error}</Text>
          </View>
        ) : (
          <>
            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 mb-6">
              <Text className="text-zinc-400 text-xs uppercase tracking-widest">System Stats</Text>
              <View className="flex-row justify-between mt-4">
                <View>
                  <Text className="text-white text-xl font-bold">{stats?.users ?? 0}</Text>
                  <Text className="text-zinc-500 text-xs">Users</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{stats?.chats ?? 0}</Text>
                  <Text className="text-zinc-500 text-xs">Chats</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{stats?.messages ?? 0}</Text>
                  <Text className="text-zinc-500 text-xs">Messages</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{stats?.memories ?? 0}</Text>
                  <Text className="text-zinc-500 text-xs">Memories</Text>
                </View>
              </View>
            </View>

            <View className="space-y-4">
              <TouchableOpacity
                onPress={() => router.push('/admin/users')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Users size={20} color="#60a5fa" />
                <Text className="text-white font-semibold ml-3">User Management</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/organizations')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Building2 size={20} color="#34d399" />
                <Text className="text-white font-semibold ml-3">Organizations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/roles')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Layers size={20} color="#60a5fa" />
                <Text className="text-white font-semibold ml-3">Roles & Permissions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/settings')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Settings size={20} color="#c084fc" />
                <Text className="text-white font-semibold ml-3">System Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/chat-policy')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <MessageSquare size={20} color="#60a5fa" />
                <Text className="text-white font-semibold ml-3">Chat Protocols</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/bots')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Bot size={20} color="#22c55e" />
                <Text className="text-white font-semibold ml-3">Bots Registry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin/logs')}
                className="flex-row items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
              >
                <Activity size={20} color="#22c55e" />
                <Text className="text-white font-semibold ml-3">Audit Logs</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
