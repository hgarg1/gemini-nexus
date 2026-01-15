import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, Send, Paperclip, Bot, X, ChevronDown, Check, GitBranch, Share2, Database, Image as ImageIcon, Users } from 'lucide-react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import { MotiView } from 'moti';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import { SettingsModal } from '../../components/SettingsModal';
import { VersionModal } from '../../components/VersionModal';
import { MemoryModal } from '../../components/MemoryModal';
import { AssetsModal } from '../../components/AssetsModal';
import { ShareModal } from '../../components/ShareModal';
import { CollaborationModal } from '../../components/CollaborationModal';

const reactionOptions = [
  '\uD83D\uDC4D',
  '\uD83D\uDD25',
  '\u2728',
  '\uD83D\uDCA1',
  '\uD83D\uDE80',
  '\u26A1',
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [chatPolicy, setChatPolicy] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("models/gemini-2.0-flash");
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("");
  const [config, setConfig] = useState({
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
    customKey: "",
    modelName: "models/gemini-2.0-flash",
  });
  
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const chatId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

  useEffect(() => {
    if (!chatId) return;

    const loadData = async () => {
      try {
        const [chatData, modelsData, policyData] = await Promise.all([
            api.chat.get(chatId),
            api.models.list(),
            api.chat.policy().catch(() => null),
        ]);
        
        if (chatData.chat) {
          const formatted = (chatData.chat.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            assets: m.assets || m.images || [],
            reactions: m.reactions || [],
          }));
          setMessages(formatted);
          if (chatData.chat.title) setChatTitle(chatData.chat.title);
          if (chatData.chat.config) {
             const loadedConfig = {
                temperature: chatData.chat.config.temperature ?? 0.7,
                topP: chatData.chat.config.topP ?? 0.8,
                maxOutputTokens: chatData.chat.config.maxOutputTokens ?? 2048,
                customKey: chatData.chat.config.customKey ?? "",
                modelName: chatData.chat.config.modelName ?? "models/gemini-2.0-flash",
             };
             setConfig(loadedConfig);
             if (loadedConfig.modelName) setSelectedModel(loadedConfig.modelName);
          }
        }
        
        if (modelsData.models) {
            setModels(modelsData.models);
        }

        if (policyData?.policy) {
            setChatPolicy(policyData.policy);
        }
        
        // Load initial version info to get default branch
        const versionData = await api.version.get(chatId);
        if (versionData.branches && versionData.branches.length > 0) {
            const master = versionData.branches.find((b: any) => b.name === 'master');
            setSelectedBranchId(master ? master.id : versionData.branches[0].id);
        }

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join-chat', chatId);
    
    api.auth.me().then(data => {
        if (data.user?.id) {
            setCurrentUser(data.user);
            socket.emit('join-user', data.user.id);
        }
    });

    socket.on('message-received', (msg: any) => {
      if (msg.chatId === chatId) {
        setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                assets: msg.assets || msg.images || [],
                reactions: msg.reactions || [],
            }];
        });
      }
    });

    socket.on('message-updated', (msg: any) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== msg.id) return m;
            const baseAssets = msg.assets || m.assets;
            let nextAssets = baseAssets;
            if (msg.labelsByImage && Array.isArray(baseAssets)) {
              nextAssets = baseAssets.map((asset: any) => {
                const url = typeof asset === 'string' ? asset : asset?.url;
                if (!url || !msg.labelsByImage[url]) return asset;
                if (typeof asset === 'string') {
                  return { url, labels: msg.labelsByImage[url] };
                }
                return { ...asset, labels: msg.labelsByImage[url] };
              });
            }
            return { ...m, content: msg.content, assets: nextAssets };
        }));
    });

    socket.on('user-typing', ({ userId, userName }) => {
        if (!userId || userId === currentUserIdRef.current) return;
        setTypingUsers(prev => ({ ...prev, [userId]: userName || 'Operator' }));
    });

    socket.on('user-stop-typing', ({ userId }) => {
        if (!userId) return;
        setTypingUsers(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    });

    socket.on('message-reaction', ({ messageId, emoji, userId, action }) => {
        if (!messageId || !emoji || !userId || !action) return;
        updateMessageReactions(messageId, emoji, userId, action);
    });

    return () => {
      socket.off('message-received');
      socket.off('message-updated');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('message-reaction');
    };
  }, [chatId]);

  const pickImage = async () => {
    const allowUploads = chatPolicy?.allowFileUploads ?? true;
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
      setAttachments(prev => [...prev, `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const updateMessageReactions = (messageId: string, emoji: string, userId: string, action: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = Array.isArray(m.reactions) ? m.reactions : [];
      if (action === 'ADDED') {
        return { ...m, reactions: [...reactions, { emoji, userId }] };
      }
      return {
        ...m,
        reactions: reactions.filter((r: any) => !(r.emoji === emoji && (r.userId || r.user?.id) === userId)),
      };
    }));
  };

  const handleUpdateConfig = async (newConfig: any) => {
    setConfig(newConfig);
    setSelectedModel(newConfig.modelName);
    try {
        await api.chat.update(chatId, { config: newConfig });
    } catch (e) {
        Alert.alert("Error", "Failed to save settings");
    }
  };

  const handleRenameChat = async (newTitle: string) => {
    setChatTitle(newTitle);
    try {
        await api.chat.update(chatId, { title: newTitle });
    } catch (e) {
        Alert.alert("Error", "Failed to rename chat");
    }
  };

  const handleDeleteChat = async () => {
    try {
        await api.chat.delete(chatId);
        router.replace('/(tabs)');
    } catch (e) {
        Alert.alert("Error", "Failed to delete chat");
    }
  };

  const emitTyping = () => {
    if (!chatId || !currentUser || !socketRef.current) return;
    socketRef.current.emit('typing', {
      chatId,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email || 'Operator',
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', {
        chatId,
        userId: currentUser.id,
      });
    }, 2000);
  };

  const stopTyping = () => {
    if (!chatId || !currentUser || !socketRef.current) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketRef.current.emit('stop-typing', {
      chatId,
      userId: currentUser.id,
    });
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    emitTyping();
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!currentUser?.id) return;
    try {
      const data = await api.chat.react(messageId, emoji);
      if (!data?.action) return;
      socketRef.current?.emit('message-reaction', {
        chatId,
        messageId,
        emoji,
        userId: currentUser.id,
        action: data.action,
      });
      updateMessageReactions(messageId, emoji, currentUser.id, data.action);
    } catch (error) {
      // Ignore for now
    } finally {
      setReactionTarget(null);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return;
    
    const tempId = Date.now().toString();
    const promptValue = message;
    const currentAttachments = [...attachments];
    
    const newMsg = {
      id: tempId,
      role: 'user',
      content: promptValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assets: currentAttachments,
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    setAttachments([]);
    setIsSending(true);
    stopTyping();

    try {
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const res = await api.chat.transmit({
            prompt: promptValue,
            chatId,
            history,
            branchId: selectedBranchId,
            images: currentAttachments, // Send base64 images
            config: {
                ...config,
                modelName: selectedModel, 
            }
        });
        
        if (res.userMessage) {
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m,
                id: res.userMessage.id,
                time: new Date(res.userMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                assets: res.userMessage.assets || m.assets,
                reactions: res.userMessage.reactions || [],
            } : m));
        }

        if (res.placeholderMessage) {
            setMessages(prev => {
                if (prev.find(m => m.id === res.placeholderMessage.id)) return prev;
                return [
                    ...prev,
                    {
                        id: res.placeholderMessage.id,
                        role: res.placeholderMessage.role,
                        content: res.placeholderMessage.content,
                        time: new Date(res.placeholderMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        assets: res.placeholderMessage.assets || [],
                        reactions: res.placeholderMessage.reactions || [],
                    }
                ];
            });
        }

        if (socketRef.current && chatId) {
            if (res.userMessage) {
                socketRef.current.emit('new-message', { chatId, message: res.userMessage });
            }
            if (res.placeholderMessage) {
                socketRef.current.emit('new-message', { chatId, message: res.placeholderMessage });
            }
        }

    } catch (error) {
        console.error("Failed to send:", error);
        Alert.alert("Error", "Failed to send message");
    } finally {
        setIsSending(false);
    }
  };
  
  const currentModelName = models.find(m => m.name === selectedModel)?.displayName || selectedModel.split('/').pop();
  const assets = useMemo(() => {
    return messages.flatMap((message: any) => {
      const list = Array.isArray(message.assets) ? message.assets : [];
      return list.map((asset: any) => ({
        url: typeof asset === 'string' ? asset : asset?.url,
        role: asset?.role || message.role,
        ratio: asset?.ratio || 'unknown',
        labels: asset?.labels || [],
      })).filter((asset: any) => !!asset.url);
    });
  }, [messages]);
  const assetsCount = assets.length;
  const allowUploads = chatPolicy?.allowFileUploads ?? true;
  const allowModelSelection = chatPolicy?.allowModelSelection ?? true;
  const allowCollaborators = chatPolicy?.allowCollaborators ?? true;
  const allowPublicLinks = chatPolicy?.allowPublicLinks ?? true;
  const allowCustomApiKey = chatPolicy?.allowCustomApiKey ?? true;
  const typingNames = useMemo(() => {
    const entries = Object.entries(typingUsers).filter(([userId]) => userId !== currentUser?.id);
    return entries.map(([, name]) => name || 'Operator');
  }, [typingUsers, currentUser?.id]);
  const typingLabel = typingNames.length
    ? `${typingNames.join(', ')} ${typingNames.length > 1 ? 'are' : 'is'} typing...`
    : '';

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/80 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 -ml-2 rounded-full active:bg-zinc-900">
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
                className={`flex-row items-center active:opacity-70 mr-2 ${allowModelSelection ? '' : 'opacity-50'}`}
                onPress={() => {
                  if (!allowModelSelection) {
                    Alert.alert('Model Selection Disabled', 'Model selection is restricted by policy.');
                    return;
                  }
                  setIsModelModalOpen(true);
                }}
                disabled={!allowModelSelection}
            >
              <Avatar fallback="G" size="sm" className="bg-blue-600 mr-2" />
              <View>
                <View className="flex-row items-center">
                    <Text className="text-white font-bold text-sm mr-1 max-w-[100px]" numberOfLines={1}>{currentModelName}</Text>
                    <ChevronDown size={12} color="#a1a1aa" />
                </View>
                <Text className="text-zinc-500 text-[10px]">Active</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center space-x-1">
             <TouchableOpacity 
                className="p-2 rounded-full active:bg-zinc-900"
                onPress={() => setIsMemoryOpen(true)}
             >
                <Database size={20} color="#a1a1aa" />
             </TouchableOpacity>
             <TouchableOpacity 
                className="p-2 rounded-full active:bg-zinc-900"
                onPress={() => setIsAssetsOpen(true)}
             >
                <ImageIcon size={20} color={assetsCount > 0 ? '#60a5fa' : '#a1a1aa'} />
             </TouchableOpacity>
              <TouchableOpacity 
                className={`p-2 rounded-full active:bg-zinc-900 ${allowCollaborators ? '' : 'opacity-50'}`}
                onPress={() => {
                  if (!allowCollaborators) {
                    Alert.alert('Collaboration Disabled', 'Collaborators are restricted by policy.');
                    return;
                  }
                  setIsCollabOpen(true);
                }}
                disabled={!allowCollaborators}
             >
                <Users size={20} color={allowCollaborators ? '#a1a1aa' : '#52525b'} />
              </TouchableOpacity>
              <TouchableOpacity 
                className={`p-2 rounded-full active:bg-zinc-900 ${allowPublicLinks ? '' : 'opacity-50'}`}
                onPress={() => {
                  if (!allowPublicLinks) {
                    Alert.alert('Sharing Disabled', 'Public links are restricted by policy.');
                    return;
                  }
                  setIsShareOpen(true);
                }}
                disabled={!allowPublicLinks}
              >
                <Share2 size={20} color={allowPublicLinks ? '#a1a1aa' : '#52525b'} />
              </TouchableOpacity>
             <TouchableOpacity 
                className="p-2 rounded-full active:bg-zinc-900"
                onPress={() => setIsVersionOpen(true)}
             >
                <GitBranch size={20} color={selectedBranchId ? '#60a5fa' : '#a1a1aa'} />
             </TouchableOpacity>
             <TouchableOpacity 
                className="p-2 rounded-full active:bg-zinc-900"
                onPress={() => setIsSettingsOpen(true)}
             >
                <MoreVertical size={24} color="white" />
             </TouchableOpacity>
          </View>
        </View>

        {/* Settings Modal */}
        <SettingsModal 
            visible={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            chatTitle={chatTitle}
            onRename={handleRenameChat}
            onDelete={handleDeleteChat}
            allowCustomApiKey={allowCustomApiKey}
        />

        {/* Version Modal */}
        <VersionModal
            visible={isVersionOpen}
            onClose={() => setIsVersionOpen(false)}
            chatId={chatId}
            selectedBranchId={selectedBranchId}
            onSelectBranch={setSelectedBranchId}
        />

        <MemoryModal
            visible={isMemoryOpen}
            onClose={() => setIsMemoryOpen(false)}
        />

        <AssetsModal
            visible={isAssetsOpen}
            onClose={() => setIsAssetsOpen(false)}
            assets={assets}
        />

        {chatId ? (
          <ShareModal
              visible={isShareOpen}
              onClose={() => setIsShareOpen(false)}
              chatId={chatId}
          />
        ) : null}

        {chatId ? (
          <CollaborationModal
              visible={isCollabOpen}
              onClose={() => setIsCollabOpen(false)}
              chatId={chatId}
          />
        ) : null}

        {/* Model Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModelModalOpen}
            onRequestClose={() => setIsModelModalOpen(false)}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-zinc-900 rounded-t-3xl p-6 h-[50%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">Select Model</Text>
                        <TouchableOpacity onPress={() => setIsModelModalOpen(false)}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={models}
                        keyExtractor={item => item.name}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${selectedModel === item.name ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-zinc-800'}`}
                                onPress={() => {
                                    const newConfig = { ...config, modelName: item.name };
                                    setConfig(newConfig);
                                    setSelectedModel(item.name);
                                    handleUpdateConfig(newConfig); // Auto-save model change
                                    setIsModelModalOpen(false);
                                }}
                            >
                                <View>
                                    <Text className={`font-bold text-base ${selectedModel === item.name ? 'text-blue-400' : 'text-white'}`}>{item.displayName}</Text>
                                    <Text className="text-zinc-500 text-xs">{item.name}</Text>
                                </View>
                                {selectedModel === item.name && <Check size={20} color="#60a5fa" />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          className="flex-1"
        >
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                  const reactions = (item.reactions || []).reduce((acc: any, r: any) => {
                    const key = r.emoji;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {});

                  return (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: 10 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300 }}
                        className={`mb-6 flex-row ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {item.role === 'model' && (
                        <View className="mr-2 mt-auto">
                            <View className="w-8 h-8 rounded-full bg-blue-600/20 items-center justify-center border border-blue-500/30">
                                <Bot size={16} color="#3b82f6" />
                            </View>
                        </View>
                        )}
                        
                        <View 
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            item.role === 'user' 
                            ? 'bg-blue-600 rounded-tr-sm' 
                            : 'bg-zinc-800 rounded-tl-sm'
                        }`}
                        >
                        {Array.isArray(item.assets) && item.assets.length > 0 && (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              className="mb-2"
                            >
                              {item.assets.map((asset: any, assetIndex: number) => {
                                const uri = typeof asset === 'string' ? asset : asset?.url;
                                if (!uri) return null;
                                return (
                                  <Image
                                    key={`${item.id}-asset-${assetIndex}`}
                                    source={{ uri }}
                                    className="w-32 h-24 rounded-lg mr-2 border border-white/10"
                                  />
                                );
                              })}
                            </ScrollView>
                        )}
                        <Markdown
                            style={{
                                body: { color: item.role === 'user' ? 'white' : '#f4f4f5', fontSize: 16 },
                                code_inline: { backgroundColor: '#3f3f46', color: '#e4e4e7', borderRadius: 4 },
                                fence: { backgroundColor: '#18181b', color: '#e4e4e7', borderRadius: 8, marginVertical: 8 },
                            }}
                        >
                            {item.content}
                        </Markdown>
                        <Text className={`text-[10px] mt-1 text-right ${item.role === 'user' ? 'text-blue-200' : 'text-zinc-500'}`}>
                            {item.time}
                        </Text>
                        <View className={`flex-row flex-wrap items-center mt-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <TouchableOpacity
                              key={`${item.id}-${emoji}`}
                              onPress={() => handleReact(item.id, emoji)}
                              className="px-2 py-1 rounded-full bg-black/40 border border-zinc-700 mr-2 mb-2"
                            >
                              <Text className="text-xs text-white">
                                {emoji} {count}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity
                            onPress={() => setReactionTarget(item.id)}
                            className="px-2 py-1 rounded-full bg-black/40 border border-zinc-700 mb-2"
                          >
                            <Text className="text-xs text-zinc-300">+</Text>
                          </TouchableOpacity>
                        </View>
                        </View>

                        {item.role === 'user' && (
                        <View className="ml-2 mt-auto">
                            <Avatar fallback="Me" size="sm" className="w-8 h-8" />
                        </View>
                        )}
                    </MotiView>
                  );
                }}
            />
          )}

          {typingLabel ? (
            <View className="px-4 pb-2">
              <Text className="text-zinc-500 text-xs">{typingLabel}</Text>
            </View>
          ) : null}

          {/* Attachment Previews */}
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

          {/* Input Area */}
          <View className="px-4 py-3 border-t border-zinc-900 bg-black">
            <View className="flex-row items-end space-x-2">
              <TouchableOpacity 
                onPress={pickImage}
                disabled={!allowUploads}
                className={`p-3 bg-zinc-900 rounded-full mb-[1px] ${allowUploads ? '' : 'opacity-50'}`}
              >
                <Paperclip size={20} color={allowUploads ? '#a1a1aa' : '#52525b'} />
              </TouchableOpacity>
              
              <View className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 focus:border-blue-500/50 min-h-[50px] justify-center">
                <TextInput
                  value={message}
                  onChangeText={handleMessageChange}
                  placeholder="Message..."
                  placeholderTextColor="#71717a"
                  multiline
                  className="text-white text-base max-h-32"
                  style={{ padding: 0 }} 
                />
              </View>

              <TouchableOpacity 
                onPress={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || isSending}
                className={`p-3 rounded-full mb-[1px] ${message.trim() || attachments.length > 0 ? 'bg-blue-600' : 'bg-zinc-800'}`}
              >
                {isSending ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Send size={20} color={message.trim() || attachments.length > 0 ? 'white' : '#71717a'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

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
      </SafeAreaView>
    </View>
  );
}
