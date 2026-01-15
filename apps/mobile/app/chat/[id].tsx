import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, Send, Paperclip, Bot, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState, useRef } from 'react';
import { MotiView } from 'moti';
import { Avatar } from '../../components/ui/Avatar';

const DUMMY_MESSAGES = [
  { id: '1', role: 'model', content: 'Hello! I am Gemini. How can I assist you today?', time: '10:00 AM' },
  { id: '2', role: 'user', content: 'I need help debugging a React Native app.', time: '10:01 AM' },
  { id: '3', role: 'model', content: 'I can certainly help with that. What specific issue are you facing? Is it related to layout, performance, or a specific library?', time: '10:01 AM' },
  { id: '4', role: 'user', content: 'It is a layout issue with KeyboardAvoidingView.', time: '10:02 AM' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: "That's a common tricky one! On iOS, you usually want behavior='padding', while on Android, sometimes 'height' or no behavior works best depending on your manifest settings.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
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

        {/* Messages */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          className="flex-1"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item, index }) => (
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
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    item.role === 'user' 
                      ? 'bg-blue-600 rounded-tr-sm' 
                      : 'bg-zinc-800 rounded-tl-sm'
                  }`}
                >
                  <Text className={`text-base leading-6 ${item.role === 'user' ? 'text-white' : 'text-zinc-100'}`}>
                    {item.content}
                  </Text>
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

          {/* Input Area */}
          <View className="px-4 py-3 border-t border-zinc-900 bg-black">
            <View className="flex-row items-end space-x-2">
              <TouchableOpacity className="p-3 bg-zinc-900 rounded-full mb-[1px]">
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
                disabled={!message.trim()}
                className={`p-3 rounded-full mb-[1px] ${message.trim() ? 'bg-blue-600' : 'bg-zinc-800'}`}
              >
                <Send size={20} color={message.trim() ? 'white' : '#71717a'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
