import { useEffect, useRef, useState } from 'react';

export default function ChatConversation({ messages, sending, error, remaining, onSend }) {
  const [draft, setDraft] = useState('');
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sending]);

  const submit = () => {
    if (!draft.trim() || sending) return;
    onSend(draft);
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <>
      <div className="wl-chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`wl-chat-msg ${m.role}`}>
            <div className="wl-chat-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="wl-chat-msg assistant">
            <div className="wl-chat-bubble wl-chat-typing"><span></span><span></span><span></span></div>
          </div>
        )}
        {error && <div className="wl-chat-error"><i className="bi bi-exclamation-triangle"></i> {error}</div>}
      </div>
      {remaining !== null && remaining <= 3 && (
        <div className="wl-chat-remaining">{remaining} message{remaining === 1 ? '' : 's'} left today</div>
      )}
      <div className="wl-chat-input-row">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask about any species…"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="wl-chat-send" onClick={submit} disabled={sending || !draft.trim()} aria-label="Send message">
          <i className="bi bi-send-fill"></i>
        </button>
      </div>
    </>
  );
}
