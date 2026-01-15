import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Avatar } from '../../components/ui/Avatar';
import { Settings, LogOut, ChevronRight, User, Bell, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView className="px-6 pt-4">
          <Text className="text-3xl font-bold text-white mb-8">Profile</Text>
          
          <View className="items-center mb-8">
            <Avatar fallback="JD" size="xl" className="mb-4 border-4 border-zinc-900" />
            <Text className="text-xl font-bold text-white">John Doe</Text>
            <Text className="text-zinc-400">john@example.com</Text>
          </View>

          <View className="bg-zinc-900/50 rounded-2xl overflow-hidden mb-6">
            <MenuItem icon={<User size={20} color="white" />} label="Account" />
            <MenuItem icon={<Bell size={20} color="white" />} label="Notifications" />
            <MenuItem icon={<Shield size={20} color="white" />} label="Privacy & Security" border={false} />
          </View>

          <View className="bg-zinc-900/50 rounded-2xl overflow-hidden mb-8">
            <MenuItem icon={<Settings size={20} color="white" />} label="App Settings" border={false} />
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center space-x-2 py-4 bg-red-500/10 rounded-2xl border border-red-500/20"
            onPress={() => router.replace('/(auth)/login')}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold">Sign Out</Text>
          </TouchableOpacity>
          
          <View className="h-24" /> 
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MenuItem({ icon, label, border = true }: { icon: any, label: string, border?: boolean }) {
  return (
    <TouchableOpacity className={`flex-row items-center p-4 ${border ? 'border-b border-zinc-800' : ''}`}>
      <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
        {icon}
      </View>
      <Text className="text-white text-base font-medium flex-1">{label}</Text>
      <ChevronRight size={20} color="#52525b" />
    </TouchableOpacity>
  );
}
