import * as SecureStore from 'expo-secure-store';

// Change this to your computer's local IP if testing on a physical device
// e.g., "http://192.168.1.5:3000"
export const API_BASE = "http://localhost:3000"; 

export async function getAuthHeaders() {
  const apiKey = await SecureStore.getItemAsync("nexus_api_key");
  return {
    "Content-Type": "application/json",
    "Authorization": apiKey ? `Bearer ${apiKey}` : "",
  };
}

export async function saveApiKey(key: string) {
  await SecureStore.setItemAsync("nexus_api_key", key);
}

export async function getApiKey() {
  return await SecureStore.getItemAsync("nexus_api_key");
}
