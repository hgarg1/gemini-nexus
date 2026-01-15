import { io, Socket } from 'socket.io-client';

// Hardcoded IP for now, should match api.ts
const LOCAL_IP = '192.168.1.169'; 
const SOCKET_URL = `http://${LOCAL_IP}:3006`; // Web typically uses 3006 for socket

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socket.on('connect', () => {
      console.log('Mobile Socket Connected');
    });

    socket.on('disconnect', () => {
        console.log('Mobile Socket Disconnected');
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
