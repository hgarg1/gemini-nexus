import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Smartphone, Terminal } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

export default function MobileConnectScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, key] = await Promise.all([api.auth.me(), api.user.key()]);
        setUserName(me.user?.name || 'User');
        setApiKey(key.apiKey || null);
      } catch {
        router.replace('/(auth)/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleOpen = () => {
    if (!apiKey) return;
    const url = `exp://?token=${apiKey}`;
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-25%] left-[-20%] w-[540px] h-[540px] rounded-full bg-cyan-600/20 blur-[140px]" />
        <View className="absolute bottom-[-20%] right-[-15%] w-[520px] h-[520px] rounded-full bg-sky-600/20 blur-[130px]" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#22d3ee" />
      ) : (
        <View className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#22d3ee', '#38bdf8']}
                className="w-20 h-20 rounded-3xl items-center justify-center"
              >
                <Smartphone size={36} color="white" />
              </LinearGradient>
              <Text className="text-white text-2xl font-bold mt-4">Mobile Link</Text>
              <Text className="text-zinc-500 text-xs mt-2 tracking-widest uppercase">
                Secure Neural Handshake
              </Text>
            </View>

            <View className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-widest">Identity</Text>
                <Text className="text-white text-xs font-semibold">{userName}</Text>
              </View>
              <View className="h-px w-full bg-zinc-800" />
              <View className="space-y-2">
                <Text className="text-zinc-500 text-[10px] uppercase tracking-widest">Neural Key</Text>
                {apiKey ? (
                  <Text selectable className="text-cyan-300 text-xs font-mono leading-5">
                    {apiKey}
                  </Text>
                ) : (
                  <Text className="text-zinc-600 text-xs">Key unavailable</Text>
                )}
              </View>
            </View>

            <Button
              label="Auto-Configure Terminal"
              className="mt-6"
              icon={<Terminal size={18} color="white" />}
              onPress={handleOpen}
              disabled={!apiKey}
            />

            <Text className="text-zinc-500 text-[10px] text-center mt-6">
              This key grants full access to your account. Do not share it with untrusted parties.
            </Text>
          </MotiView>
        </View>
      )}
    </View>
  );
}
