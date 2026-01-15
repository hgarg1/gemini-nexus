import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Background Ambience */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-emerald-600/20 blur-[100px]" />
        <View className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pb-20 pt-12">
            
            <Link href="../" asChild>
              <MotiView 
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                className="mb-8"
              >
                <View className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center border border-zinc-800">
                  <ArrowLeft size={20} color="white" />
                </View>
              </MotiView>
            </Link>

            {/* Header */}
            <MotiView 
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 100 }}
              className="mb-10"
            >
              <Text className="text-4xl font-bold text-white mb-2">Create Account</Text>
              <Text className="text-zinc-400 text-lg">Join the future of AI communication</Text>
            </MotiView>

            {/* Form */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              className="space-y-4"
            >
              <Input 
                placeholder="John Doe" 
                label="Full Name"
                icon={<User size={20} color="#a1a1aa" />}
              />
              <Input 
                placeholder="name@example.com" 
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={20} color="#a1a1aa" />}
              />
              <Input 
                placeholder="••••••••" 
                label="Password"
                secureTextEntry
                icon={<Lock size={20} color="#a1a1aa" />}
              />
              <Input 
                placeholder="••••••••" 
                label="Confirm Password"
                secureTextEntry
                icon={<Lock size={20} color="#a1a1aa" />}
              />
              
              <View className="pt-4">
                <Button 
                  label="Create Account" 
                  onPress={handleRegister}
                  isLoading={isLoading}
                />
              </View>

              <View className="flex-row justify-center mt-8 space-x-2">
                <Text className="text-zinc-400">Already have an account?</Text>
                <Link href="/(auth)/login" asChild>
                  <Text className="text-blue-400 font-bold">Sign In</Text>
                </Link>
              </View>
            </MotiView>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
