import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Replace with your computer's local IP address for development
// Android Emulator uses 10.0.2.2 usually, but for physical devices use local IP
const LOCAL_IP = '192.168.1.169'; 
const BASE_URL = `http://${LOCAL_IP}:3005/api`;
export const API_BASE_URL = BASE_URL;

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
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error('Registration failed');
      return await res.json();
    },
    passwordPolicy: async () => {
      const res = await fetch(`${BASE_URL}/password-policy`);
      if (!res.ok) throw new Error('Failed to load password policy');
      return await res.json();
    },
    me: async () => {
      const res = await fetchWithAuth('/user');
      if (!res.ok) throw new Error('Failed to fetch user');
      return await res.json();
    },
    update: async (data: any) => {
        const res = await fetchWithAuth('/user', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update user');
        return await res.json();
    }
  },
  user: {
    key: async () => {
      const res = await fetchWithAuth('/user/key');
      if (!res.ok) throw new Error('Failed to fetch user key');
      return await res.json();
    },
    blocked: {
      list: async () => {
        const res = await fetchWithAuth('/user/blocked');
        if (!res.ok) throw new Error('Failed to fetch blocked users');
        return await res.json();
      },
      unblock: async (targetId: string) => {
        const res = await fetchWithAuth('/user/blocked', {
          method: 'DELETE',
          body: JSON.stringify({ targetId }),
        });
        if (!res.ok) throw new Error('Failed to unblock user');
        return await res.json();
      },
    },
  },
  join: {
    get: async (code: string) => {
      const res = await fetch(`${BASE_URL}/join/${code}`);
      if (!res.ok) throw new Error('Invalid or expired link');
      return await res.json();
    },
    submit: async (code: string) => {
      const res = await fetchWithAuth(`/join/${code}`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const message = error?.error || 'Failed to join';
        throw new Error(message);
      }
      return await res.json();
    },
  },
  chatJoin: {
    get: async (code: string) => {
      const res = await fetch(`${BASE_URL}/chat/join/${code}`);
      if (!res.ok) throw new Error('Invalid or expired link');
      return await res.json();
    },
    submit: async (code: string) => {
      const res = await fetchWithAuth(`/chat/join/${code}`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const message = error?.error || 'Failed to join';
        throw new Error(message);
      }
      return await res.json();
    },
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
    },
    update: async (chatId: string, data: { title?: string; config?: any }) => {
        const res = await fetchWithAuth(`/chat/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update chat');
        return await res.json();
    },
    delete: async (chatId: string) => {
        const res = await fetchWithAuth(`/chat/${chatId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete chat');
        return await res.json();
    },
    policy: async () => {
      const res = await fetchWithAuth('/chat/policy');
      if (!res.ok) throw new Error('Failed to fetch chat policy');
      return await res.json();
    },
    public: async (chatId: string) => {
      const res = await fetchWithAuth(`/chat/${chatId}/public`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to set chat public');
      return await res.json();
    },
    collaborators: async (chatId: string) => {
      const res = await fetchWithAuth(`/chat/${chatId}/collaborators`);
      if (!res.ok) throw new Error('Failed to fetch collaborators');
      return await res.json();
    },
    react: async (messageId: string, emoji: string) => {
      const res = await fetchWithAuth('/chat/messages/react', {
        method: 'POST',
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!res.ok) throw new Error('Failed to react');
      return await res.json();
    },
    links: {
      list: async (chatId: string) => {
        const res = await fetchWithAuth(`/chat/${chatId}/links`);
        if (!res.ok) throw new Error('Failed to fetch links');
        return await res.json();
      },
      create: async (chatId: string, payload: any) => {
        const res = await fetchWithAuth(`/chat/${chatId}/links`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create link');
        return await res.json();
      },
      update: async (chatId: string, linkId: string, payload: any) => {
        const res = await fetchWithAuth(`/chat/${chatId}/links/${linkId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update link');
        return await res.json();
      },
      remove: async (chatId: string, linkId: string) => {
        const res = await fetchWithAuth(`/chat/${chatId}/links/${linkId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to remove link');
        return await res.json();
      },
    },
  },
  collaboration: {
    users: {
      search: async (query: string) => {
        const res = await fetchWithAuth(`/collaboration/users?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return await res.json();
      },
    },
    connections: {
      list: async () => {
        const res = await fetchWithAuth('/collaboration/connections');
        if (!res.ok) throw new Error('Failed to fetch connections');
        return await res.json();
      },
      action: async (targetUserId: string, action: string) => {
        const res = await fetchWithAuth('/collaboration/connections', {
          method: 'POST',
          body: JSON.stringify({ targetUserId, action }),
        });
        if (!res.ok) throw new Error('Failed to update connection');
        return await res.json();
      },
    },
    messages: {
      list: async (userId: string) => {
        const res = await fetchWithAuth(`/collaboration/messages?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        return await res.json();
      },
      send: async (payload: { userId: string; content?: string; assetUrls?: string[] }) => {
        const res = await fetchWithAuth('/collaboration/messages', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to send message');
        return await res.json();
      },
      react: async (messageId: string, emoji: string) => {
        const res = await fetchWithAuth('/collaboration/messages/react', {
          method: 'POST',
          body: JSON.stringify({ messageId, emoji }),
        });
        if (!res.ok) throw new Error('Failed to react');
        return await res.json();
      },
      updateAppearance: async (otherUserId: string, appearance: any) => {
        const res = await fetchWithAuth('/collaboration/messages/appearance', {
          method: 'PATCH',
          body: JSON.stringify({ otherUserId, appearance }),
        });
        if (!res.ok) throw new Error('Failed to update appearance');
        return await res.json();
      },
    },
    threads: {
      delete: async (threadId: string) => {
        const res = await fetchWithAuth(`/collaboration/threads/${threadId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete thread');
        return await res.json();
      },
      leave: async (threadId: string) => {
        const res = await fetchWithAuth(`/collaboration/threads/${threadId}/leave`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to leave thread');
        return await res.json();
      },
    },
    block: async (targetUserId: string) => {
      const res = await fetchWithAuth('/collaboration/block', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to block user');
      return await res.json();
    },
  },
  memory: {
    list: async () => {
      const res = await fetchWithAuth('/memory');
      if (!res.ok) throw new Error('Failed to fetch memories');
      return await res.json();
    },
    create: async (label: string, content: string) => {
      const res = await fetchWithAuth('/memory', {
        method: 'POST',
        body: JSON.stringify({ label, content }),
      });
      if (!res.ok) throw new Error('Failed to create memory');
      return await res.json();
    },
    update: async (id: string, payload: { label?: string; content?: string }) => {
      const res = await fetchWithAuth(`/memory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update memory');
      return await res.json();
    },
    remove: async (id: string) => {
      const res = await fetchWithAuth(`/memory/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete memory');
      return await res.json();
    },
  },
  admin: {
    overview: async () => {
      const res = await fetchWithAuth('/admin/overview');
      if (!res.ok) throw new Error('Failed to load overview');
      return await res.json();
    },
    users: {
      list: async () => {
        const res = await fetchWithAuth('/admin/users');
        if (!res.ok) throw new Error('Failed to load users');
        return await res.json();
      },
      update: async (userId: string, payload: any) => {
        const res = await fetchWithAuth(`/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update user');
        return await res.json();
      },
      remove: async (userId: string) => {
        const res = await fetchWithAuth(`/admin/users/${userId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return await res.json();
      },
    },
    roles: {
      list: async () => {
        const res = await fetchWithAuth('/admin/roles');
        if (!res.ok) throw new Error('Failed to load roles');
        return await res.json();
      },
      create: async (payload: { name: string; description?: string; permissionIds?: string[] }) => {
        const res = await fetchWithAuth('/admin/roles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create role');
        return await res.json();
      },
      update: async (roleId: string, payload: { name?: string; description?: string; permissionIds?: string[] }) => {
        const res = await fetchWithAuth(`/admin/roles/${roleId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update role');
        return await res.json();
      },
      remove: async (roleId: string) => {
        const res = await fetchWithAuth(`/admin/roles/${roleId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete role');
        return await res.json();
      },
    },
    permissions: {
      list: async () => {
        const res = await fetchWithAuth('/admin/permissions');
        if (!res.ok) throw new Error('Failed to load permissions');
        return await res.json();
      },
      create: async (payload: { name: string; description?: string }) => {
        const res = await fetchWithAuth('/admin/permissions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create permission');
        return await res.json();
      },
      update: async (permissionId: string, payload: { name?: string; description?: string }) => {
        const res = await fetchWithAuth(`/admin/permissions/${permissionId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update permission');
        return await res.json();
      },
      remove: async (permissionId: string) => {
        const res = await fetchWithAuth(`/admin/permissions/${permissionId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete permission');
        return await res.json();
      },
    },
    settings: {
      list: async () => {
        const res = await fetchWithAuth('/admin/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        return await res.json();
      },
    },
    organizations: {
      list: async () => {
        const res = await fetchWithAuth('/admin/organizations');
        if (!res.ok) throw new Error('Failed to load organizations');
        return await res.json();
      },
      structure: {
        get: async (orgId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/structure`);
          if (!res.ok) throw new Error('Failed to load org structure');
          return await res.json();
        },
      },
      links: {
        list: async (orgId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/links`);
          if (!res.ok) throw new Error('Failed to load org links');
          return await res.json();
        },
        create: async (orgId: string, payload: any) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/links`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to create org link');
          return await res.json();
        },
        update: async (orgId: string, linkId: string, payload: any) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/links/${linkId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update org link');
          return await res.json();
        },
        remove: async (orgId: string, linkId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/links/${linkId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete org link');
          return await res.json();
        },
      },
      members: {
        list: async (orgId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/members`);
          if (!res.ok) throw new Error('Failed to load org members');
          return await res.json();
        },
        remove: async (orgId: string, memberId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/members/${memberId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to remove member');
          return await res.json();
        },
      },
      requests: {
        list: async (orgId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/requests`);
          if (!res.ok) throw new Error('Failed to load join requests');
          return await res.json();
        },
        action: async (orgId: string, requestId: string, action: 'APPROVE' | 'REJECT') => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/requests`, {
            method: 'POST',
            body: JSON.stringify({ requestId, action }),
          });
          if (!res.ok) throw new Error('Failed to update join request');
          return await res.json();
        },
      },
      overrides: {
        list: async (orgId: string) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/overrides`);
          if (!res.ok) throw new Error('Failed to load org overrides');
          return await res.json();
        },
        update: async (orgId: string, payload: { permissionName: string; value: boolean }) => {
          const res = await fetchWithAuth(`/admin/organizations/${orgId}/overrides`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update override');
          return await res.json();
        },
      },
    },
    chatPolicy: {
      get: async () => {
        const res = await fetchWithAuth('/admin/chat/policy');
        if (!res.ok) throw new Error('Failed to load chat policy');
        return await res.json();
      },
      update: async (payload: any) => {
        const res = await fetchWithAuth('/admin/chat/policy', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update chat policy');
        return await res.json();
      },
    },
    bots: {
      list: async () => {
        const res = await fetchWithAuth('/admin/bots');
        if (!res.ok) throw new Error('Failed to load bots');
        return await res.json();
      },
      remove: async (botId: string) => {
        const res = await fetchWithAuth(`/bots/${botId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete bot');
        return await res.text();
      },
    },
    ai: {
      chats: {
        list: async () => {
          const res = await fetchWithAuth('/admin/ai/chats');
          if (!res.ok) throw new Error('Failed to load AI chats');
          return await res.json();
        },
        create: async (title: string) => {
          const res = await fetchWithAuth('/admin/ai/chats', {
            method: 'POST',
            body: JSON.stringify({ title }),
          });
          if (!res.ok) throw new Error('Failed to create AI chat');
          return await res.json();
        },
        remove: async (chatId: string) => {
          const res = await fetchWithAuth(`/admin/ai/chats/${chatId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete AI chat');
          return await res.json();
        },
      },
      messages: {
        list: async (chatId: string) => {
          const res = await fetchWithAuth(`/admin/ai/chat/${chatId}`);
          if (!res.ok) throw new Error('Failed to load AI messages');
          return await res.json();
        },
      },
      send: async (payload: { prompt?: string; chatId?: string; confirmedAction?: any }) => {
        const res = await fetchWithAuth('/admin/ai/chat', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to send AI prompt');
        return await res.json();
      },
    },
    logs: {
      list: async () => {
        const res = await fetchWithAuth('/admin/logs');
        if (!res.ok) throw new Error('Failed to load logs');
        return await res.json();
      },
    },
  },
  bots: {
    list: async () => {
      const res = await fetchWithAuth('/user/bots');
      if (!res.ok) throw new Error('Failed to fetch bots');
      return await res.json();
    }
  },
  models: {
    list: async () => {
      const res = await fetchWithAuth('/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      return await res.json();
    }
  },
  version: {
    get: async (chatId: string) => {
        const res = await fetchWithAuth(`/version?chatId=${chatId}`);
        if (!res.ok) throw new Error('Failed to fetch version data');
        return await res.json();
    },
    createBranch: async (data: any) => {
        const res = await fetchWithAuth('/version/branch', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create branch');
        return await res.json();
    },
    createCheckpoint: async (data: any) => {
        const res = await fetchWithAuth('/version/checkpoint', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create checkpoint');
        return await res.json();
    },
    addCheckpointComment: async (checkpointId: string, content: string) => {
        const res = await fetchWithAuth(`/version/checkpoint/${checkpointId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to add comment');
        return await res.json();
    },
    createMergeRequest: async (data: any) => {
        const res = await fetchWithAuth('/version/merge-request', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create merge request');
        return await res.json();
    },
    addMergeComment: async (mergeRequestId: string, content: string) => {
        const res = await fetchWithAuth(`/version/merge-request/${mergeRequestId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error('Failed to add merge comment');
        return await res.json();
    },
    mergeRequest: async (mergeRequestId: string, strategy: string) => {
        const res = await fetchWithAuth(`/version/merge-request/${mergeRequestId}/merge`, {
            method: 'POST',
            body: JSON.stringify({ strategy }),
        });
        if (!res.ok) throw new Error('Failed to merge');
        return await res.json();
    },
    restore: async (data: any) => {
        const res = await fetchWithAuth('/version/restore', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to restore checkpoint');
        return await res.json();
    },
    compile: async (data: any) => {
        const res = await fetchWithAuth('/version/compile', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to compile branch');
        return await res.json();
    },
  }
};
