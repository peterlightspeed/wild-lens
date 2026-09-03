from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_guest_gets_a_reply():
    # No provider keys are set in the test environment, so this exercises
    # the full fallback chain down to MockChatProvider — confirming the
    # endpoint is guest-accessible and never 500s even with zero keys.
    res = client.post("/api/chat", json={
        "message": "What does a red fox eat?",
        "history": [],
        "session_id": "test-session-1",
    })
    assert res.status_code == 200
    body = res.json()
    assert body["reply"]
    assert body["session_id"] == "test-session-1"
    assert isinstance(body["remaining_today"], int)


def test_chat_rejects_empty_message():
    res = client.post("/api/chat", json={"message": "", "history": [], "session_id": "test-session-2"})
    assert res.status_code == 422
