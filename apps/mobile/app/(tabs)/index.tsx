import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { Search, Plus, Zap } from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { useRouter } from 'expo-router';

const DUMMY_CHATS = [
  { id: '1', name: 'Gemini Pro', message: 'I can help you analyze that code.', time: '2m', avatar: null, unread: 2 },
  { id: '2', name: 'Sarah Connor', message: 'The deployment is ready.', time: '1h', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', unread: 0 },
  { id: '3', name: 'Team Alpha', message: 'Alex: Just merged the PR.', time: '3h', avatar: null, unread: 0 },
  { id: '4', name: 'Marketing Bot', message: 'New campaign stats are in.', time: '1d', avatar: null, unread: 5 },
  { id: '5', name: 'Design Team', message: 'Can we review the Figma?', time: '2d', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', unread: 0 },
];

export default function ChatListScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <View>
            <Text className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Workspace</Text>
            <Text className="text-3xl font-bold text-white">Chats</Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700"
            onPress={() => {}}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-6 mb-6">
          <Input 
            placeholder="Search messages..." 
            icon={<Search size={20} color="#a1a1aa" />}
            className="bg-zinc-900 border-zinc-800"
          />
        </View>

        {/* Stories / Quick Access (Optional fancy touch) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6 mb-8 max-h-24">
          <View className="mr-6 items-center space-y-2">
            <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center border-2 border-blue-400 border-dashed">
              <Zap size={28} color="white" fill="white" />
            </View>
            <Text className="text-white text-xs font-medium">New</Text>
          </View>
          {DUMMY_CHATS.map((chat) => (
            <TouchableOpacity key={chat.id} className="mr-6 items-center space-y-2">
              <Avatar 
                uri={chat.avatar || undefined} 
                fallback={chat.name[0]} 
                size="lg" 
                className="border-2 border-zinc-800"
              />
              <Text className="text-zinc-400 text-xs font-medium w-16 text-center" numberOfLines={1}>{chat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat List */}
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="px-6">
          <Text className="text-white font-bold text-lg mb-4">Recent</Text>
          {DUMMY_CHATS.map((chat, index) => (
            <MotiView
              key={chat.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 100 }}
            >
              <TouchableOpacity 
                className="flex-row items-center py-4 border-b border-zinc-900/50 active:bg-zinc-900/30 -mx-2 px-2 rounded-xl"
                onPress={() => router.push(`/chat/${chat.id}`)}
              >
                <Avatar uri={chat.avatar || undefined} fallback={chat.name[0]} size="lg" />
                
                <View className="flex-1 ml-4">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-white font-bold text-base">{chat.name}</Text>
                    <Text className="text-zinc-500 text-xs">{chat.time}</Text>
                  </View>
                  <Text className="text-zinc-400 text-sm" numberOfLines={1}>
                    {chat.message}
                  </Text>
                </View>

                {chat.unread > 0 && (
                  <View className="ml-2 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">{chat.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}
