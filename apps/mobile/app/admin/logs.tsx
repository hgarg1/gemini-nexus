import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';

export default function AdminLogsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.logs.list();
        setLogs(data.logs || []);
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
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Audit Logs</Text>
          <View className="w-8 h-8" />
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
          logs.map((log) => (
            <View key={log.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xs font-bold uppercase tracking-widest">{log.action}</Text>
                <Text className="text-zinc-500 text-[10px]">
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </View>
              <Text className="text-zinc-400 text-xs mt-2">{log.resource || 'System'}</Text>
              {log.user ? (
                <View className="flex-row items-center mt-3">
                  <Avatar uri={log.user.image} fallback={log.user.name?.[0] || 'U'} size="sm" />
                  <Text className="text-zinc-500 text-xs ml-2">{log.user.name || log.user.email}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
