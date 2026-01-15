import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Background Ambience */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
        <View className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px]" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center pb-20 pt-10">
            
            {/* Header */}
            <MotiView 
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 1000, delay: 100 }}
              className="items-center mb-12"
            >
              <View className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
                <LinearGradient
                  colors={['#3b82f6', '#a855f7']}
                  className="w-full h-full rounded-3xl items-center justify-center"
                >
                  <Zap size={32} color="white" fill="white" />
                </LinearGradient>
              </View>
              <Text className="text-4xl font-bold text-white text-center mb-2">Welcome Back</Text>
              <Text className="text-zinc-400 text-center text-lg">Sign in to continue your journey</Text>
            </MotiView>

            {/* Form */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 1000, delay: 300 }}
              className="space-y-4"
            >
              <Input 
                placeholder="name@example.com" 
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={20} color="#a1a1aa" />}
                value={email}
                onChangeText={setEmail}
              />
              <Input 
                placeholder="Enter password" 
                label="Password"
                secureTextEntry
                icon={<Lock size={20} color="#a1a1aa" />}
                value={password}
                onChangeText={setPassword}
              />
              
              <View className="items-end mb-4">
                <Link href="/(auth)/forgot-password" asChild>
                  <Text className="text-blue-400 font-medium">Forgot Password?</Text>
                </Link>
              </View>

              <Button 
                label="Sign In" 
                onPress={handleLogin}
                isLoading={isLoading}
              />

              <View className="flex-row justify-center mt-8 space-x-2">
                <Text className="text-zinc-400">Don't have an account?</Text>
                <Link href="/(auth)/register" asChild>
                  <Text className="text-blue-400 font-bold">Sign Up</Text>
                </Link>
              </View>
            </MotiView>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
