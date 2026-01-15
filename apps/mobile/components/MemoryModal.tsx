import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Database, Plus, X, Save, Trash2, Search } from 'lucide-react-native';
import { api } from '../lib/api';

interface MemoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MemoryModal({ visible, onClose }: MemoryModalProps) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<'recent' | 'label'>('recent');

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await api.memory.list();
      setMemories(data.memories || []);
    } catch (e) {
      // Ignore for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMemories();
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = !term
      ? memories
      : memories.filter((memory) =>
          `${memory.label} ${memory.content}`.toLowerCase().includes(term)
        );
    return [...base].sort((a, b) => {
      if (sort === 'label') {
        return (a.label || '').localeCompare(b.label || '');
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [memories, search, sort]);

  const openEditor = (memory?: any) => {
    if (memory) {
      setEditingId(memory.id);
      setLabel(memory.label || '');
      setContent(memory.content || '');
    } else {
      setEditingId(null);
      setLabel('');
      setContent('');
    }
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (label.trim().length < 2 || content.trim().length < 3) {
      Alert.alert('Validation', 'Provide a label and content.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.memory.update(editingId, { label: label.trim(), content: content.trim() });
      } else {
        await api.memory.create(label.trim(), content.trim());
      }
      await loadMemories();
      setEditorOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save memory');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (memoryId: string) => {
    Alert.alert('Delete Memory', 'This memory will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.memory.remove(memoryId);
            await loadMemories();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete memory');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-end">
        <View className="h-[85%] bg-black border border-zinc-800 rounded-t-[32px] overflow-hidden">
          <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
            <View className="flex-row items-center space-x-2">
              <Database size={22} color="#60a5fa" />
              <Text className="text-white text-xl font-bold">Memory Vault</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4">
            <View className="flex-row items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3">
              <Search size={16} color="#71717a" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search memories"
                placeholderTextColor="#52525b"
                className="flex-1 text-white ml-3"
              />
              <TouchableOpacity onPress={() => openEditor()} className="ml-3">
                <Plus size={18} color="#60a5fa" />
              </TouchableOpacity>
            </View>
            <View className="flex-row mt-3">
              <TouchableOpacity
                onPress={() => setSort('recent')}
                className={`px-4 py-2 rounded-full border mr-2 ${
                  sort === 'recent' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <Text className={`text-[10px] uppercase ${sort === 'recent' ? 'text-blue-400' : 'text-zinc-500'}`}>
                  Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSort('label')}
                className={`px-4 py-2 rounded-full border ${
                  sort === 'label' ? 'bg-purple-600/20 border-purple-500/50' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <Text className={`text-[10px] uppercase ${sort === 'label' ? 'text-purple-300' : 'text-zinc-500'}`}>
                  Label
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-6">
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" color="#60a5fa" />
              </View>
            ) : filtered.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-zinc-500 text-sm">No memories found</Text>
              </View>
            ) : (
              filtered.map((memory) => (
                <View key={memory.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {memory.label}
                    </Text>
                    <View className="flex-row items-center space-x-2">
                      <TouchableOpacity onPress={() => openEditor(memory)}>
                        <Text className="text-blue-400 text-xs font-bold">EDIT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(memory.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-zinc-400 text-xs mt-2" numberOfLines={3}>
                    {memory.content}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <Modal visible={editorOpen} animationType="slide" transparent onRequestClose={() => setEditorOpen(false)}>
            <BlurView intensity={25} tint="dark" className="flex-1 justify-end">
              <View className="h-[60%] bg-zinc-900 border border-zinc-800 rounded-t-[32px] p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-lg font-bold">
                    {editingId ? 'Edit Memory' : 'New Memory'}
                  </Text>
                  <TouchableOpacity onPress={() => setEditorOpen(false)} className="p-2 bg-zinc-800 rounded-full">
                    <X size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Label</Text>
                  <TextInput
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Memory label"
                    placeholderTextColor="#52525b"
                    className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white"
                  />
                </View>
                <View className="mb-6">
                  <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Content</Text>
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Memory content"
                    placeholderTextColor="#52525b"
                    multiline
                    className="bg-black/40 border border-zinc-800 rounded-xl p-4 text-white min-h-[140px]"
                    textAlignVertical="top"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="w-full bg-white rounded-2xl p-4 flex-row items-center justify-center space-x-2"
                >
                  {saving ? <ActivityIndicator color="black" /> : <Save size={18} color="black" />}
                  <Text className="text-black font-bold">{saving ? 'Saving...' : 'Save Memory'}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Modal>
        </View>
      </BlurView>
    </Modal>
  );
}
