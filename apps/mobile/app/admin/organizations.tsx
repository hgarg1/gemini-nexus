import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { api } from '../../lib/api';

export default function AdminOrganizationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.organizations.list();
        setOrganizations(data.organizations || []);
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
          <Text className="text-white text-xl font-bold">Organizations</Text>
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
          organizations.map((org) => (
            <TouchableOpacity
              key={org.id}
              onPress={() => router.push(`/admin/organizations/${org.id}`)}
              className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center">
                  <Building2 size={16} color="#34d399" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-semibold" numberOfLines={1}>
                    {org.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                    {org.slug}
                  </Text>
                </View>
                <View>
                  <Text className="text-zinc-400 text-[10px] uppercase tracking-widest">Members</Text>
                  <Text className="text-white text-sm font-bold text-right">
                    {org._count?.members ?? 0}
                  </Text>
                </View>
              </View>
                {org.description ? (
                  <Text className="text-zinc-500 text-xs mt-3" numberOfLines={2}>
                    {org.description}
                  </Text>
                ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
