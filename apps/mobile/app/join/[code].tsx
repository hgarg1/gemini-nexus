import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Building2, ShieldCheck, AlertCircle, Sparkles, MessageSquare } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

type JoinState = 'loading' | 'error' | 'ready' | 'pending' | 'success';

export default function JoinScreen() {
  const { code } = useLocalSearchParams();
  const router = useRouter();
  const [state, setState] = useState<JoinState>('loading');
  const [error, setError] = useState('');
  const [org, setOrg] = useState<any>(null);
  const [chat, setChat] = useState<any>(null);
  const [joinType, setJoinType] = useState<'org' | 'chat'>('org');
  const [requiresApproval, setRequiresApproval] = useState<boolean | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!code || typeof code !== 'string') {
        setError('Invalid invitation code.');
        setState('error');
        return;
      }

      try {
        const data = await api.join.get(code);
        setOrg(data.organization);
        setChat(null);
        setJoinType('org');
        setRequiresApproval(data.requiresApproval ?? null);
        setState('ready');
      } catch (err: any) {
        try {
          const chatData = await api.chatJoin.get(code);
          setChat(chatData.chat);
          setOrg(null);
          setJoinType('chat');
          setRequiresApproval(null);
          setState('ready');
        } catch (chatErr: any) {
          setError(chatErr?.message || err?.message || 'Link verification failed.');
          setState('error');
        }
      }
    };

    validate();
  }, [code]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.auth.me();
        setIsAuthed(!!data.user);
      } catch {
        setIsAuthed(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (state === 'ready' && isAuthed && !autoJoined) {
      setAutoJoined(true);
      handleJoin();
    }
  }, [state, isAuthed, autoJoined]);

  const handleJoin = async () => {
    if (isJoining || !code || typeof code !== 'string') return;
    setIsJoining(true);
    try {
      const data = joinType === 'chat' ? await api.chatJoin.submit(code) : await api.join.submit(code);
      if (joinType === 'chat') {
        setState('success');
        if (data.chatId) {
          setTimeout(() => {
            router.replace(`/chat/${data.chatId}`);
          }, 800);
        }
      } else if (data.status === 'PENDING_APPROVAL') {
        setState('pending');
      } else {
        setState('success');
      }
    } catch (err: any) {
      const message = err?.message || 'Join failed.';
      if (message.toLowerCase().includes('authentication')) {
        setIsAuthed(false);
      }
      setError(message);
      setState('error');
    } finally {
      setIsJoining(false);
    }
  };

  const displayName = joinType === 'chat' ? chat?.title || 'Chat' : org?.name || 'Organization';

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <StatusBar style="light" />

      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-[-25%] left-[-20%] w-[540px] h-[540px] rounded-full bg-blue-600/20 blur-[130px]" />
        <View className="absolute bottom-[-25%] right-[-15%] w-[520px] h-[520px] rounded-full bg-cyan-600/20 blur-[130px]" />
      </View>

      {state === 'loading' && (
        <View className="items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-zinc-500 text-xs font-semibold tracking-widest mt-4">
            SYNCHRONIZING LINK
          </Text>
        </View>
      )}

      {state === 'error' && (
        <View className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 items-center">
          <AlertCircle size={40} color="#ef4444" />
          <Text className="text-white text-xl font-bold mt-4 text-center">Link Corrupted</Text>
          <Text className="text-zinc-500 text-sm mt-3 text-center">{error}</Text>
          <Button label="Return to Login" className="mt-6" onPress={() => router.replace('/(auth)/login')} />
        </View>
      )}

      {state === 'ready' && (
        <View className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8">
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#0ea5e9', '#22d3ee']}
                className="w-20 h-20 rounded-3xl items-center justify-center"
              >
                {joinType === 'chat' ? <MessageSquare size={36} color="white" /> : <Building2 size={36} color="white" />}
              </LinearGradient>
              <Text className="text-white text-2xl font-bold mt-4 text-center">
                {displayName}
              </Text>
              <Text className="text-zinc-500 text-sm mt-2 text-center">
                {joinType === 'chat' ? 'Secure link to join this chat stream.' : 'Secure invitation to join this sector.'}
              </Text>
            </View>

            {isAuthed ? (
              <View className="space-y-4">
                <Button
                  label={isJoining ? 'Finalizing...' : joinType === 'chat' ? 'Join Chat' : 'Finalize Onboarding'}
                  onPress={handleJoin}
                  isLoading={isJoining}
                />
                {joinType === 'org' ? (
                  <View className="flex-row items-center justify-center">
                    <ShieldCheck size={14} color={requiresApproval ? '#60a5fa' : '#22c55e'} />
                    <Text className="text-zinc-500 text-xs font-semibold ml-2">
                      {requiresApproval ? 'Approval required' : 'Auto-join enabled'}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="space-y-3">
                <Button label="Link Existing Account" onPress={() => router.push('/(auth)/login')} />
                <Button label="Create New Account" variant="outline" onPress={() => router.push('/(auth)/register')} />
              </View>
            )}
          </MotiView>
        </View>
      )}

      {state === 'pending' && (
        <View className="w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 items-center">
          <ShieldCheck size={42} color="#60a5fa" />
          <Text className="text-white text-xl font-bold mt-4">Uplink Pending</Text>
          <Text className="text-zinc-500 text-sm mt-3 text-center">
            Your request awaits sector approval. You will be notified once access is granted.
          </Text>
          <Button label="Check System Status" className="mt-6" onPress={() => router.replace('/(tabs)')} />
        </View>
      )}

      {state === 'success' && (
        <View className="w-full max-w-md bg-zinc-900/70 border border-green-500/30 rounded-3xl p-8 items-center">
          <Sparkles size={42} color="#22c55e" />
          <Text className="text-white text-xl font-bold mt-4">Uplink Established</Text>
          <Text className="text-zinc-500 text-sm mt-3 text-center">
            {joinType === 'chat'
              ? `Handshake complete. Chat access granted to ${displayName}.`
              : `Handshake complete. Welcome to ${displayName}.`}
          </Text>
          <Button
            label={joinType === 'chat' ? 'Enter Chat' : 'Enter the Nexus'}
            className="mt-6"
            onPress={() =>
              joinType === 'chat' && chat?.id ? router.replace(`/chat/${chat.id}`) : router.replace('/(tabs)')
            }
          />
        </View>
      )}
    </View>
  );
}
