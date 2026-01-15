import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { api } from '../../lib/api';

const formatValue = (value: any) => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.settings.list();
        setSettings(data.settings || []);
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
      <ScrollView className="px-6 pt-8" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">System Settings</Text>
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
          settings.map((setting) => {
            const isExpanded = expandedKey === setting.key;
            const displayValue = formatValue(setting.value);
            return (
              <TouchableOpacity
                key={setting.key}
                onPress={() => setExpandedKey(isExpanded ? null : setting.key)}
                className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4"
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 items-center justify-center">
                    <Settings size={16} color="#c084fc" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">{setting.key}</Text>
                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                      {displayValue}
                    </Text>
                  </View>
                </View>
                {isExpanded && (
                  <View className="mt-4">
                    <Text className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Value</Text>
                    <Text className="text-zinc-200 text-xs font-mono">
                      {displayValue}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
