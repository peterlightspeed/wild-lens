import { useChatConversation } from '../hooks/useChatConversation';
import ChatConversation from '../components/ChatConversation';
import Seo from '../components/Seo';

export default function Chat() {
  const { messages, send, sending, error, remaining } = useChatConversation();

  return (
    <div className="wl-chat-page-shell">
      <Seo
        title="Ask WildLens — Chat with the WildLens Assistant"
        description="Ask the WildLens AI assistant about any species — diet, habitat, behavior, identification tips, and conservation status."
        path="/chat"
      />
      <span className="kicker"><span className="dot"></span> AI Assistant</span>
      <h1 className="mt-3 mb-2" style={{ fontSize: '1.9rem' }}>Ask WildLens</h1>
      <p className="mb-4">Guest-accessible, like the rest of WildLens — sign in for a higher daily message limit.</p>
      <div className="wl-chat-panel wl-chat-page-panel">
        <ChatConversation messages={messages} sending={sending} error={error} remaining={remaining} onSend={send} />
      </div>
    </div>
  );
}
