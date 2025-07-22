import { Message, Connection } from '../types';

const MESSAGES_KEY = 'chat_messages';
const CONNECTION_KEY = 'chat_connection';
const MESSAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const storageUtils = {
  saveConnection(connection: Connection) {
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
  },

  getConnection(): Connection | null {
    const stored = localStorage.getItem(CONNECTION_KEY);
    if (!stored) return null;

    try {
      const connection = JSON.parse(stored);
      // Check if connection is still valid (within 24 hours)
      if (Date.now() - connection.created > MESSAGE_EXPIRY) {
        this.clearConnection();
        return null;
      }
      return connection;
    } catch {
      return null;
    }
  },

  clearConnection() {
    localStorage.removeItem(CONNECTION_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  },

  saveMessages(messages: Message[]) {
    const validMessages = messages.filter(
      msg => Date.now() - msg.timestamp < MESSAGE_EXPIRY
    );
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(validMessages));
  },

  getMessages(): Message[] {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (!stored) return [];

    try {
      const messages = JSON.parse(stored);
      // Filter out expired messages
      const validMessages = messages.filter(
        (msg: Message) => Date.now() - msg.timestamp < MESSAGE_EXPIRY
      );
      
      // Save back filtered messages
      if (validMessages.length !== messages.length) {
        this.saveMessages(validMessages);
      }
      
      return validMessages;
    } catch {
      return [];
    }
  },

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
  },

  showNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        tag: 'chat-message'
      });
    }
  }
};