import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Users, MessageSquare, Globe, FileText, Zap, AlertTriangle, Lock, Server } from 'lucide-react-native';
import { api } from '../../lib/api';

type PolicyMap = Record<string, boolean>;

const SECTION_DEFS = [
  {
    title: 'Network Features',
    icon: Globe,
    items: [
      { key: 'allowPublicLinks', label: 'Public Links', description: 'Share chats via public URL', allowOverride: true },
      { key: 'allowCollaborators', label: 'Collaboration', description: 'Invite others to chats', allowOverride: true },
      { key: 'allowFriendRequests', label: 'Friend Requests', description: 'User-to-user connection requests', allowOverride: true },
    ],
  },
  {
    title: 'Content Policy',
    icon: MessageSquare,
    items: [
      { key: 'allowDirectMessages', label: 'Direct Messages', description: '1:1 private messaging', allowOverride: true },
      { key: 'allowGroupChats', label: 'Group Chats', description: 'Multi-user channels', allowOverride: true },
      { key: 'allowFileUploads', label: 'File Uploads', description: 'Image/file attachments', allowOverride: true },
      { key: 'allowModelSelection', label: 'Model Selection', description: 'Users can change model', allowOverride: true },
      { key: 'allowCustomApiKey', label: 'Custom API Keys', description: 'Users bring their own keys', allowOverride: true },
      { key: 'allowEmailNotifications', label: 'Email Notifications', description: 'Email alerts for messages', allowOverride: true },
    ],
  },
  {
    title: 'Destructive Actions',
    icon: AlertTriangle,
    items: [
      { key: 'allowDeleteThreads', label: 'Delete Threads', description: 'Users can delete full history', allowOverride: true },
      { key: 'allowLeaveThreads', label: 'Leave Threads', description: 'Users can leave group chats', allowOverride: true },
    ],
  },
];

export default function AdminChatPolicyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<any>({});
  const [orgOverride, setOrgOverride] = useState<any>({});
  const [error, setError] = useState('');

  const fetchPolicy = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.chatPolicy.get();
      setPolicy(data.policy || {});
      setOrgOverride(data.orgOverride || {});
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const togglePolicy = (key: string) => {
    setPolicy((prev: PolicyMap) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const toggleOverride = (key: string) => {
    setOrgOverride((prev: PolicyMap) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.chatPolicy.update({ policy, orgOverride });
      Alert.alert('Saved', 'Chat policy updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update chat policy');
    } finally {
      setSaving(false);
    }
  };

  const adminConstraint = useMemo(() => policy?.adminChatConstraint || 'none', [policy]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView className="px-6 pt-8" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Chat Protocols</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || loading || !!error}
            className="p-2 bg-zinc-900 rounded-full"
          >
            {saving ? <Server size={18} color="#60a5fa" /> : <Shield size={18} color="#60a5fa" />}
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
              <Text className="text-white text-base font-bold mb-4">Admin Controls</Text>
              <View className="mb-4">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">Admin Chat Constraint</Text>
                <View className="flex-row mt-2">
                  {['none', 'admins_only'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setPolicy((prev: any) => ({ ...prev, adminChatConstraint: opt }))}
                      className={`flex-1 py-2 rounded-2xl mr-2 ${adminConstraint === opt ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-zinc-900/50 border border-zinc-800'}`}
                    >
                      <Text className={`text-center text-xs font-bold ${adminConstraint === opt ? 'text-emerald-200' : 'text-zinc-400'}`}>
                        {opt.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="flex-row items-center justify-between p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <View className="flex-row items-center">
                  <Lock size={14} color="#f97316" />
                  <Text className="text-white text-sm font-semibold ml-2">Admin Bypass</Text>
                </View>
                <TouchableOpacity onPress={() => togglePolicy('adminBypass')} className="px-3 py-1 rounded-full bg-zinc-800">
                  <Text className="text-xs font-bold text-white">{policy?.adminBypass ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {SECTION_DEFS.map((section) => {
              const Icon = section.icon;
              return (
                <View key={section.title} className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <Icon size={16} color="#60a5fa" />
                    <Text className="text-white text-sm font-bold ml-2">{section.title}</Text>
                  </View>
                  {section.items.map((item) => (
                    <View key={item.key} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 mb-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                          <Text className="text-white font-semibold">{item.label}</Text>
                          <Text className="text-zinc-500 text-xs mt-1">{item.description}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => togglePolicy(item.key)}
                          className={`px-3 py-1 rounded-full ${policy?.[item.key] ? 'bg-blue-500/20' : 'bg-zinc-800'}`}
                        >
                          <Text className="text-xs font-bold text-white">{policy?.[item.key] ? 'ON' : 'OFF'}</Text>
                        </TouchableOpacity>
                      </View>
                      {item.allowOverride && (
                        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                          <View className="flex-row items-center">
                            <Users size={12} color="#a1a1aa" />
                            <Text className="text-zinc-500 text-[10px] uppercase tracking-widest ml-2">
                              Delegate to org admins
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => toggleOverride(item.key)}
                            className={`px-3 py-1 rounded-full ${orgOverride?.[item.key] ? 'bg-purple-500/20' : 'bg-zinc-800'}`}
                          >
                            <Text className="text-xs font-bold text-white">{orgOverride?.[item.key] ? 'ON' : 'OFF'}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}

            <View className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-4">
              <View className="flex-row items-start">
                <Shield size={14} color="#60a5fa" />
                <Text className="text-blue-200 text-xs ml-2">
                  When Delegate is enabled, Organization Admins can restrict the feature for their members even if global
                  policy allows it.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
