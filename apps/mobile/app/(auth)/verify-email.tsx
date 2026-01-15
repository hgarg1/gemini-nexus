import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const timer = setTimeout(() => {
      setStatus('success');
    }, 1600);

    return () => clearTimeout(timer);
  }, [token]);

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-20%] left-[-20%] w-[520px] h-[520px] rounded-full bg-blue-600/20 blur-[120px]" />
        <View className="absolute bottom-[-25%] right-[-10%] w-[520px] h-[520px] rounded-full bg-purple-600/20 blur-[120px]" />
      </View>

      <View className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 items-center">
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="items-center"
        >
          <View className="w-16 h-16 rounded-3xl items-center justify-center mb-6">
            <LinearGradient
              colors={status === 'error' ? ['#f43f5e', '#f97316'] : ['#22c55e', '#3b82f6']}
              className="w-full h-full rounded-3xl items-center justify-center"
            >
              {status === 'loading' && <Loader2 size={28} color="white" />}
              {status === 'success' && <ShieldCheck size={28} color="white" />}
              {status === 'error' && <ShieldAlert size={28} color="white" />}
            </LinearGradient>
          </View>

          {status === 'loading' && (
            <>
              <Text className="text-white text-xl font-bold">Verifying Identity</Text>
              <Text className="text-zinc-500 text-sm mt-3 text-center">
                Cross-referencing your verification token.
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <Text className="text-white text-xl font-bold">Identity Confirmed</Text>
              <Text className="text-zinc-500 text-sm mt-3 text-center">
                Your account has been verified. Proceed to the access gateway.
              </Text>
              <Button label="Access Gateway" className="mt-6" onPress={() => router.replace('/(auth)/login')} />
            </>
          )}

          {status === 'error' && (
            <>
              <Text className="text-white text-xl font-bold">Verification Failed</Text>
              <Text className="text-zinc-500 text-sm mt-3 text-center">
                The verification link is invalid or expired.
              </Text>
              <Button label="Register Again" className="mt-6" onPress={() => router.replace('/(auth)/register')} />
            </>
          )}
        </MotiView>
      </View>
    </View>
  );
}
