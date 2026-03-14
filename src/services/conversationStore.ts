export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 20;

const store = new Map<string, ChatMessage[]>();

export function getHistory(channelId: string): ChatMessage[] {
  return [...(store.get(channelId) ?? [])];
}

export function appendMessages(channelId: string, messages: ChatMessage[]) {
  const history = store.get(channelId) ?? [];
  history.push(...messages);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  store.set(channelId, history);
}

export function clearHistory(channelId: string) {
  store.delete(channelId);
}
