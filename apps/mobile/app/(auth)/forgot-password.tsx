import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }

    setError('');
    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
    }, 1200);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <View className="absolute bottom-[-25%] right-[-20%] w-[520px] h-[520px] rounded-full bg-blue-600/20 blur-[120px]" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center pb-16 pt-10">
            <Link href="/(auth)/login" asChild>
              <MotiView
                from={{ opacity: 0, translateX: -16 }}
                animate={{ opacity: 1, translateX: 0 }}
                className="mb-10"
              >
                <View className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center border border-zinc-800">
                  <ArrowLeft size={20} color="white" />
                </View>
              </MotiView>
            </Link>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 100 }}
              className="items-center mb-10"
            >
              <View className="w-16 h-16 rounded-3xl items-center justify-center mb-6">
                <LinearGradient
                  colors={['#db2777', '#2563eb']}
                  className="w-full h-full rounded-3xl items-center justify-center"
                >
                  {status === 'success' ? (
                    <CheckCircle2 size={30} color="white" />
                  ) : (
                    <ShieldAlert size={30} color="white" />
                  )}
                </LinearGradient>
              </View>
              <Text className="text-3xl font-bold text-white text-center mb-2">Recover Access</Text>
              <Text className="text-zinc-400 text-center text-base">
                {status === 'success'
                  ? 'Reset link transmitted to your inbox.'
                  : 'Send a secure reset link to your registered email.'}
              </Text>
            </MotiView>

            {status === 'success' ? (
              <MotiView
                from={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <View className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                  <Text className="text-white text-sm font-semibold text-center">
                    Check your inbox and follow the link to reset your access key.
                  </Text>
                </View>
                <Link href="/(auth)/login" asChild>
                  <Button label="Return to Login" />
                </Link>
              </MotiView>
            ) : (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200 }}
                className="space-y-5"
              >
                <Input
                  placeholder="identity@nexus.sh"
                  label="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Mail size={20} color="#a1a1aa" />}
                  value={email}
                  onChangeText={setEmail}
                  error={error}
                />

                <Button
                  label="Transmit Reset Link"
                  onPress={handleSubmit}
                  isLoading={status === 'loading'}
                />

                <Link href="/(auth)/login" asChild>
                  <Text className="text-center text-zinc-500 text-xs font-semibold tracking-widest">
                    BACK TO ACCESS GATEWAY
                  </Text>
                </Link>
              </MotiView>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
