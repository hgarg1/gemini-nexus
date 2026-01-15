import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Layers } from 'lucide-react-native';
import { api } from '../../lib/api';

export default function AdminRolesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.admin.roles.list();
        setRoles(data.roles || []);
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
          <Text className="text-white text-xl font-bold">Roles</Text>
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
          roles.map((role) => {
            const isExpanded = expandedId === role.id;
            const permissions = role.permissions || [];
            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => setExpandedId(isExpanded ? null : role.id)}
                className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 items-center justify-center">
                      <Layers size={16} color="#60a5fa" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white font-semibold">{role.name}</Text>
                      <Text className="text-zinc-500 text-xs">
                        {permissions.length} permissions
                      </Text>
                    </View>
                  </View>
                  <Text className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                  </Text>
                </View>
                {role.description ? (
                  <Text className="text-zinc-500 text-xs mt-3">{role.description}</Text>
                ) : null}
                {isExpanded && (
                  <View className="mt-4 flex-row flex-wrap">
                    {permissions.map((permission: any) => (
                      <View
                        key={permission.id}
                        className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 mr-2 mb-2"
                      >
                        <Text className="text-zinc-300 text-[10px] uppercase">
                          {permission.name}
                        </Text>
                      </View>
                    ))}
                    {permissions.length === 0 && (
                      <Text className="text-zinc-600 text-xs">No permissions assigned.</Text>
                    )}
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
