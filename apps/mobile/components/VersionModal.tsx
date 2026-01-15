import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { X, GitBranch, Save, Plus, GitCommit, Layers } from 'lucide-react-native';
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
  const [mergeRequests, setMergeRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'branches' | 'checkpoints' | 'merges'>('branches');
  
  // Create Branch State
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  // Create Checkpoint State
  const [checkpointLabel, setCheckpointLabel] = useState("");
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  // Merge Request State
  const [mergeTitle, setMergeTitle] = useState("");
  const [mergeDescription, setMergeDescription] = useState("");
  const [sourceBranchId, setSourceBranchId] = useState<string | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(null);
  const [isCreatingMerge, setIsCreatingMerge] = useState(false);

  // Comments
  const [commentTarget, setCommentTarget] = useState<{ type: 'checkpoint' | 'merge'; id: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const [isCompiling, setIsCompiling] = useState(false);

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
        if (data.mergeRequests) setMergeRequests(data.mergeRequests);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (branches.length === 0) return;
    const fallbackSource = selectedBranchId || branches[0].id;
    const fallbackTarget = branches.find((b) => b.id !== fallbackSource) || branches[0];
    if (!sourceBranchId) setSourceBranchId(fallbackSource);
    if (!targetBranchId) setTargetBranchId(fallbackTarget?.id || fallbackSource);
  }, [branches, selectedBranchId, sourceBranchId, targetBranchId]);

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

  const handleCompile = async () => {
    if (!selectedBranchId) return;
    setIsCompiling(true);
    try {
      const data = await api.version.compile({ chatId, branchId: selectedBranchId });
      Alert.alert("Compile Complete", `Compiled ${data.messageCount || 0} messages.`);
      await loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to compile branch");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRestore = async (checkpointId: string, strategy: string) => {
    if (!selectedBranchId) return;
    try {
      await api.version.restore({
        chatId,
        branchId: selectedBranchId,
        checkpointId,
        strategy,
      });
      Alert.alert("Restore Complete", `Checkpoint restored (${strategy}).`);
      await loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to restore checkpoint");
    }
  };

  const openRestoreMenu = (checkpointId: string) => {
    Alert.alert("Restore Strategy", "Select restore mode", [
      { text: "Squash", onPress: () => handleRestore(checkpointId, "squash") },
      { text: "Fast Forward", onPress: () => handleRestore(checkpointId, "fast-forward") },
      { text: "Rebase", onPress: () => handleRestore(checkpointId, "rebase") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleCreateMerge = async () => {
    if (!mergeTitle.trim() || !sourceBranchId || !targetBranchId) return;
    setIsCreatingMerge(true);
    try {
      await api.version.createMergeRequest({
        chatId,
        sourceBranchId,
        targetBranchId,
        title: mergeTitle.trim(),
        description: mergeDescription.trim(),
      });
      setMergeTitle("");
      setMergeDescription("");
      await loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to create merge request");
    } finally {
      setIsCreatingMerge(false);
    }
  };

  const handleMerge = async (mergeRequestId: string, strategy: string) => {
    try {
      await api.version.mergeRequest(mergeRequestId, strategy);
      Alert.alert("Merge Complete", `Merged using ${strategy}.`);
      await loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to merge request");
    }
  };

  const openMergeMenu = (mergeRequestId: string) => {
    Alert.alert("Merge Strategy", "Select merge mode", [
      { text: "Squash", onPress: () => handleMerge(mergeRequestId, "squash") },
      { text: "Fast Forward", onPress: () => handleMerge(mergeRequestId, "fast-forward") },
      { text: "Rebase", onPress: () => handleMerge(mergeRequestId, "rebase") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveComment = async () => {
    if (!commentTarget || commentDraft.trim().length < 2) return;
    try {
      if (commentTarget.type === 'checkpoint') {
        await api.version.addCheckpointComment(commentTarget.id, commentDraft.trim());
      } else {
        await api.version.addMergeComment(commentTarget.id, commentDraft.trim());
      }
      setCommentDraft("");
      setCommentTarget(null);
      await loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to add comment");
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
                    <TouchableOpacity 
                        onPress={() => setActiveTab('merges')}
                        className={`ml-6 pb-2 border-b-2 ${activeTab === 'merges' ? 'border-emerald-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'merges' ? 'text-emerald-400' : 'text-zinc-500'}`}>MERGES</Text>
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

                                    <TouchableOpacity
                                      onPress={handleCompile}
                                      disabled={isCompiling || !selectedBranchId}
                                      className={`mb-6 p-4 rounded-2xl border ${selectedBranchId ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-900/20 border-zinc-800/40'}`}
                                    >
                                      <View className="flex-row items-center justify-between">
                                        <View>
                                          <Text className="text-white font-bold">Compile Selected Branch</Text>
                                          <Text className="text-zinc-500 text-[10px]">Generate compiled state from checkpoints</Text>
                                        </View>
                                        {isCompiling ? (
                                          <ActivityIndicator color="#60a5fa" />
                                        ) : (
                                          <GitCommit size={18} color={selectedBranchId ? '#60a5fa' : '#52525b'} />
                                        )}
                                      </View>
                                    </TouchableOpacity>

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
                                                    {branch.lastCompiledAt && (
                                                      <Text className="text-zinc-600 text-[10px]">COMPILED: {new Date(branch.lastCompiledAt).toLocaleString()}</Text>
                                                    )}
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
                                                {cp.comment ? <Text className="text-zinc-600 text-[10px] mt-1">{cp.comment}</Text> : null}
                                            </View>
                                            <View className="ml-auto flex-row items-center space-x-2">
                                              <TouchableOpacity onPress={() => setCommentTarget({ type: 'checkpoint', id: cp.id })}>
                                                <Text className="text-blue-400 text-xs font-bold">COMMENT</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity onPress={() => openRestoreMenu(cp.id)}>
                                                <Text className="text-purple-400 text-xs font-bold">RESTORE</Text>
                                              </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {activeTab === 'merges' && (
                              <View>
                                <View className="mb-6">
                                  <Text className="text-zinc-400 text-xs font-bold mb-2 uppercase">Create Merge Request</Text>
                                  <TextInput
                                    value={mergeTitle}
                                    onChangeText={setMergeTitle}
                                    placeholder="Merge title"
                                    placeholderTextColor="#52525b"
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white mb-3"
                                  />
                                  <TextInput
                                    value={mergeDescription}
                                    onChangeText={setMergeDescription}
                                    placeholder="Description (optional)"
                                    placeholderTextColor="#52525b"
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white mb-3"
                                  />
                                  <View className="mb-3">
                                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Source</Text>
                                    <View className="flex-row flex-wrap">
                                      {branches.map((branch) => (
                                        <TouchableOpacity
                                          key={`source-${branch.id}`}
                                          onPress={() => setSourceBranchId(branch.id)}
                                          className={`px-3 py-2 rounded-2xl border mr-2 mb-2 ${sourceBranchId === branch.id ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-zinc-900/50 border-zinc-800'}`}
                                        >
                                          <Text className={`text-xs font-bold ${sourceBranchId === branch.id ? 'text-emerald-300' : 'text-white'}`}>{branch.name}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </View>
                                  <View className="mb-4">
                                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2">Target</Text>
                                    <View className="flex-row flex-wrap">
                                      {branches.map((branch) => (
                                        <TouchableOpacity
                                          key={`target-${branch.id}`}
                                          onPress={() => setTargetBranchId(branch.id)}
                                          className={`px-3 py-2 rounded-2xl border mr-2 mb-2 ${targetBranchId === branch.id ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-zinc-900/50 border-zinc-800'}`}
                                        >
                                          <Text className={`text-xs font-bold ${targetBranchId === branch.id ? 'text-emerald-300' : 'text-white'}`}>{branch.name}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    onPress={handleCreateMerge}
                                    disabled={isCreatingMerge || !mergeTitle.trim() || !sourceBranchId || !targetBranchId}
                                    className="bg-emerald-600 p-3 rounded-xl items-center"
                                  >
                                    {isCreatingMerge ? (
                                      <ActivityIndicator color="white" />
                                    ) : (
                                      <View className="flex-row items-center space-x-2">
                                        <Layers size={18} color="white" />
                                        <Text className="text-white font-bold">Create Merge</Text>
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                </View>

                                {mergeRequests.map((mr) => (
                                  <View key={mr.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-3">
                                    <View className="flex-row items-center justify-between">
                                      <View>
                                        <Text className="text-white font-bold">{mr.title}</Text>
                                        <Text className="text-zinc-500 text-[10px]">
                                          {mr.sourceBranch?.name || 'source'} -> {mr.targetBranch?.name || 'target'}
                                        </Text>
                                      </View>
                                      <View className={`px-2 py-1 rounded-full ${mr.status === 'merged' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                                        <Text className={`text-[10px] font-bold ${mr.status === 'merged' ? 'text-emerald-300' : 'text-yellow-300'}`}>
                                          {(mr.status || 'open').toUpperCase()}
                                        </Text>
                                      </View>
                                    </View>
                                    {mr.description ? <Text className="text-zinc-400 text-xs mt-2">{mr.description}</Text> : null}
                                    <View className="flex-row items-center space-x-3 mt-3">
                                      <TouchableOpacity onPress={() => setCommentTarget({ type: 'merge', id: mr.id })}>
                                        <Text className="text-blue-400 text-xs font-bold">COMMENT</Text>
                                      </TouchableOpacity>
                                      {mr.status !== 'merged' && (
                                        <TouchableOpacity onPress={() => openMergeMenu(mr.id)}>
                                          <Text className="text-emerald-400 text-xs font-bold">MERGE</Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                    {Array.isArray(mr.comments) && mr.comments.length > 0 && (
                                      <View className="mt-3 space-y-2">
                                        {mr.comments.map((comment: any) => (
                                          <Text key={comment.id} className="text-zinc-500 text-[10px]">
                                            {comment.content}
                                          </Text>
                                        ))}
                                      </View>
                                    )}
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

    <Modal visible={!!commentTarget} transparent animationType="fade" onRequestClose={() => setCommentTarget(null)}>
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
          <Text className="text-white font-bold mb-3">Add Comment</Text>
          <TextInput
            value={commentDraft}
            onChangeText={setCommentDraft}
            placeholder="Write a note"
            placeholderTextColor="#52525b"
            className="bg-black/40 border border-zinc-800 rounded-2xl p-3 text-white mb-4"
            multiline
          />
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => { setCommentTarget(null); setCommentDraft(""); }} className="px-4 py-2 rounded-xl bg-zinc-800">
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveComment} className="px-4 py-2 rounded-xl bg-white">
              <Text className="text-black font-bold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
