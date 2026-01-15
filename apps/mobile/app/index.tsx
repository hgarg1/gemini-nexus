import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Shield, Cpu, GitBranch } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

export default function LandingScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.auth.me();
        setIsAuthed(!!data.user);
      } catch {
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-30%] left-[-20%] w-[620px] h-[620px] rounded-full bg-cyan-600/20 blur-[140px]" />
        <View className="absolute bottom-[-25%] right-[-15%] w-[620px] h-[620px] rounded-full bg-blue-600/20 blur-[140px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-16 pb-10">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
          >
            <LinearGradient
              colors={['#0ea5e9', '#22d3ee']}
              className="w-16 h-16 rounded-3xl items-center justify-center mb-6"
            >
              <Cpu size={30} color="white" />
            </LinearGradient>
            <Text className="text-white text-4xl font-bold tracking-tight">Nexus Intelligence</Text>
            <Text className="text-zinc-400 mt-4 text-base leading-6">
              Advanced neural interface for collaborative intelligence. Merge human intent with machine precision.
            </Text>
          </MotiView>

          <View className="mt-10 space-y-3">
            {isChecking ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : isAuthed ? (
              <Button
                label="Enter the Nexus"
                onPress={() => router.replace('/(tabs)')}
                icon={<ArrowRight size={18} color="white" />}
              />
            ) : (
              <>
                <Button
                  label="Initialize Stream"
                  onPress={() => router.push('/(auth)/login')}
                  icon={<ArrowRight size={18} color="white" />}
                />
                <Button
                  label="Register Entity"
                  variant="outline"
                  onPress={() => router.push('/(auth)/register')}
                />
              </>
            )}
          </View>

          <View className="mt-12 space-y-4">
            <View className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex-row items-center space-x-3">
              <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
                <GitBranch size={20} color="#60a5fa" />
              </View>
              <View>
                <Text className="text-white font-semibold">Version Control</Text>
                <Text className="text-zinc-500 text-xs">Branch, merge, and checkpoint neural streams.</Text>
              </View>
            </View>
            <View className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex-row items-center space-x-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center">
                <Shield size={20} color="#34d399" />
              </View>
              <View>
                <Text className="text-white font-semibold">Enterprise Guard</Text>
                <Text className="text-zinc-500 text-xs">AES-256 encryption with secured access.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
