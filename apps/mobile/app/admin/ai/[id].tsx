import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, ShieldAlert, Check, X, Bot } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { api } from '../../../lib/api';

export default function AdminAIChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');

  const listRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    if (!chatId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.ai.messages.list(chatId);
      setMessages(data.messages || []);
    } catch (e: any) {
      setError(e?.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  const handleSend = async () => {
    if (!draft.trim() || !chatId || sending) return;
    const prompt = draft.trim();
    setDraft('');
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: prompt, createdAt: new Date().toISOString() },
    ]);
    try {
      const data = await api.admin.ai.send({ prompt, chatId });
      if (data?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-model-${Date.now()}`,
            role: 'model',
            content: data.message,
            proposal: data.proposal,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      await loadMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to send prompt');
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async (proposal: any) => {
    if (!chatId || confirming) return;
    setConfirming(true);
    try {
      await api.admin.ai.send({ chatId, confirmedAction: proposal });
      await loadMessages();
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm action');
    } finally {
      setConfirming(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    return (
      <View className={`mb-5 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
        <View className={`max-w-[85%] rounded-2xl px-4 py-3 border ${isUser ? 'rounded-tr-sm bg-blue-600/20 border-blue-500/40' : 'rounded-tl-sm bg-zinc-900/60 border-zinc-800'}`}>
          <Markdown
            style={{
              body: { color: isUser ? '#bfdbfe' : '#f4f4f5', fontSize: 14 },
              code_inline: { backgroundColor: '#3f3f46', color: '#e4e4e7', borderRadius: 4 },
              fence: { backgroundColor: '#18181b', color: '#e4e4e7', borderRadius: 8, marginVertical: 8 },
            }}
          >
            {item.content || ''}
          </Markdown>
          <Text className="text-[10px] mt-2 text-zinc-500">
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>

          {item.proposal && (
            <View className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/30">
              <View className="flex-row items-center mb-2">
                <ShieldAlert size={14} color="#f87171" />
                <Text className="text-red-200 text-xs font-bold ml-2">Action Required</Text>
              </View>
              <Text className="text-red-200 text-xs mb-2">
                Proposed: {item.proposal?.type || 'unknown'}
              </Text>
              <ScrollView className="max-h-24 mb-3">
                <Text className="text-red-100 text-[10px] font-mono">
                  {JSON.stringify(item.proposal?.data || {}, null, 2)}
                </Text>
              </ScrollView>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => handleConfirm(item.proposal)}
                  disabled={confirming}
                  className="flex-row items-center px-3 py-2 rounded-xl bg-red-500/30 mr-2"
                >
                  <Check size={12} color="#fecaca" />
                  <Text className="text-red-100 text-xs font-bold ml-1">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center px-3 py-2 rounded-xl bg-zinc-800">
                  <X size={12} color="#a1a1aa" />
                  <Text className="text-zinc-300 text-xs font-bold ml-1">Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <View className="flex-row items-center justify-between px-6 pt-8 pb-4 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <Bot size={18} color="#60a5fa" />
          <Text className="text-white text-lg font-bold ml-2">Admin AI Session</Text>
        </View>
        <View className="w-8 h-8" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-lg font-bold">Access Denied</Text>
          <Text className="text-zinc-500 text-sm mt-2 text-center">{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${index}`}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={renderMessage}
          />

          <View className="px-4 py-3 border-t border-zinc-900 bg-black">
            <View className="flex-row items-end space-x-2">
              <View className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 min-h-[50px] justify-center">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Send instruction..."
                  placeholderTextColor="#71717a"
                  multiline
                  className="text-white text-base max-h-32"
                  style={{ padding: 0 }}
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!draft.trim() || sending}
                className={`p-3 rounded-full mb-[1px] ${draft.trim() ? 'bg-blue-600' : 'bg-zinc-800'}`}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Send size={20} color={draft.trim() ? 'white' : '#71717a'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
