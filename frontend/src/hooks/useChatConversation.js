import { useCallback, useState } from 'react';
import { sendChatMessage } from '../api/chat';

const GREETING = {
  role: 'assistant',
  content: "Hi! I'm the WildLens Assistant — ask me anything about wildlife: identification tips, diet, habitat, behavior, or conservation status.",
};

export function useChatConversation() {
  const [messages, setMessages] = useState([GREETING]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);

  const send = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const historyForApi = messages.filter((m) => m !== GREETING).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setSending(true);
    try {
      const data = await sendChatMessage(trimmed, historyForApi);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      setRemaining(data.remaining_today);
    } catch (err) {
      setError(err.message || 'Could not reach the chat assistant.');
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  return { messages, send, sending, error, remaining };
}
