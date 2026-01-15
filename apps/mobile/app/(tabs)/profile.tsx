import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Avatar } from '../../components/ui/Avatar';
import { Settings, LogOut, ChevronRight, User, Bell, Shield, X, Save, Edit2, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { api, removeToken } from '../../lib/api';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit State
  const [editName, setEditName] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await api.auth.me();
      if (data.user) setUser(data.user);
    } catch (e) {
      console.error(e);
      // If auth fails, redirect to login
      removeToken().then(() => router.replace('/(auth)/login'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await removeToken();
    router.replace('/(auth)/login');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`;
      updateUser({ image: base64Img });
    }
  };

  const updateUser = async (data: any) => {
    try {
        const res = await api.auth.update(data);
        if (res.user) setUser(res.user);
    } catch (e) {
        Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    await updateUser({ 
        name: editName,
        apiKey: editApiKey
    });
    setIsSaving(false);
    setIsEditModalOpen(false);
  };

  const openEditModal = () => {
    setEditName(user?.name || "");
    setEditApiKey(user?.apiKey || "");
    setIsEditModalOpen(true);
  };

  if (isLoading) {
      return (
          <View className="flex-1 bg-black items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
          </View>
      );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView className="px-6 pt-4">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-bold text-white">Profile</Text>
            <TouchableOpacity onPress={openEditModal} className="p-2 bg-zinc-900 rounded-full">
                <Edit2 size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="items-center mb-8 relative">
            <TouchableOpacity onPress={pickImage} className="relative">
                <Avatar uri={user?.image} fallback={user?.name?.[0] || "U"} size="xl" className="mb-4 border-4 border-zinc-900" />
                <View className="absolute bottom-4 right-0 bg-blue-600 rounded-full p-2 border-4 border-black">
                    <Camera size={14} color="white" />
                </View>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">{user?.name || "User"}</Text>
            <Text className="text-zinc-400">{user?.email}</Text>
          </View>

          <View className="bg-zinc-900/50 rounded-2xl overflow-hidden mb-6">
            <View className="p-4 border-b border-zinc-800 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
                        <Bell size={16} color="white" />
                    </View>
                    <Text className="text-white text-base font-medium">Notifications</Text>
                </View>
                <Switch 
                    value={user?.notificationSettings?.dmToast ?? true}
                    onValueChange={(val) => updateUser({ 
                        notificationSettings: { ...user?.notificationSettings, dmToast: val } 
                    })}
                    trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                />
            </View>
             <View className="p-4 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
                        <Shield size={16} color="white" />
                    </View>
                    <Text className="text-white text-base font-medium">Email Alerts</Text>
                </View>
                <Switch 
                    value={user?.notificationSettings?.emailNotifications ?? false}
                    onValueChange={(val) => updateUser({ 
                        notificationSettings: { ...user?.notificationSettings, emailNotifications: val } 
                    })}
                    trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
                />
            </View>
          </View>

          <View className="bg-zinc-900/50 rounded-2xl overflow-hidden mb-8">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-zinc-800" onPress={openEditModal}>
                <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
                    <Settings size={16} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="text-white text-base font-medium">Gemini API Key</Text>
                    <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                        {user?.apiKey ? "••••••••••••••••" : "Not configured"}
                    </Text>
                </View>
                <ChevronRight size={20} color="#52525b" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center space-x-2 py-4 bg-red-500/10 rounded-2xl border border-red-500/20"
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold">Sign Out</Text>
          </TouchableOpacity>
          
          <View className="h-24" /> 
        </ScrollView>

        {/* Edit Modal */}
        <Modal
            visible={isEditModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setIsEditModalOpen(false)}
        >
            <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
                <View className="bg-zinc-900 rounded-t-[32px] p-6 h-[60%] border border-zinc-800">
                    <View className="flex-row justify-between items-center mb-8">
                        <Text className="text-2xl font-bold text-white">Edit Profile</Text>
                        <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="p-2 bg-zinc-800 rounded-full">
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <View className="mb-6">
                            <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1 uppercase">Display Name</Text>
                            <TextInput 
                                value={editName}
                                onChangeText={setEditName}
                                className="bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-base"
                                placeholder="Your Name"
                                placeholderTextColor="#52525b"
                            />
                        </View>

                        <View className="mb-8">
                            <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1 uppercase">Gemini API Key</Text>
                            <TextInput 
                                value={editApiKey}
                                onChangeText={setEditApiKey}
                                className="bg-black/50 border border-zinc-800 rounded-xl p-4 text-white text-base font-mono"
                                placeholder="AIzaSy..."
                                placeholderTextColor="#52525b"
                                secureTextEntry
                            />
                            <Text className="text-zinc-600 text-[10px] mt-2 ml-1">
                                Used for your personal model requests. Stored securely.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            onPress={handleSaveEdit}
                            disabled={isSaving}
                            className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2 mb-4"
                        >
                            {isSaving ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <>
                                    <Save size={20} color="black" />
                                    <Text className="text-black font-bold tracking-wider">SAVE CHANGES</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </BlurView>
        </Modal>

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
