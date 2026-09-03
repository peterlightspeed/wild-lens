import { apiJson } from './client';

const SESSION_KEY = 'wl_chat_session';

export function getChatSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * `history` is the last few {role, content} turns already shown in the UI
 * (oldest first, NOT including the new message). Backend appends the new
 * message and returns { reply, session_id, remaining_today }.
 */
export async function sendChatMessage(message, history) {
  return apiJson('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history: history.slice(-10),
      session_id: getChatSessionId(),
    }),
  });
}
