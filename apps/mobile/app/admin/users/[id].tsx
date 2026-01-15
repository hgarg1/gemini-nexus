import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '../../../lib/api';
import { Avatar } from '../../../components/ui/Avatar';

export default function AdminUserDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const usersData = await api.admin.users.list();
      const found = (usersData.users || []).find((u: any) => u.id === userId);
      setUser(found || null);
      try {
        const rolesData = await api.admin.roles.list();
        setRoles(rolesData.roles || []);
      } catch {
        setRoles([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const selectedRoleId = useMemo(() => {
    if (!user?.role) return null;
    const match = roles.find((role) => role.name === user.role);
    return match?.id || null;
  }, [roles, user]);

  const handleRoleChange = async (roleId: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await api.admin.users.update(user.id, { roleId });
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.admin.users.update(user.id, { isBanned: !user.isBanned });
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update ban status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    Alert.alert('Delete User', 'This will remove the user permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.admin.users.remove(user.id);
            router.back();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete user');
          } finally {
            setDeleting(false);
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
          <Text className="text-white text-xl font-bold">User Detail</Text>
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
        ) : !user ? (
          <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 items-center">
            <Text className="text-white text-lg font-bold">User Not Found</Text>
          </View>
        ) : (
          <>
            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 mb-6">
              <View className="flex-row items-center">
                <Avatar uri={user.image} fallback={user.name?.[0] || 'U'} size="lg" />
                <View className="ml-4 flex-1">
                  <Text className="text-white text-lg font-bold" numberOfLines={1}>
                    {user.name || 'Unknown'}
                  </Text>
                  <Text className="text-zinc-500 text-sm" numberOfLines={1}>
                    {user.email}
                  </Text>
                  {user.isBanned && (
                    <Text className="text-red-400 text-xs font-bold mt-2">BANNED</Text>
                  )}
                </View>
              </View>
              <View className="mt-4">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">Organizations</Text>
                <Text className="text-white text-sm mt-1">
                  {(user.organizations || []).join(', ') || 'None'}
                </Text>
              </View>
              <View className="mt-3">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">Created</Text>
                <Text className="text-white text-sm mt-1">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
                </Text>
              </View>
            </View>

            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 mb-6">
              <Text className="text-white text-base font-bold mb-4">Role</Text>
              {roles.length === 0 ? (
                <Text className="text-zinc-500 text-sm">
                  Role updates require Super Admin access.
                </Text>
              ) : (
                <View className="flex-row flex-wrap">
                  {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <TouchableOpacity
                        key={role.id}
                        onPress={() => handleRoleChange(role.id)}
                        disabled={saving}
                        className={`px-3 py-2 rounded-2xl border mr-2 mb-2 ${isSelected ? 'bg-blue-600/20 border-blue-500/40' : 'bg-zinc-900/50 border-zinc-800'}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                          {role.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <Text className="text-white text-base font-bold mb-4">Actions</Text>
              <TouchableOpacity
                onPress={handleToggleBan}
                disabled={saving}
                className="w-full bg-zinc-800 rounded-2xl p-4 mb-3"
              >
                <Text className="text-white font-bold text-center">
                  {user.isBanned ? 'Unban User' : 'Ban User'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                className="w-full bg-red-500/20 rounded-2xl p-4"
              >
                <Text className="text-red-300 font-bold text-center">
                  {deleting ? 'Deleting...' : 'Delete User'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
