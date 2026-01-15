import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Key, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
    }, 1400);
  };

  if (!token) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <StatusBar style="light" />
        <View className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 w-full max-w-md items-center">
          <AlertTriangle size={32} color="#f97316" />
          <Text className="text-white text-xl font-bold mt-4 text-center">Invalid Reset Token</Text>
          <Text className="text-zinc-500 text-center mt-3 text-sm">
            The reset link is missing or expired. Request a new link to continue.
          </Text>
          <Button label="Return to Login" className="mt-6" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-15%] right-[-25%] w-[520px] h-[520px] rounded-full bg-blue-600/20 blur-[120px]" />
        <View className="absolute bottom-[-20%] left-[-10%] w-[520px] h-[520px] rounded-full bg-emerald-600/20 blur-[120px]" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center pb-16 pt-10">
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="items-center mb-10"
            >
              <View className="w-16 h-16 rounded-3xl items-center justify-center mb-6">
                <LinearGradient
                  colors={['#22c55e', '#3b82f6']}
                  className="w-full h-full rounded-3xl items-center justify-center"
                >
                  {status === 'success' ? (
                    <CheckCircle2 size={30} color="white" />
                  ) : (
                    <Key size={30} color="white" />
                  )}
                </LinearGradient>
              </View>
              <Text className="text-3xl font-bold text-white text-center mb-2">Reset Access Key</Text>
              <Text className="text-zinc-400 text-center text-base">
                {status === 'success' ? 'Access key updated.' : 'Create a new secure credential.'}
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
                    Your credentials have been updated. Return to the access gateway to continue.
                  </Text>
                </View>
                <Button label="Return to Login" onPress={() => router.replace('/(auth)/login')} />
              </MotiView>
            ) : (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200 }}
                className="space-y-5"
              >
                <Input
                  placeholder="Enter new access key"
                  label="New Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  error={error}
                />
                <Input
                  placeholder="Confirm access key"
                  label="Confirm Password"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                  error={error}
                />
                <Button label="Update Credentials" onPress={handleSubmit} isLoading={status === 'loading'} />
                <Button
                  label="Back to Login"
                  variant="ghost"
                  onPress={() => router.replace('/(auth)/login')}
                />
              </MotiView>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
