import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, MoreHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io } from "socket.io-client";
import { API_BASE, getAuthHeaders } from '../../lib/api';

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([
    { id: '1', role: 'model', content: 'Nexus Mobile uplink established. Neural core active.' }
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [status, setStatus] = useState("CONNECTING");
  const flatListRef = useRef<FlatList>(null);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ title: "Mobile Uplink", config: {} })
            });
            const data = await res.json();
            if (data.chat) {
                setChatId(data.chat.id);
                setStatus("CONNECTED");
            } else {
                setStatus("AUTH_FAILED");
            }
        } catch (e) {
            setStatus("OFFLINE");
        }
    };
    initChat();
  }, []);

  // Socket Connection
  useEffect(() => {
    if (!chatId) return;
    
    const socket = io(API_BASE);
    socket.on("connect", () => console.log("Socket connected"));
    
    socket.emit('join-chat', chatId);
    
    socket.on('message-received', (msg) => {
        setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
        });
    });

    return () => {
        socket.disconnect();
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;
    
    const tempId = Date.now().toString();
    const userMsg = { id: tempId, role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
        const headers = await getAuthHeaders();
        await fetch(`${API_BASE}/api/chat/transmit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                prompt: currentInput,
                chatId,
                history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
            })
        });
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Transmission failed. Signal lost.' }]);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).springify()} 
      layout={Layout.springify()}
      className={`mb-6 max-w-[85%] ${item.role === 'user' ? 'self-end' : 'self-start'}`}
    >
      <BlurView
        intensity={item.role === 'user' ? 0 : 20}
        tint="dark"
        className={`p-4 rounded-2xl border ${item.role === 'user' ? 'bg-white/10 border-white/20 rounded-br-sm' : 'bg-black/40 border-primary/20 rounded-bl-sm'}`}
      >
        <Text className="text-[10px] font-bold text-white/30 mb-1 tracking-widest uppercase">
          {item.role === 'user' ? 'OPERATOR' : 'NEXUS_CORE'}
        </Text>
        <Text className={`text-base leading-6 ${item.role === 'user' ? 'text-white' : 'text-primary/90'}`}>
          {item.content}
        </Text>
      </BlurView>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
       <LinearGradient
        colors={["#00f2ff05", "transparent"]}
        style={{ position: "absolute", top: 0, width: "100%", height: 200 }}
      />
      
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-white/5">
            <View>
                <Text className="text-white font-black text-xl tracking-tighter">LIVE_FEED</Text>
                <View className="flex-row items-center gap-2 mt-1">
                    <View className={`w-1.5 h-1.5 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
                    <Text className={`${status === 'CONNECTED' ? 'text-green-500' : 'text-red-500'} text-[10px] font-bold tracking-widest`}>{status}</Text>
                </View>
            </View>
            <TouchableOpacity className="p-2 bg-white/5 rounded-xl">
                <MoreHorizontal color="#fff" size={20} opacity={0.5} />
            </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          className="absolute bottom-[100px] left-0 right-0 px-4"
        >
          <BlurView intensity={50} tint="dark" className="flex-row items-center p-2 rounded-3xl border border-white/10 bg-black/60">
            <TextInput
              className="flex-1 text-white px-4 py-3 text-base"
              placeholder={status === 'CONNECTED' ? "Transmit..." : "Connecting..."}
              placeholderTextColor="#666"
              value={input}
              onChangeText={setInput}
              editable={status === 'CONNECTED'}
            />
            <TouchableOpacity 
              onPress={handleSend}
              className={`w-10 h-10 rounded-full items-center justify-center ${input.trim() ? 'bg-primary shadow-[0_0_10px_#00f2ff]' : 'bg-white/10'}`}
            >
              <Send color={input.trim() ? '#000' : '#666'} size={18} />
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}