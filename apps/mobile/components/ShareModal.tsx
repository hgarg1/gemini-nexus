import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Share2, X, Link2 } from 'lucide-react-native';
import { api, API_BASE_URL } from '../lib/api';

interface ShareModalProps {
  visible: boolean;
  chatId: string;
  onClose: () => void;
}

export function ShareModal({ visible, chatId, onClose }: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/api$/, ''), []);
  const shareUrl = useMemo(() => `${baseUrl}/chat/${chatId}`, [baseUrl, chatId]);

  useEffect(() => {
    if (!visible || !chatId) return;
    setLoading(true);
    api.chat
      .public(chatId)
      .catch(() => {
        // Ignore for now
      })
      .finally(() => setLoading(false));
  }, [visible, chatId]);

  const handleShare = async () => {
    try {
      await Share.share({ message: shareUrl });
    } catch (e) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
        <View className="h-[60%] bg-black border border-zinc-800 rounded-t-[32px] overflow-hidden">
          <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
            <View className="flex-row items-center space-x-2">
              <Share2 size={20} color="#60a5fa" />
              <Text className="text-white text-xl font-bold">Share Chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 py-8 justify-between">
            <View>
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Public Link</Text>
              <View className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between">
                {loading ? (
                  <ActivityIndicator size="small" color="#60a5fa" />
                ) : (
                  <Text selectable className="text-blue-400 text-xs font-mono flex-1 mr-2">
                    {shareUrl}
                  </Text>
                )}
                <Link2 size={16} color="#60a5fa" />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleShare}
              disabled={loading}
              className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2"
            >
              <Share2 size={18} color="black" />
              <Text className="text-black font-bold">{loading ? 'Preparing...' : 'Share Link'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
