import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { X, Trash2, Save, Type, Shield, Cpu, Thermometer, Zap, Layers } from 'lucide-react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  config: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    customKey: string;
    modelName: string;
  };
  onUpdateConfig: (newConfig: any) => void;
  chatTitle: string;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

export function SettingsModal({ 
  visible, 
  onClose, 
  config, 
  onUpdateConfig, 
  chatTitle, 
  onRename, 
  onDelete 
}: SettingsModalProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [localTitle, setLocalTitle] = useState(chatTitle);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    if (localTitle !== chatTitle) {
      onRename(localTitle);
    }
    onClose();
  };

  const ConfigSlider = ({ label, value, min, max, step, onChange, icon }: any) => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-2">
            {icon}
            <Text className="text-zinc-400 text-xs font-bold tracking-wider">{label}</Text>
        </View>
        <Text className="text-white font-mono text-xs">{value}</Text>
      </View>
      <View className="h-10 bg-zinc-900 rounded-xl border border-zinc-800 justify-center px-2">
        <TextInput 
            keyboardType="numeric"
            value={String(value)}
            onChangeText={(t) => {
                const num = parseFloat(t);
                if (!isNaN(num)) onChange(num);
            }}
            className="text-white font-mono"
        />
        {/* Note: React Native Slider would be better here, but using Input for simplicity/compatibility without adding deps right now */}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="h-[90%] bg-black rounded-t-[32px] overflow-hidden border border-zinc-800">
            <BlurView intensity={20} tint="dark" className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
                    <Text className="text-2xl font-bold text-white tracking-tighter">CONTROL</Text>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-6">
                    {/* Chat Management */}
                    <View className="mb-8 space-y-4">
                        <Text className="text-[10px] font-bold text-blue-500 tracking-[0.2em] mb-2">CONFIGURATION</Text>
                        
                        <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <View className="flex-row items-center mb-2 space-x-2">
                                <Type size={16} color="#a1a1aa" />
                                <Text className="text-zinc-400 text-xs font-bold">STREAM DESIGNATION</Text>
                            </View>
                            <TextInput 
                                value={localTitle}
                                onChangeText={setLocalTitle}
                                className="text-white text-lg font-bold border-b border-zinc-700 pb-2"
                            />
                        </View>
                    </View>

                    {/* Architecture Parameters */}
                    <View className="mb-8">
                         <Text className="text-[10px] font-bold text-blue-500 tracking-[0.2em] mb-4">ARCHITECTURE</Text>
                         
                         <ConfigSlider 
                            label="TEMPERATURE" 
                            value={localConfig.temperature} 
                            min={0} max={1} step={0.1}
                            onChange={(v: number) => setLocalConfig({...localConfig, temperature: v})}
                            icon={<Thermometer size={14} color="#60a5fa" />}
                         />
                         
                         <ConfigSlider 
                            label="TOP P" 
                            value={localConfig.topP} 
                            min={0} max={1} step={0.1}
                            onChange={(v: number) => setLocalConfig({...localConfig, topP: v})}
                            icon={<Zap size={14} color="#c084fc" />}
                         />
                         
                         <ConfigSlider 
                            label="MAX TOKENS" 
                            value={localConfig.maxOutputTokens} 
                            min={256} max={8192} step={256}
                            onChange={(v: number) => setLocalConfig({...localConfig, maxOutputTokens: v})}
                            icon={<Layers size={14} color="#f472b6" />}
                         />
                    </View>

                    {/* Auth */}
                    <View className="mb-8">
                         <Text className="text-[10px] font-bold text-blue-500 tracking-[0.2em] mb-4">AUTHENTICATION</Text>
                         <View className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <View className="flex-row items-center mb-2 space-x-2">
                                <Shield size={16} color="#a1a1aa" />
                                <Text className="text-zinc-400 text-xs font-bold">SYSTEM OVERRIDE KEY</Text>
                            </View>
                            <TextInput 
                                value={localConfig.customKey}
                                onChangeText={(t) => setLocalConfig({...localConfig, customKey: t})}
                                placeholder="ENTER_PRIVATE_KEY..."
                                placeholderTextColor="#52525b"
                                secureTextEntry
                                className="text-white text-base font-mono border-b border-zinc-700 pb-2"
                            />
                        </View>
                    </View>

                    {/* Engine Health Stub */}
                    <View className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 mb-8">
                        <View className="flex-row items-center space-x-4 mb-4">
                            <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
                                <Cpu size={20} color="#3b82f6" />
                            </View>
                            <View>
                                <Text className="text-xs font-black tracking-tight text-white">ENGINE_HEALTH</Text>
                                <Text className="text-[10px] text-blue-500/60 font-bold">ALL SYSTEMS NOMINAL</Text>
                            </View>
                        </View>
                        <View className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-500 w-[94%]" />
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="space-y-4 mb-10">
                        <TouchableOpacity 
                            onPress={handleSave}
                            className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2"
                        >
                            <Save size={20} color="black" />
                            <Text className="text-black font-bold tracking-wider">SAVE CHANGES</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => {
                                Alert.alert(
                                    "Delete Chat",
                                    "Are you sure you want to delete this chat? This action cannot be undone.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Delete", style: "destructive", onPress: onDelete }
                                    ]
                                );
                            }}
                            className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex-row items-center justify-center space-x-2"
                        >
                            <Trash2 size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold tracking-wider">DELETE STREAM</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </BlurView>
        </View>
      </View>
    </Modal>
  );
}
