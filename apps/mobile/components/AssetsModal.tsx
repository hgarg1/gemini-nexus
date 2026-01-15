import { View, Text, Modal, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Image as ImageIcon, X } from 'lucide-react-native';

interface AssetsModalProps {
  visible: boolean;
  onClose: () => void;
  assets: { url: string; role?: string; ratio?: string; labels?: string[] }[];
}

export function AssetsModal({ visible, onClose, assets }: AssetsModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [ratioFilter, setRatioFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [labelFilter, setLabelFilter] = useState('');

  const grouped = useMemo(() => assets.filter((asset) => asset.url), [assets]);

  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    grouped.forEach((asset) => {
      (asset.labels || []).forEach((label) => {
        if (label) set.add(label);
      });
    });
    return Array.from(set).slice(0, 12);
  }, [grouped]);

  const filtered = useMemo(() => {
    const labelTerm = labelFilter.trim().toLowerCase();
    return grouped.filter((asset) => {
      if (roleFilter !== 'all' && asset.role !== roleFilter) return false;
      const ratio = asset.ratio || 'unknown';
      if (ratioFilter !== 'all' && ratio !== ratioFilter) return false;
      if (labelTerm) {
        const labels = (asset.labels || []).map((label) => label.toLowerCase());
        if (!labels.some((label) => label.includes(labelTerm))) return false;
      }
      return true;
    });
  }, [grouped, roleFilter, ratioFilter, labelFilter]);

  const ratioOptions = ['all', 'square', 'landscape', 'portrait', 'unknown'];
  const roleOptions = ['all', 'user', 'model'];

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

          <View className="px-6 py-4 border-b border-zinc-900 space-y-3">
            <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
              <TextInput
                value={labelFilter}
                onChangeText={setLabelFilter}
                placeholder="Filter by label"
                placeholderTextColor="#52525b"
                className="flex-1 text-white text-sm"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setLabelFilter('')}
                disabled={!labelFilter}
                className="ml-3"
              >
                <Text className={`text-xs font-bold ${labelFilter ? 'text-blue-400' : 'text-zinc-600'}`}>CLEAR</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-full border mr-2 ${
                    roleFilter === role ? 'bg-blue-600/20 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <Text className={`text-[10px] uppercase ${roleFilter === role ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {ratioOptions.map((ratio) => (
                <TouchableOpacity
                  key={ratio}
                  onPress={() => setRatioFilter(ratio)}
                  className={`px-3 py-1 rounded-full border mr-2 ${
                    ratioFilter === ratio ? 'bg-purple-600/20 border-purple-500/50' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <Text className={`text-[10px] uppercase ${ratioFilter === ratio ? 'text-purple-300' : 'text-zinc-500'}`}>
                    {ratio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {availableLabels.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {availableLabels.map((label) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setLabelFilter((prev) => (prev === label ? '' : label))}
                    className={`px-3 py-1 rounded-full border mr-2 ${
                      labelFilter === label ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <Text className={`text-[10px] uppercase ${labelFilter === label ? 'text-emerald-300' : 'text-zinc-500'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <ScrollView className="px-6 py-4">
            {filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-zinc-500 text-sm">No assets captured</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {filtered.map((asset, index) => (
                  <TouchableOpacity
                    key={`${asset.url}-${index}`}
                    className="w-[48%] mb-4"
                    onPress={() => setSelected(asset.url)}
                  >
                    <Image source={{ uri: asset.url }} className="w-full h-32 rounded-2xl border border-zinc-800" />
                    <Text className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest">
                      {asset.role || 'asset'}
                    </Text>
                    {asset.labels && asset.labels.length > 0 && (
                      <Text className="text-zinc-600 text-[9px] mt-1 uppercase tracking-widest" numberOfLines={1}>
                        {asset.labels.slice(0, 3).join(', ')}
                      </Text>
                    )}
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
