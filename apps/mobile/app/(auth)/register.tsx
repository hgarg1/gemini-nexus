import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, User, ArrowLeft, Check } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';

const defaultPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const buildRequirements = (policy: typeof defaultPolicy, value: string) => [
  { label: `${policy.minLength}+ Characters`, valid: value.length >= policy.minLength },
  { label: 'Uppercase', valid: !policy.requireUppercase || /[A-Z]/.test(value) },
  { label: 'Lowercase', valid: !policy.requireLowercase || /[a-z]/.test(value) },
  { label: 'Number', valid: !policy.requireNumber || /[0-9]/.test(value) },
  { label: 'Special', valid: !policy.requireSpecial || /[^A-Za-z0-9]/.test(value) },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [policy, setPolicy] = useState(defaultPolicy);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const data = await api.auth.passwordPolicy();
        if (data.policy) setPolicy({ ...defaultPolicy, ...data.policy });
      } catch {
        // Use default policy on failure
      }
    };
    loadPolicy();
  }, []);

  const requirements = useMemo(() => buildRequirements(policy, form.password), [policy, form.password]);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Valid email required';
    if (form.password.length < policy.minLength) {
      nextErrors.password = `Minimum ${policy.minLength} characters`;
    } else if (policy.requireUppercase && !/[A-Z]/.test(form.password)) {
      nextErrors.password = 'Requires uppercase';
    } else if (policy.requireLowercase && !/[a-z]/.test(form.password)) {
      nextErrors.password = 'Requires lowercase';
    } else if (policy.requireNumber && !/[0-9]/.test(form.password)) {
      nextErrors.password = 'Requires number';
    } else if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(form.password)) {
      nextErrors.password = 'Requires special';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setServerError('');
    try {
      await api.auth.register(form.name.trim(), form.email.trim(), form.password);
      router.replace('/(auth)/login');
    } catch (error: any) {
      setServerError(error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
                value={form.name}
                onChangeText={(value) => setForm(prev => ({ ...prev, name: value }))}
                error={errors.name}
              />
              <Input 
                placeholder="name@example.com" 
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={20} color="#a1a1aa" />}
                value={form.email}
                onChangeText={(value) => setForm(prev => ({ ...prev, email: value }))}
                error={errors.email}
              />
              <Input 
                placeholder="Enter password" 
                label="Password"
                secureTextEntry
                icon={<Lock size={20} color="#a1a1aa" />}
                value={form.password}
                onChangeText={(value) => setForm(prev => ({ ...prev, password: value }))}
                error={errors.password}
              />
              <View className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                <Text className="text-zinc-400 text-xs font-bold tracking-wider mb-3">PASSWORD REQUIREMENTS</Text>
                <View className="flex-row flex-wrap">
                  {requirements.map((req) => (
                    <View key={req.label} className="flex-row items-center w-1/2 mb-2">
                      <View
                        className={`w-4 h-4 rounded-full items-center justify-center mr-2 ${
                          req.valid ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-zinc-800 border border-zinc-700'
                        }`}
                      >
                        {req.valid && <Check size={10} color="#34d399" />}
                      </View>
                      <Text className={`text-[10px] font-bold ${req.valid ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {serverError ? (
                <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3">
                  <Text className="text-red-400 text-xs font-bold text-center">{serverError}</Text>
                </View>
              ) : null}

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
