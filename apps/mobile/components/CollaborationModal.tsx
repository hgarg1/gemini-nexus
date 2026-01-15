import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Users, X, MessageSquare, Link2, Search, Plus, ArrowLeft, Send, Paperclip, Settings, Trash2, UserX } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { api, API_BASE_URL } from '../lib/api';
import { Avatar } from './ui/Avatar';
import { AppearanceModal } from './AppearanceModal';

interface CollaborationModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
}

const reactionOptions = [
  '\uD83D\uDC4D',
  '\uD83D\uDD25',
  '\u2728',
  '\uD83D\uDCA1',
  '\uD83D\uDE80',
  '\u26A1',
];

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(96, 165, 250, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CollaborationModal({ visible, onClose, chatId }: CollaborationModalProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'links'>('chats');

  const [links, setLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [policy, setPolicy] = useState<any>(null);

  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState<any[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [appearance, setAppearance] = useState<any>(null);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [me, setMe] = useState<any | null>(null);

  const listRef = useRef<FlatList>(null);
  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/api$/, ''), []);

  useEffect(() => {
    if (!visible) return;
    setActiveTab('chats');
    setActiveUser(null);
    setDraft('');
    setAttachments([]);
    setReactionTarget(null);
    loadPolicy();
    loadLinks();
    loadConnections();
    loadMe();
  }, [visible, chatId]);

  useEffect(() => {
    if (!directoryQuery.trim()) {
      setDirectoryResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetchDirectoryUsers(directoryQuery.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [directoryQuery]);

  const loadMe = async () => {
    try {
      const data = await api.auth.me();
      if (data.user) setMe(data.user);
    } catch (e) {
      // Ignore
    }
  };

  const loadPolicy = async () => {
    try {
      const data = await api.chat.policy();
      if (data.policy) setPolicy(data.policy);
    } catch (e) {
      // Ignore
    }
  };

  const loadLinks = async () => {
    if (!chatId) return;
    setLinksLoading(true);
    try {
      const data = await api.chat.links.list(chatId);
      setLinks(data.links || []);
    } catch (e) {
      // Ignore
    } finally {
      setLinksLoading(false);
    }
  };

  const loadConnections = async () => {
    setConnectionsLoading(true);
    try {
      const data = await api.collaboration.connections.list();
      setConnections(data.connections || []);
    } catch (e) {
      // Ignore
    } finally {
      setConnectionsLoading(false);
    }
  };

  const fetchDirectoryUsers = async (query: string) => {
    setDirectoryLoading(true);
    try {
      const data = await api.collaboration.users.search(query);
      setDirectoryResults(data.users || []);
    } catch (e) {
      // Ignore
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openThread = async (user: any) => {
    setActiveUser(user);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const data = await api.collaboration.messages.list(user.id);
      setMessages(data.messages || []);
      setAppearance(data.appearance || null);
    } catch (e) {
      // Ignore
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!chatId) return;
    setCreatingLink(true);
    try {
      const payload: any = {};
      if (linkLabel.trim()) payload.label = linkLabel.trim();
      await api.chat.links.create(chatId, payload);
      setLinkLabel('');
      await loadLinks();
    } catch (e) {
      Alert.alert('Error', 'Failed to create link');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleToggleLink = async (link: any) => {
    try {
      await api.chat.links.update(chatId, link.id, { active: !link.active });
      await loadLinks();
    } catch (e) {
      Alert.alert('Error', 'Failed to update link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    Alert.alert('Delete Link', 'Disable and remove this link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.chat.links.remove(chatId, linkId);
            await loadLinks();
          } catch (e) {
            Alert.alert('Error', 'Failed to remove link');
          }
        },
      },
    ]);
  };

  const pickImage = async () => {
    const allowUploads = policy?.allowFileUploads ?? true;
    if (!allowUploads) {
      Alert.alert('Uploads Disabled', 'File uploads are restricted by policy.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAttachments((prev) => [
        ...prev,
        `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`,
      ]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!activeUser || (!draft.trim() && attachments.length === 0) || sending) return;
    if (activeUser.id === me?.id) {
      Alert.alert('Invalid Target', 'You cannot message yourself.');
      return;
    }

    const tempId = Date.now().toString();
    const optimistic = {
      id: tempId,
      content: draft,
      senderId: me?.id,
      receiverId: activeUser.id,
      createdAt: new Date().toISOString(),
      assets: attachments.map((url, idx) => ({ id: `temp-${idx}`, url })),
      reactions: [],
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setAttachments([]);
    setSending(true);

    try {
      const data = await api.collaboration.messages.send({
        userId: activeUser.id,
        content: optimistic.content,
        assetUrls: attachments,
      });
      if (data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const data = await api.collaboration.messages.react(messageId, emoji);
      const action = data.action;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          if (action === 'ADDED') {
            return { ...m, reactions: [...reactions, { emoji, userId: me?.id }] };
          }
          return {
            ...m,
            reactions: reactions.filter(
              (r: any) => !(r.emoji === emoji && (r.userId || r.user?.id) === me?.id)
            ),
          };
        })
      );
    } catch (e) {
      // Ignore
    } finally {
      setReactionTarget(null);
    }
  };

  const handleDeleteThread = async () => {
    if (!activeUser) return;
    Alert.alert('Delete Thread', 'Delete this conversation and all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.collaboration.threads.delete(activeUser.id);
            setActiveUser(null);
            setMessages([]);
            await loadConnections();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete thread');
          }
        },
      },
    ]);
  };

  const handleBlockUser = async () => {
    if (!activeUser) return;
    Alert.alert('Block User', 'Block this user and disable messaging?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.collaboration.block(activeUser.id);
            Alert.alert('Blocked', 'User blocked successfully');
          } catch (e) {
            Alert.alert('Error', 'Failed to block user');
          }
        },
      },
    ]);
  };

  const handleSaveAppearance = async (settings: any) => {
    if (!activeUser) return;
    try {
      await api.collaboration.messages.updateAppearance(activeUser.id, settings);
      setAppearance(settings);
    } catch (e) {
      Alert.alert('Error', 'Failed to update appearance');
    }
  };

  const filteredConnections = useMemo(() => {
    const term = directoryQuery.trim().toLowerCase();
    if (!term) return connections;
    return connections.filter((c) => (c.name || '').toLowerCase().includes(term));
  }, [connections, directoryQuery]);

  const activeCount = links.filter((link) => link.active).length;
  const bubbleColor = appearance?.bubbleColor || '#00f2ff';
  const bubbleBackground = hexToRgba(bubbleColor, 0.15);
  const fontFamily =
    appearance?.fontFamily === 'mono'
      ? 'monospace'
      : appearance?.fontFamily === 'serif'
        ? 'serif'
        : undefined;
  const messageSpacing = appearance?.density === 'compact' ? 10 : 18;
  const themeBackground =
    appearance?.theme === 'void'
      ? '#000000'
      : appearance?.theme === 'organic'
        ? '#05100a'
        : appearance?.theme === 'minimal'
          ? '#0f0f10'
          : 'rgba(0, 0, 0, 0.4)';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
        <View className="h-[90%] bg-black border border-zinc-800 rounded-t-[32px] overflow-hidden">
          <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
            <View className="flex-row items-center space-x-2">
              <Users size={20} color="#60a5fa" />
              <Text className="text-white text-xl font-bold">Collaboration</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="flex-row px-6 py-3 border-b border-zinc-900">
            <TouchableOpacity
              onPress={() => setActiveTab('chats')}
              className={`mr-6 pb-2 border-b-2 ${
                activeTab === 'chats' ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center space-x-2">
                <MessageSquare size={14} color={activeTab === 'chats' ? '#60a5fa' : '#71717a'} />
                <Text className={`${activeTab === 'chats' ? 'text-blue-400' : 'text-zinc-500'} font-bold`}>
                  CHATS
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('links')}
              className={`pb-2 border-b-2 ${
                activeTab === 'links' ? 'border-purple-500' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center space-x-2">
                <Link2 size={14} color={activeTab === 'links' ? '#c084fc' : '#71717a'} />
                <Text className={`${activeTab === 'links' ? 'text-purple-400' : 'text-zinc-500'} font-bold`}>
                  LINKS
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {activeTab === 'links' ? (
            <ScrollView className="flex-1 px-6 py-4">
              <View className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4">
                <Text className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">Active Links</Text>
                <Text className="text-white text-lg font-semibold mt-2">
                  {activeCount} {policy?.maxLinks ? `/ ${policy.maxLinks}` : ''}
                </Text>
              </View>

              <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 mb-4">
                <TextInput
                  value={linkLabel}
                  onChangeText={setLinkLabel}
                  placeholder="Optional label"
                  placeholderTextColor="#52525b"
                  className="flex-1 text-white"
                />
                <TouchableOpacity onPress={handleCreateLink} disabled={creatingLink} className="ml-3">
                  {creatingLink ? <ActivityIndicator size="small" color="#60a5fa" /> : <Plus size={18} color="#60a5fa" />}
                </TouchableOpacity>
              </View>

              {linksLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="small" color="#60a5fa" />
                </View>
              ) : links.length === 0 ? (
                <View className="py-10 items-center">
                  <Text className="text-zinc-500 text-sm">No active links</Text>
                </View>
              ) : (
                links.map((link) => (
                  <View key={link.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-semibold" numberOfLines={1}>
                        {link.label || 'UNLABELED'}
                      </Text>
                      <View className="flex-row items-center space-x-3">
                        <TouchableOpacity onPress={() => handleToggleLink(link)}>
                          <Text className={`text-xs font-bold ${link.active ? 'text-green-400' : 'text-zinc-500'}`}>
                            {link.active ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteLink(link.id)}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text selectable className="text-blue-400 text-xs font-mono">
                      {baseUrl}/join/{link.code}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <View className="flex-1">
              {activeUser ? (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  className="flex-1"
                  style={{ backgroundColor: themeBackground }}
                >
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900">
                    <View className="flex-row items-center space-x-3">
                      <TouchableOpacity onPress={() => setActiveUser(null)} className="p-2 rounded-full bg-zinc-900">
                        <ArrowLeft size={18} color="white" />
                      </TouchableOpacity>
                      <Avatar uri={activeUser.image} fallback={(activeUser.name || 'U')[0]} size="sm" />
                      <Text className="text-white font-bold" numberOfLines={1}>{activeUser.name || 'UNKNOWN'}</Text>
                    </View>
                    <View className="flex-row items-center space-x-2">
                      <TouchableOpacity onPress={() => setIsAppearanceOpen(true)} className="p-2 rounded-full bg-zinc-900">
                        <Settings size={16} color="#a1a1aa" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleDeleteThread} className="p-2 rounded-full bg-zinc-900">
                        <Trash2 size={16} color="#f87171" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleBlockUser} className="p-2 rounded-full bg-zinc-900">
                        <UserX size={16} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {messagesLoading ? (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator size="large" color="#60a5fa" />
                    </View>
                  ) : (
                    <FlatList
                      ref={listRef}
                      data={messages}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                      renderItem={({ item }) => {
                        const isMe = item.senderId === me?.id;
                        const reactions = (item.reactions || []).reduce((acc: any, r: any) => {
                          const key = r.emoji;
                          acc[key] = (acc[key] || 0) + 1;
                          return acc;
                        }, {});
                        const assets = Array.isArray(item.assets) ? item.assets : [];

                        return (
                          <View style={{ marginBottom: messageSpacing }} className={`flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <View
                              className={`max-w-[85%] rounded-2xl px-4 py-3 border ${isMe ? 'rounded-tr-sm bg-transparent' : 'rounded-tl-sm bg-zinc-900/60 border-zinc-800'}`}
                              style={isMe ? { backgroundColor: bubbleBackground, borderColor: bubbleColor } : undefined}
                            >
                              {assets.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                  {assets.map((asset: any, idx: number) => {
                                    const uri = typeof asset === 'string' ? asset : asset?.url;
                                    if (!uri) return null;
                                    return (
                                      <Image
                                        key={`${item.id}-asset-${idx}`}
                                        source={{ uri }}
                                        className="w-28 h-20 rounded-lg mr-2 border border-white/10"
                                      />
                                    );
                                  })}
                                </ScrollView>
                              )}
                              {item.content ? (
                                <Markdown
                                  style={{
                                    body: { color: isMe ? bubbleColor : '#f4f4f5', fontSize: 16, fontFamily },
                                    code_inline: { backgroundColor: '#3f3f46', color: '#e4e4e7', borderRadius: 4 },
                                    fence: { backgroundColor: '#18181b', color: '#e4e4e7', borderRadius: 8, marginVertical: 8 },
                                  }}
                                >
                                  {item.content}
                                </Markdown>
                              ) : null}
                              <Text className={`text-[10px] mt-2 ${isMe ? 'text-right' : 'text-left'} text-zinc-500`}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                              </Text>

                              <View className="absolute -top-3 right-2">
                                <TouchableOpacity onPress={() => setReactionTarget(item.id)} className="px-2 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                                  <Text className="text-xs text-zinc-400">+</Text>
                                </TouchableOpacity>
                              </View>

                              {Object.keys(reactions).length > 0 && (
                                <View className="flex-row flex-wrap gap-1 mt-2">
                                  {Object.entries(reactions).map(([emoji, count]) => (
                                    <TouchableOpacity key={`${item.id}-${emoji}`} onPress={() => handleReact(item.id, emoji)} className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">
                                      <Text className="text-xs text-white">
                                        {emoji} {count}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      }}
                    />
                  )}

                  {attachments.length > 0 && (
                    <ScrollView horizontal className="px-4 py-2 bg-zinc-900 border-t border-zinc-800" showsHorizontalScrollIndicator={false}>
                      {attachments.map((uri, index) => (
                        <View key={index} className="mr-3 relative">
                          <Image source={{ uri }} className="w-16 h-16 rounded-lg" />
                          <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-zinc-700"
                          >
                            <X size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  <View className="px-4 py-3 border-t border-zinc-900 bg-black">
                    <View className="flex-row items-end space-x-2">
                      <TouchableOpacity onPress={pickImage} className="p-3 bg-zinc-900 rounded-full mb-[1px]">
                        <Paperclip size={20} color="#a1a1aa" />
                      </TouchableOpacity>
                      <View className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 min-h-[50px] justify-center">
                        <TextInput
                          value={draft}
                          onChangeText={setDraft}
                          placeholder="Message..."
                          placeholderTextColor="#71717a"
                          multiline
                          className="text-white text-base max-h-32"
                          style={{ padding: 0, fontFamily }}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={handleSend}
                        disabled={(!draft.trim() && attachments.length === 0) || sending}
                        className={`p-3 rounded-full mb-[1px] ${draft.trim() || attachments.length > 0 ? 'bg-blue-600' : 'bg-zinc-800'}`}
                      >
                        {sending ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Send size={20} color={draft.trim() || attachments.length > 0 ? 'white' : '#71717a'} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              ) : (
                <ScrollView className="flex-1 px-6 py-4">
                  <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 mb-4">
                    <Search size={16} color="#71717a" />
                    <TextInput
                      value={directoryQuery}
                      onChangeText={setDirectoryQuery}
                      placeholder="Search users or filter connections"
                      placeholderTextColor="#52525b"
                      className="flex-1 text-white ml-3"
                      autoCapitalize="none"
                    />
                  </View>

                  {directoryQuery.trim() ? (
                    <View className="mb-6">
                      <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Directory</Text>
                      {directoryLoading ? (
                        <ActivityIndicator size="small" color="#60a5fa" />
                      ) : directoryResults.length === 0 ? (
                        <Text className="text-zinc-500 text-sm">No users found</Text>
                      ) : (
                        directoryResults.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            onPress={() => openThread(user)}
                            className="flex-row items-center p-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 mb-3"
                          >
                            <Avatar uri={user.image} fallback={(user.name || 'U')[0]} size="sm" />
                            <View className="ml-3 flex-1">
                              <Text className="text-white font-semibold" numberOfLines={1}>{user.name || 'UNKNOWN'}</Text>
                              <Text className="text-zinc-500 text-xs" numberOfLines={1}>{user.email}</Text>
                            </View>
                            <Plus size={16} color="#60a5fa" />
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  ) : null}

                  <View>
                    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Direct Threads</Text>
                    {connectionsLoading ? (
                      <ActivityIndicator size="small" color="#60a5fa" />
                    ) : filteredConnections.length === 0 ? (
                      <Text className="text-zinc-500 text-sm">No direct threads yet</Text>
                    ) : (
                      filteredConnections.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => openThread(user)}
                          className="flex-row items-center p-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 mb-3"
                        >
                          <Avatar uri={user.image} fallback={(user.name || 'U')[0]} size="sm" />
                          <View className="ml-3 flex-1">
                            <Text className="text-white font-semibold" numberOfLines={1}>{user.name || 'UNKNOWN'}</Text>
                            <Text className="text-zinc-500 text-xs">Tap to message</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </BlurView>

      <AppearanceModal
        visible={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
        initialSettings={appearance}
        onSave={handleSaveAppearance}
      />

      <Modal visible={!!reactionTarget} transparent animationType="fade" onRequestClose={() => setReactionTarget(null)}>
        <View className="flex-1 bg-black/60 items-center justify-center">
          <View className="flex-row bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 space-x-3">
            {reactionOptions.map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => reactionTarget && handleReact(reactionTarget, emoji)}>
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
