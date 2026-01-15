import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { X, GitBranch, Save, Plus, GitCommit } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { api } from '../lib/api';

interface VersionModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
}

export function VersionModal({ 
  visible, 
  onClose, 
  chatId, 
  selectedBranchId, 
  onSelectBranch 
}: VersionModalProps) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'branches' | 'checkpoints'>('branches');
  
  // Create Branch State
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  // Create Checkpoint State
  const [checkpointLabel, setCheckpointLabel] = useState("");
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  useEffect(() => {
    if (visible && chatId) {
        loadData();
    }
  }, [visible, chatId]);

  const loadData = async () => {
    setLoading(true);
    try {
        const data = await api.version.get(chatId);
        if (data.branches) setBranches(data.branches);
        if (data.checkpoints) setCheckpoints(data.checkpoints);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsCreatingBranch(true);
    try {
        await api.version.createBranch({
            chatId,
            name: newBranchName,
            baseCheckpointId: null // For now, simple branch from head
        });
        setNewBranchName("");
        await loadData();
    } catch (e) {
        Alert.alert("Error", "Failed to create branch");
    } finally {
        setIsCreatingBranch(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!checkpointLabel.trim() || !selectedBranchId) return;
    setIsCreatingCheckpoint(true);
    try {
        await api.version.createCheckpoint({
            chatId,
            branchId: selectedBranchId,
            label: checkpointLabel,
            comment: ""
        });
        setCheckpointLabel("");
        await loadData();
    } catch (e) {
        Alert.alert("Error", "Failed to create checkpoint");
    } finally {
        setIsCreatingCheckpoint(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="h-[80%] bg-black rounded-t-[32px] overflow-hidden border border-zinc-800">
            <BlurView intensity={20} tint="dark" className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between p-6 border-b border-zinc-900">
                    <View className="flex-row items-center space-x-2">
                        <GitBranch size={24} color="#a1a1aa" />
                        <Text className="text-2xl font-bold text-white tracking-tighter">VERSION CONTROL</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-zinc-900 rounded-full">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="flex-row px-6 py-4 border-b border-zinc-900">
                    <TouchableOpacity 
                        onPress={() => setActiveTab('branches')}
                        className={`mr-6 pb-2 border-b-2 ${activeTab === 'branches' ? 'border-blue-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'branches' ? 'text-blue-500' : 'text-zinc-500'}`}>BRANCHES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('checkpoints')}
                        className={`pb-2 border-b-2 ${activeTab === 'checkpoints' ? 'border-purple-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'checkpoints' ? 'text-purple-500' : 'text-zinc-500'}`}>CHECKPOINTS</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-6">
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            {activeTab === 'branches' && (
                                <View>
                                    <View className="flex-row items-center space-x-2 mb-6">
                                        <TextInput 
                                            value={newBranchName}
                                            onChangeText={setNewBranchName}
                                            placeholder="New Branch Name"
                                            placeholderTextColor="#52525b"
                                            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white"
                                        />
                                        <TouchableOpacity 
                                            onPress={handleCreateBranch}
                                            disabled={isCreatingBranch || !newBranchName.trim()}
                                            className="bg-blue-600 p-3 rounded-xl"
                                        >
                                            {isCreatingBranch ? <ActivityIndicator color="white" /> : <Plus size={20} color="white" />}
                                        </TouchableOpacity>
                                    </View>

                                    {branches.map(branch => (
                                        <TouchableOpacity 
                                            key={branch.id}
                                            onPress={() => onSelectBranch(branch.id)}
                                            className={`p-4 rounded-xl border mb-3 flex-row items-center justify-between ${selectedBranchId === branch.id ? 'bg-blue-900/20 border-blue-500/50' : 'bg-zinc-900/50 border-zinc-800'}`}
                                        >
                                            <View className="flex-row items-center space-x-3">
                                                <GitBranch size={18} color={selectedBranchId === branch.id ? '#60a5fa' : '#71717a'} />
                                                <View>
                                                    <Text className={`font-bold ${selectedBranchId === branch.id ? 'text-blue-400' : 'text-white'}`}>{branch.name}</Text>
                                                    <Text className="text-zinc-500 text-[10px]">HEAD: {branch.head?.label || "Initial"}</Text>
                                                </View>
                                            </View>
                                            {selectedBranchId === branch.id && <View className="bg-blue-500/20 px-2 py-1 rounded text-blue-400 text-[10px] font-bold"><Text className="text-blue-400 text-[10px] font-bold">ACTIVE</Text></View>}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {activeTab === 'checkpoints' && (
                                <View>
                                    <View className="flex-row items-center space-x-2 mb-6">
                                        <TextInput 
                                            value={checkpointLabel}
                                            onChangeText={setCheckpointLabel}
                                            placeholder="Checkpoint Label"
                                            placeholderTextColor="#52525b"
                                            className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white"
                                        />
                                        <TouchableOpacity 
                                            onPress={handleCreateCheckpoint}
                                            disabled={isCreatingCheckpoint || !checkpointLabel.trim()}
                                            className="bg-purple-600 p-3 rounded-xl"
                                        >
                                            {isCreatingCheckpoint ? <ActivityIndicator color="white" /> : <Save size={20} color="white" />}
                                        </TouchableOpacity>
                                    </View>

                                    {checkpoints.map(cp => (
                                        <View 
                                            key={cp.id}
                                            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-3 flex-row items-center space-x-3"
                                        >
                                            <GitCommit size={18} color="#c084fc" />
                                            <View>
                                                <Text className="text-white font-bold">{cp.label}</Text>
                                                <Text className="text-zinc-500 text-[10px]">{new Date(cp.createdAt).toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </BlurView>
        </View>
      </View>
    </Modal>
  );
}
