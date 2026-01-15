import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, Send, Paperclip, Bot, User, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState, useRef, useEffect } from 'react';
import { MotiView } from 'moti';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]); // Base64 strings
  const flatListRef = useRef<FlatList>(null);
  const chatId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!chatId) return;

    const loadChat = async () => {
      try {
        const data = await api.chat.get(chatId);
        if (data.chat) {
          const formatted = (data.chat.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(formatted);
        }
      } catch (error) {
        console.error("Failed to load chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();

    const socket = getSocket();
    socket.emit('join-chat', chatId);
    
    api.auth.me().then(data => {
        if (data.user?.id) {
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
            }];
        });
      }
    });

    socket.on('message-updated', (msg: any) => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content } : m));
    });

    return () => {
      socket.off('message-received');
      socket.off('message-updated');
    };
  }, [chatId]);

  const pickImage = async () => {
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
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    setAttachments([]);
    setIsSending(true);

    try {
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const res = await api.chat.transmit({
            prompt: promptValue,
            chatId,
            history,
            images: currentAttachments, // Send base64 images
            config: {
                modelName: "models/gemini-2.0-flash", 
            }
        });
        
        if (res.userMessage) {
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m,
                id: res.userMessage.id,
                time: new Date(res.userMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            } : m));
        }

    } catch (error) {
        console.error("Failed to send:", error);
        Alert.alert("Error", "Failed to send message");
    } finally {
        setIsSending(false);
    }
  };

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
            <View className="flex-row items-center">
              <Avatar fallback="G" size="sm" className="bg-blue-600 mr-3" />
              <View>
                <Text className="text-white font-bold text-base">Gemini Pro</Text>
                <Text className="text-zinc-500 text-xs">Always active</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity className="p-2 -mr-2 rounded-full active:bg-zinc-900">
            <MoreVertical size={24} color="white" />
          </TouchableOpacity>
        </View>

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
                renderItem={({ item }) => (
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
                    </View>

                    {item.role === 'user' && (
                    <View className="ml-2 mt-auto">
                        <Avatar fallback="Me" size="sm" className="w-8 h-8" />
                    </View>
                    )}
                </MotiView>
                )}
            />
          )}

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
                className="p-3 bg-zinc-900 rounded-full mb-[1px]"
              >
                <Paperclip size={20} color="#a1a1aa" />
              </TouchableOpacity>
              
              <View className="flex-1 bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 focus:border-blue-500/50 min-h-[50px] justify-center">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
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
      </SafeAreaView>
    </View>
  );
}
