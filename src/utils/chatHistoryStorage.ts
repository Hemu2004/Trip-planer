import { ChatConversation, ChatMessage } from '../types';

export const INITIAL_GREETING =
  "Hi! I'm your Trip Planner AI. I can help you discover destinations, plan trips, create itineraries, manage budgets, find places and answer travel questions.";

function getStorageKey(userId: string): string {
  const safeId = encodeURIComponent(userId.trim().toLowerCase());
  return `trip_planner_chat_conversations_${safeId}`;
}

export function createInitialGreetingMessage(): ChatMessage {
  return {
    id: 'welcome-' + Date.now(),
    sender: 'assistant',
    role: 'concierge',
    modelUsed: 'gemini-3.8-flash',
    content: INITIAL_GREETING,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function createNewConversation(userId: string, title: string = 'New Travel Plan'): ChatConversation {
  const now = new Date().toISOString();
  return {
    id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId,
    title,
    messages: [createInitialGreetingMessage()],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Loads all saved conversations for a specific authenticated user.
 * Strictly scoped to the userId to guarantee complete conversation privacy.
 */
export function loadUserConversations(userId: string): ChatConversation[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      const defaultConv = createNewConversation(userId, 'Welcome to Trip Planner AI');
      saveUserConversation(userId, defaultConv);
      return [defaultConv];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaultConv = createNewConversation(userId, 'Welcome to Trip Planner AI');
    saveUserConversation(userId, defaultConv);
    return [defaultConv];
  } catch (err) {
    console.error('Error loading conversations for user:', userId, err);
    return [createNewConversation(userId)];
  }
}

/**
 * Saves or updates a user conversation in privacy-isolated storage.
 */
export function saveUserConversation(userId: string, conversation: ChatConversation): void {
  if (!userId || !conversation?.id) return;
  try {
    const key = getStorageKey(userId);
    const existingRaw = localStorage.getItem(key);
    let conversations: ChatConversation[] = [];
    if (existingRaw) {
      try {
        conversations = JSON.parse(existingRaw);
      } catch {
        conversations = [];
      }
    }

    const index = conversations.findIndex((c) => c.id === conversation.id);
    const updatedConversation = {
      ...conversation,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      conversations[index] = updatedConversation;
    } else {
      conversations.unshift(updatedConversation);
    }

    localStorage.setItem(key, JSON.stringify(conversations));
  } catch (err) {
    console.error('Error saving conversation for user:', userId, err);
  }
}

/**
 * Deletes a specific conversation for a user.
 */
export function deleteUserConversation(userId: string, conversationId: string): ChatConversation[] {
  if (!userId) return [];
  try {
    const key = getStorageKey(userId);
    const existingRaw = localStorage.getItem(key);
    let conversations: ChatConversation[] = [];
    if (existingRaw) {
      try {
        conversations = JSON.parse(existingRaw);
      } catch {
        conversations = [];
      }
    }

    conversations = conversations.filter((c) => c.id !== conversationId);

    // If all deleted, recreate one
    if (conversations.length === 0) {
      const fresh = createNewConversation(userId, 'Trip Planning');
      conversations = [fresh];
    }

    localStorage.setItem(key, JSON.stringify(conversations));
    return conversations;
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return [];
  }
}
