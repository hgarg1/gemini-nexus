import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Settings, MessageSquare, User } from 'lucide-react-native';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Nexus Mobile system online. Ready for transmission.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulating API call
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'model', content: 'Processing transmission from mobile terminal...' }]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GEMINI NEXUS</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>MOBILE_LINK ACTIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Settings color="#00f2ff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((m, i) => (
          <View key={i} style={[
            styles.messageWrapper,
            m.role === 'user' ? styles.userMessageWrapper : styles.modelMessageWrapper
          ]}>
            <View style={[
              styles.messageBubble,
              m.role === 'user' ? styles.userBubble : styles.modelBubble
            ]}>
              <Text style={styles.roleText}>{m.role.toUpperCase()}</Text>
              <Text style={styles.messageText}>{m.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Transmit command..."
            placeholderTextColor="#666"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!input.trim()}
            style={[styles.sendButton, !input.trim() && styles.disabledSendButton]}
          >
            <Send color={input.trim() ? "#000" : "#666"} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1c',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f2ff',
    marginRight: 6,
  },
  statusText: {
    color: '#00f2ff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#1a1a1c',
    borderRadius: 12,
  },
  messagesContainer: {
    padding: 20,
  },
  messageWrapper: {
    marginBottom: 24,
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  modelMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1a1a1c',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderBottomColor: '#333',
  },
  modelBubble: {
    backgroundColor: '#000',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderBottomColor: '#00f2ff33',
  },
  roleText: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  messageText: {
    color: '#eee',
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#0a0a0c',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1c',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#00f2ff',
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: '#333',
  },
});