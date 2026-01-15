import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Replace with your computer's local IP address for development
// Android Emulator uses 10.0.2.2 usually, but for physical devices use local IP
const LOCAL_IP = '192.168.1.169'; 
const BASE_URL = `http://${LOCAL_IP}:3005/api`;

export async function getToken() {
  return await SecureStore.getItemAsync('session_token');
}

export async function setToken(token: string) {
  return await SecureStore.setItemAsync('session_token', token);
}

export async function removeToken() {
  return await SecureStore.deleteItemAsync('session_token');
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await removeToken();
    // In a real app, you might trigger a navigation to login here
    throw new Error('Unauthorized');
  }

  return response;
}

export const api = {
  auth: {
    login: async (email, password) => {
      // Since NextAuth credentials provider is used, we might need to hit a custom endpoint
      // or mimic the NextAuth signin flow. 
      // For simplicity, let's assume we have a custom /api/auth/mobile-login endpoint
      // OR we just use the standard credentials flow if exposed appropriately.
      // A common pattern for mobile + NextAuth is a custom route that returns a JWT.
      
      const res = await fetch(`${BASE_URL}/mobile-connect/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      if (data.token) {
        await setToken(data.token);
      }
      return data;
    },
    register: async (name, email, password) => {
      const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error('Registration failed');
      return await res.json();
    },
    me: async () => {
      const res = await fetchWithAuth('/user/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      return await res.json();
    }
  },
  chat: {
    list: async () => {
      const res = await fetchWithAuth('/chat');
      if (!res.ok) throw new Error('Failed to fetch chats');
      return await res.json();
    },
    get: async (id: string) => {
      const res = await fetchWithAuth(`/chat/${id}`);
      if (!res.ok) throw new Error('Failed to fetch chat');
      return await res.json();
    },
    create: async (botId?: string) => {
      const res = await fetchWithAuth('/chat', { 
        method: 'POST', 
        body: JSON.stringify(botId ? { botId, title: 'New Bot Chat' } : {}) 
      });
      if (!res.ok) throw new Error('Failed to create chat');
      return await res.json();
    },
    transmit: async (payload: any) => {
      const res = await fetchWithAuth('/chat/transmit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    },
    sendMessage: async (chatId: string, content: string) => {
      // Deprecated in favor of transmit usually, but keeping for compatibility if needed
      const res = await fetchWithAuth(`/chat/${chatId}/message`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    }
  },
  bots: {
    list: async () => {
      const res = await fetchWithAuth('/user/bots');
      if (!res.ok) throw new Error('Failed to fetch bots');
      return await res.json();
    }
  }
};