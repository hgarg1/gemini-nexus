import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Layers, Plus, Edit2, Trash2, Check, X, Shield } from 'lucide-react-native';
import { api } from '../../lib/api';
import { BlurView } from 'expo-blur';

export default function AdminRolesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editingPerm, setEditingPerm] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });
  const [permForm, setPermForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [rolesData, permsData] = await Promise.all([
          api.admin.roles.list(),
          api.admin.permissions.list(),
        ]);
        setRoles(rolesData.roles || []);
        setPermissions(permsData.permissions || []);
      } catch (e: any) {
        setError(e?.message || 'Access denied');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openRoleModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name || '',
        description: role.description || '',
        permissionIds: (role.permissions || []).map((p: any) => p.id),
      });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissionIds: [] });
    }
    setRoleModalOpen(true);
  };

  const openPermModal = (perm?: any) => {
    if (perm) {
      setEditingPerm(perm);
      setPermForm({ name: perm.name || '', description: perm.description || '' });
    } else {
      setEditingPerm(null);
      setPermForm({ name: '', description: '' });
    }
    setPermModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm((prev) => {
      const selected = prev.permissionIds.includes(permissionId);
      return {
        ...prev,
        permissionIds: selected
          ? prev.permissionIds.filter((id) => id !== permissionId)
          : [...prev.permissionIds, permissionId],
      };
    });
  };

  const handleSaveRole = async () => {
    const name = roleForm.name.trim();
    if (!name) {
      Alert.alert('Validation', 'Role name is required.');
      return;
    }
    setRoleSaving(true);
    try {
      const payload = {
        name: editingRole?.isSystem ? editingRole.name : name,
        description: roleForm.description.trim(),
        permissionIds: roleForm.permissionIds,
      };
      if (editingRole) {
        const updated = await api.admin.roles.update(editingRole.id, payload);
        setRoles((prev) => prev.map((role) => (role.id === updated.id ? updated : role)));
      } else {
        const created = await api.admin.roles.create(payload);
        setRoles((prev) => [...prev, created]);
      }
      setRoleModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save role');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = (role: any) => {
    if (role?.isSystem) {
      Alert.alert('Restricted', 'System roles cannot be deleted.');
      return;
    }
    Alert.alert('Delete Role', 'Delete this role permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.roles.remove(role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete role');
          }
        },
      },
    ]);
  };

  const handleSavePerm = async () => {
    const name = permForm.name.trim();
    if (!name) {
      Alert.alert('Validation', 'Permission name is required.');
      return;
    }
    setPermSaving(true);
    try {
      const payload = { name, description: permForm.description.trim() };
      if (editingPerm) {
        const updated = await api.admin.permissions.update(editingPerm.id, payload);
        setPermissions((prev) => prev.map((perm) => (perm.id === updated.id ? updated : perm)));
      } else {
        const created = await api.admin.permissions.create(payload);
        setPermissions((prev) => [...prev, created]);
      }
      setPermModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save permission');
    } finally {
      setPermSaving(false);
    }
  };

  const handleDeletePerm = (perm: any) => {
    Alert.alert('Delete Permission', 'Remove this permission from all roles?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.permissions.remove(perm.id);
            setPermissions((prev) => prev.filter((p) => p.id !== perm.id));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete permission');
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
          <Text className="text-white text-xl font-bold">Roles & Permissions</Text>
          <TouchableOpacity
            onPress={() => (activeTab === 'roles' ? openRoleModal() : openPermModal())}
            className="p-2 bg-blue-600 rounded-full"
          >
            <Plus size={18} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-full border mr-2 ${
              activeTab === 'roles' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <Text className={`text-[10px] uppercase ${activeTab === 'roles' ? 'text-blue-400' : 'text-zinc-500'}`}>
              Roles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-full border ${
              activeTab === 'permissions' ? 'bg-purple-600/20 border-purple-500/50' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <Text className={`text-[10px] uppercase ${activeTab === 'permissions' ? 'text-purple-300' : 'text-zinc-500'}`}>
              Permissions
            </Text>
          </TouchableOpacity>
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
        ) : activeTab === 'roles' ? (
          roles.map((role) => {
            const isExpanded = expandedId === role.id;
            const rolePermissions = role.permissions || [];
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
                        {rolePermissions.length} permissions
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center space-x-2">
                    <TouchableOpacity onPress={() => openRoleModal(role)} className="p-2 bg-zinc-900 rounded-full">
                      <Edit2 size={14} color="#a1a1aa" />
                    </TouchableOpacity>
                    {!role.isSystem && (
                      <TouchableOpacity onPress={() => handleDeleteRole(role)} className="p-2 bg-zinc-900 rounded-full">
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {role.description ? (
                  <Text className="text-zinc-500 text-xs mt-3">{role.description}</Text>
                ) : null}
                {isExpanded && (
                  <View className="mt-4 flex-row flex-wrap">
                    {rolePermissions.map((permission: any) => (
                      <View
                        key={permission.id}
                        className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 mr-2 mb-2"
                      >
                        <Text className="text-zinc-300 text-[10px] uppercase">
                          {permission.name}
                        </Text>
                      </View>
                    ))}
                    {rolePermissions.length === 0 && (
                      <Text className="text-zinc-600 text-xs">No permissions assigned.</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          permissions.map((perm) => (
            <View key={perm.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 items-center justify-center">
                    <Shield size={16} color="#c084fc" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">{perm.name}</Text>
                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                      {perm.description || 'No description'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity onPress={() => openPermModal(perm)} className="p-2 bg-zinc-900 rounded-full">
                    <Edit2 size={14} color="#a1a1aa" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePerm(perm)} className="p-2 bg-zinc-900 rounded-full">
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={roleModalOpen} transparent animationType="slide" onRequestClose={() => setRoleModalOpen(false)}>
        <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
          <View className="bg-zinc-900 rounded-t-[32px] p-6 h-[85%] border border-zinc-800">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">
                {editingRole ? 'Edit Role' : 'New Role'}
              </Text>
              <TouchableOpacity onPress={() => setRoleModalOpen(false)} className="p-2 bg-zinc-800 rounded-full">
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View className="mb-4">
                <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Role Name</Text>
                <TextInput
                  value={roleForm.name}
                  onChangeText={(text) => setRoleForm((prev) => ({ ...prev, name: text }))}
                  editable={!editingRole?.isSystem}
                  className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white"
                  placeholder="e.g. admin"
                  placeholderTextColor="#52525b"
                />
                {editingRole?.isSystem && (
                  <Text className="text-zinc-600 text-[10px] mt-2">
                    System role names are locked.
                  </Text>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Description</Text>
                <TextInput
                  value={roleForm.description}
                  onChangeText={(text) => setRoleForm((prev) => ({ ...prev, description: text }))}
                  className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white"
                  placeholder="Role summary"
                  placeholderTextColor="#52525b"
                />
              </View>

              <View className="mb-6">
                <Text className="text-zinc-400 text-xs font-bold mb-3 uppercase">Permissions</Text>
                {permissions.length === 0 ? (
                  <Text className="text-zinc-600 text-xs">No permissions available.</Text>
                ) : (
                  <View className="flex-row flex-wrap">
                    {permissions.map((perm) => {
                      const selected = roleForm.permissionIds.includes(perm.id);
                      return (
                        <TouchableOpacity
                          key={perm.id}
                          onPress={() => togglePermission(perm.id)}
                          className={`px-3 py-2 rounded-full border mr-2 mb-2 ${
                            selected ? 'bg-blue-600/20 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'
                          }`}
                        >
                          <View className="flex-row items-center space-x-2">
                            {selected && <Check size={12} color="#60a5fa" />}
                            <Text className={`text-[10px] uppercase ${selected ? 'text-blue-300' : 'text-zinc-500'}`}>
                              {perm.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSaveRole}
                disabled={roleSaving}
                className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2"
              >
                {roleSaving ? <ActivityIndicator color="black" /> : <Check size={18} color="black" />}
                <Text className="text-black font-bold">{roleSaving ? 'Saving...' : 'Save Role'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={permModalOpen} transparent animationType="slide" onRequestClose={() => setPermModalOpen(false)}>
        <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
          <View className="bg-zinc-900 rounded-t-[32px] p-6 h-[70%] border border-zinc-800">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">
                {editingPerm ? 'Edit Permission' : 'New Permission'}
              </Text>
              <TouchableOpacity onPress={() => setPermModalOpen(false)} className="p-2 bg-zinc-800 rounded-full">
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View className="mb-4">
                <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Permission Name</Text>
                <TextInput
                  value={permForm.name}
                  onChangeText={(text) => setPermForm((prev) => ({ ...prev, name: text }))}
                  className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white"
                  placeholder="domain:action"
                  placeholderTextColor="#52525b"
                />
              </View>

              <View className="mb-6">
                <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Description</Text>
                <TextInput
                  value={permForm.description}
                  onChangeText={(text) => setPermForm((prev) => ({ ...prev, description: text }))}
                  className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white"
                  placeholder="Permission summary"
                  placeholderTextColor="#52525b"
                />
              </View>

              <TouchableOpacity
                onPress={handleSavePerm}
                disabled={permSaving}
                className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2"
              >
                {permSaving ? <ActivityIndicator color="black" /> : <Check size={18} color="black" />}
                <Text className="text-black font-bold">{permSaving ? 'Saving...' : 'Save Permission'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
