import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Image as ImageIcon, X } from 'lucide-react-native';

interface AssetsModalProps {
  visible: boolean;
  onClose: () => void;
  assets: { url: string; role?: string }[];
}

export function AssetsModal({ visible, onClose, assets }: AssetsModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const grouped = useMemo(() => assets.filter((asset) => asset.url), [assets]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
        <View className="h-[80%] bg-black border border-zinc-800 rounded-t-[32px] overflow-hidden">
          <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
            <View className="flex-row items-center space-x-2">
              <ImageIcon size={20} color="#60a5fa" />
              <Text className="text-white text-xl font-bold">Assets</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-4">
            {grouped.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-zinc-500 text-sm">No assets captured</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {grouped.map((asset, index) => (
                  <TouchableOpacity
                    key={`${asset.url}-${index}`}
                    className="w-[48%] mb-4"
                    onPress={() => setSelected(asset.url)}
                  >
                    <Image source={{ uri: asset.url }} className="w-full h-32 rounded-2xl border border-zinc-800" />
                    <Text className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest">
                      {asset.role || 'asset'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 bg-black items-center justify-center">
          {selected && (
            <Image source={{ uri: selected }} className="w-full h-full" resizeMode="contain" />
          )}
          <TouchableOpacity
            onPress={() => setSelected(null)}
            className="absolute top-10 right-6 p-3 bg-black/60 rounded-full"
          >
            <X size={22} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </Modal>
  );
}
