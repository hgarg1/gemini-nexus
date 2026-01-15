import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Palette, X, Type, Layers } from 'lucide-react-native';

interface AppearanceModalProps {
  visible: boolean;
  onClose: () => void;
  initialSettings?: any;
  onSave: (settings: any) => void;
}

const DEFAULT_SETTINGS = {
  theme: 'cyber',
  bubbleColor: '#00f2ff',
  fontFamily: 'mono',
  density: 'comfortable',
};

export function AppearanceModal({
  visible,
  onClose,
  initialSettings,
  onSave,
}: AppearanceModalProps) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (initialSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...initialSettings });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [initialSettings, visible]);

  const themes = [
    { id: 'cyber', label: 'CYBERPUNK', color: '#00f2ff' },
    { id: 'minimal', label: 'MINIMAL', color: '#ffffff' },
    { id: 'organic', label: 'ORGANIC', color: '#10b981' },
    { id: 'void', label: 'VOID', color: '#a855f7' },
  ];

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
        <View className="h-[80%] bg-black border border-zinc-800 rounded-t-[32px] overflow-hidden">
          <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
            <View className="flex-row items-center space-x-2">
              <Palette size={20} color="#60a5fa" />
              <Text className="text-white text-xl font-bold">Interface Style</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 py-4">
            <View className="mb-6">
              <View className="flex-row items-center space-x-2 mb-3">
                <Layers size={16} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Theme</Text>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {themes.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setSettings((prev) => ({ ...prev, theme: theme.id }))}
                    className={`px-4 py-3 rounded-2xl border ${
                      settings.theme === theme.id
                        ? 'bg-blue-600/20 border-blue-500/50'
                        : 'bg-zinc-900/60 border-zinc-800'
                    }`}
                  >
                    <View className="flex-row items-center space-x-2">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.color }}
                      />
                      <Text className="text-white text-xs font-bold">{theme.label}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center space-x-2 mb-3">
                <Palette size={16} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Accent Color</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <View
                  className="w-10 h-10 rounded-xl border border-zinc-800"
                  style={{ backgroundColor: settings.bubbleColor }}
                />
                <TextInput
                  value={settings.bubbleColor}
                  onChangeText={(value) => setSettings((prev) => ({ ...prev, bubbleColor: value }))}
                  placeholder="#00f2ff"
                  placeholderTextColor="#52525b"
                  className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-white"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center space-x-2 mb-3">
                <Type size={16} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Typography</Text>
              </View>
              <View className="flex-row gap-2">
                {['mono', 'sans', 'serif'].map((font) => (
                  <TouchableOpacity
                    key={font}
                    onPress={() => setSettings((prev) => ({ ...prev, fontFamily: font }))}
                    className={`flex-1 py-3 rounded-2xl ${
                      settings.fontFamily === font ? 'bg-blue-600' : 'bg-zinc-900/60'
                    }`}
                  >
                    <Text className="text-center text-white text-xs font-bold uppercase">{font}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <View className="flex-row items-center space-x-2 mb-3">
                <Layers size={16} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Density</Text>
              </View>
              <View className="flex-row gap-2">
                {['compact', 'comfortable'].map((density) => (
                  <TouchableOpacity
                    key={density}
                    onPress={() => setSettings((prev) => ({ ...prev, density }))}
                    className={`flex-1 py-3 rounded-2xl ${
                      settings.density === density ? 'bg-purple-600' : 'bg-zinc-900/60'
                    }`}
                  >
                    <Text className="text-center text-white text-xs font-bold uppercase">{density}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View className="p-6 border-t border-zinc-900">
            <TouchableOpacity
              onPress={handleSave}
              className="w-full bg-white rounded-2xl p-4 items-center"
            >
              <Text className="text-black font-bold">Apply Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
