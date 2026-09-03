import { useState } from 'react';
import { useChatConversation } from '../hooks/useChatConversation';
import ChatConversation from './ChatConversation';

/**
 * Floating chat bubble, bottom-right, site-wide (mounted in Layout — see
 * Part 2 of the conversion brief). Kept as a bubble rather than forcing a
 * page navigation so it's usable mid-task (e.g. while looking at an
 * Encyclopedia entry). A dedicated /chat page also exists (better for
 * small screens / deep-linking a conversation) and reuses the same
 * <ChatConversation> — this component just adds the launcher chrome.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, send, sending, error, remaining } = useChatConversation();

  return (
    <>
      {open && (
        <div className="wl-chat-panel" role="dialog" aria-label="Ask WildLens chat">
          <div className="wl-chat-head">
            <div className="wl-chat-head-title">
              <span className="wl-chat-head-icon"><i className="bi bi-stars"></i></span>
              Ask WildLens
            </div>
            <button className="btn-icon-wl" style={{ width: 32, height: 32 }} aria-label="Close chat" onClick={() => setOpen(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <ChatConversation messages={messages} sending={sending} error={error} remaining={remaining} onSend={send} />
        </div>
      )}
      <button className="wl-chat-fab" aria-label={open ? 'Close chat' : 'Open Ask WildLens chat'} onClick={() => setOpen((v) => !v)}>
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </button>
    </>
  );
}
