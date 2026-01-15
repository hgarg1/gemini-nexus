import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Link2, Users, Shield, RefreshCw, Trash2, UserX } from 'lucide-react-native';
import { api } from '../../../lib/api';
import { Avatar } from '../../../components/ui/Avatar';

type TabKey = 'links' | 'requests' | 'members' | 'overrides';

export default function AdminOrganizationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orgId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('links');

  const [org, setOrg] = useState<any | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);

  const [linkLabel, setLinkLabel] = useState('');
  const [linkMaxUses, setLinkMaxUses] = useState('');
  const [linkRequiresApproval, setLinkRequiresApproval] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');
    try {
      const orgData = await api.admin.organizations.list();
      const found = (orgData.organizations || []).find((entry: any) => entry.id === orgId);
      setOrg(found || null);

      const [linksData, requestsData, membersData, overridesData] = await Promise.all([
        api.admin.organizations.links.list(orgId),
        api.admin.organizations.requests.list(orgId),
        api.admin.organizations.members.list(orgId),
        api.admin.organizations.overrides.list(orgId),
      ]);
      setLinks(linksData.links || []);
      setRequests(requestsData.requests || []);
      setMembers(membersData.members || []);
      setOverrides(overridesData.overrides || []);
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [orgId]);

  const baseTitle = org?.name || 'Organization';
  const memberCount = org?._count?.members ?? members.length;

  const handleCreateLink = async () => {
    if (!orgId) return;
    if (!linkLabel.trim()) {
      Alert.alert('Validation', 'Provide a label for the link.');
      return;
    }
    setCreatingLink(true);
    try {
      const payload: any = {
        label: linkLabel.trim(),
        requiresApproval: linkRequiresApproval,
      };
      if (linkMaxUses.trim()) {
        payload.maxUses = Number(linkMaxUses);
      }
      const created = await api.admin.organizations.links.create(orgId, payload);
      setLinks((prev) => [created, ...prev]);
      setLinkLabel('');
      setLinkMaxUses('');
      setLinkRequiresApproval(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to create link');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleToggleLink = async (link: any, key: 'active' | 'requiresApproval') => {
    if (!orgId) return;
    try {
      const updated = await api.admin.organizations.links.update(orgId, link.id, {
        [key]: !link[key],
      });
      setLinks((prev) => prev.map((item) => (item.id === link.id ? updated : item)));
    } catch (e) {
      Alert.alert('Error', 'Failed to update link');
    }
  };

  const handleReissue = async (link: any) => {
    if (!orgId) return;
    Alert.alert('Reissue Link', 'Rotate access code and reset usage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reissue',
        onPress: async () => {
          try {
            const updated = await api.admin.organizations.links.update(orgId, link.id, { reissue: true });
            setLinks((prev) => prev.map((item) => (item.id === link.id ? updated : item)));
          } catch (e) {
            Alert.alert('Error', 'Failed to reissue link');
          }
        },
      },
    ]);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!orgId) return;
    Alert.alert('Delete Link', 'Remove this invite link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.organizations.links.remove(orgId, linkId);
            setLinks((prev) => prev.filter((item) => item.id !== linkId));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete link');
          }
        },
      },
    ]);
  };

  const handleRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    if (!orgId) return;
    try {
      await api.admin.organizations.requests.action(orgId, requestId, action);
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      if (action === 'APPROVE') {
        onRefresh();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!orgId) return;
    Alert.alert('Remove Member', 'Remove this member from the organization?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.admin.organizations.members.remove(orgId, memberId);
            setMembers((prev) => prev.filter((member) => member.userId !== memberId));
          } catch (e) {
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleToggleOverride = async (override: any) => {
    if (!orgId) return;
    try {
      const updated = await api.admin.organizations.overrides.update(orgId, {
        permissionName: override.permission.name,
        value: !override.value,
      });
      setOverrides((prev) =>
        prev.map((item) => (item.id === override.id ? { ...item, value: updated.value } : item))
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to update override');
    }
  };

  const renderTabs = () => (
    <View className="flex-row flex-wrap mb-4">
      {(['links', 'requests', 'members', 'overrides'] as TabKey[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`px-3 py-2 rounded-2xl mr-2 mb-2 border ${
            activeTab === tab ? 'bg-blue-600/20 border-blue-500/40' : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          <Text className={`text-xs font-bold uppercase ${activeTab === tab ? 'text-blue-300' : 'text-zinc-400'}`}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView
        className="px-6 pt-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{baseTitle}</Text>
          <TouchableOpacity onPress={onRefresh} className="p-2 bg-zinc-900 rounded-full">
            <RefreshCw size={18} color="#60a5fa" />
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
        ) : (
          <>
            <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Shield size={16} color="#60a5fa" />
                  <Text className="text-white font-semibold ml-2">Sector Summary</Text>
                </View>
                <View className="flex-row items-center">
                  <Users size={14} color="#a1a1aa" />
                  <Text className="text-zinc-400 text-xs ml-2">{memberCount} members</Text>
                </View>
              </View>
              <Text className="text-zinc-500 text-xs mt-3">{org?.description || 'No description provided.'}</Text>
              <Text className="text-zinc-500 text-xs mt-2">Slug: {org?.slug || 'unknown'}</Text>
            </View>

            {renderTabs()}

            {activeTab === 'links' && (
              <View>
                <View className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-5">
                  <Text className="text-white font-semibold mb-3">Create Invite Link</Text>
                  <TextInput
                    value={linkLabel}
                    onChangeText={setLinkLabel}
                    placeholder="Label"
                    placeholderTextColor="#52525b"
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-white mb-3"
                  />
                  <TextInput
                    value={linkMaxUses}
                    onChangeText={setLinkMaxUses}
                    placeholder="Max uses (optional)"
                    placeholderTextColor="#52525b"
                    keyboardType="numeric"
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-white mb-3"
                  />
                  <TouchableOpacity
                    onPress={() => setLinkRequiresApproval((prev) => !prev)}
                    className="flex-row items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-4"
                  >
                    <Text className="text-white text-sm">Requires Approval</Text>
                    <Text className="text-zinc-400 text-xs font-bold">{linkRequiresApproval ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateLink}
                    disabled={creatingLink}
                    className="w-full bg-white rounded-2xl p-3 items-center"
                  >
                    {creatingLink ? <ActivityIndicator color="#111827" /> : <Text className="text-black font-bold">Create Link</Text>}
                  </TouchableOpacity>
                </View>

                {links.length === 0 ? (
                  <Text className="text-zinc-500 text-sm">No links configured.</Text>
                ) : (
                  links.map((link) => (
                    <View key={link.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Link2 size={14} color="#60a5fa" />
                          <Text className="text-white font-semibold ml-2">{link.label || 'UNLABELED'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteLink(link.id)}>
                          <Trash2 size={16} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-blue-400 text-xs font-mono mt-2">{link.code}</Text>
                      <View className="flex-row flex-wrap mt-3">
                        <TouchableOpacity
                          onPress={() => handleToggleLink(link, 'active')}
                          className={`px-3 py-1 rounded-full mr-2 mb-2 ${link.active ? 'bg-green-500/20' : 'bg-zinc-800'}`}
                        >
                          <Text className="text-xs font-bold text-white">{link.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleToggleLink(link, 'requiresApproval')}
                          className={`px-3 py-1 rounded-full mr-2 mb-2 ${link.requiresApproval ? 'bg-yellow-500/20' : 'bg-zinc-800'}`}
                        >
                          <Text className="text-xs font-bold text-white">
                            {link.requiresApproval ? 'APPROVAL' : 'AUTO'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleReissue(link)}
                          className="px-3 py-1 rounded-full mr-2 mb-2 bg-zinc-800"
                        >
                          <Text className="text-xs font-bold text-white">REISSUE</Text>
                        </TouchableOpacity>
                      </View>
                      <Text className="text-zinc-500 text-[10px] mt-2">
                        Uses: {link.useCount ?? 0}{link.maxUses ? ` / ${link.maxUses}` : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'requests' && (
              <View>
                {requests.length === 0 ? (
                  <Text className="text-zinc-500 text-sm">No pending requests.</Text>
                ) : (
                  requests.map((req) => (
                    <View key={req.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-4">
                      <View className="flex-row items-center">
                        <Avatar uri={req.user?.image} fallback={(req.user?.name || 'U')[0]} size="sm" />
                        <View className="ml-3 flex-1">
                          <Text className="text-white font-semibold">{req.user?.name || 'Unknown'}</Text>
                          <Text className="text-zinc-500 text-xs">{req.user?.email}</Text>
                        </View>
                        <View className="flex-row">
                          <TouchableOpacity onPress={() => handleRequest(req.id, 'APPROVE')} className="px-3 py-1 rounded-full bg-green-500/20 mr-2">
                            <Text className="text-xs font-bold text-green-200">APPROVE</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRequest(req.id, 'REJECT')} className="px-3 py-1 rounded-full bg-red-500/20">
                            <Text className="text-xs font-bold text-red-200">REJECT</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'members' && (
              <View>
                {members.length === 0 ? (
                  <Text className="text-zinc-500 text-sm">No members found.</Text>
                ) : (
                  members.map((member) => (
                    <View key={member.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <Avatar uri={member.user?.image} fallback={(member.user?.name || 'U')[0]} size="sm" />
                          <View className="ml-3 flex-1">
                            <Text className="text-white font-semibold">{member.user?.name || 'Unknown'}</Text>
                            <Text className="text-zinc-500 text-xs">{member.user?.email}</Text>
                            <Text className="text-zinc-500 text-[10px] mt-1">{member.role?.name || 'Member'}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveMember(member.userId)}>
                          <UserX size={16} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'overrides' && (
              <View>
                {overrides.length === 0 ? (
                  <Text className="text-zinc-500 text-sm">No overrides configured.</Text>
                ) : (
                  overrides.map((override) => (
                    <View key={override.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-white font-semibold">{override.permission?.name}</Text>
                          <Text className="text-zinc-500 text-[10px] mt-1 uppercase">
                            {override.value ? 'FORCE ALLOW' : 'FORCE DENY'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleToggleOverride(override)} className="px-3 py-1 rounded-full bg-zinc-800">
                          <Text className="text-xs font-bold text-white">TOGGLE</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
